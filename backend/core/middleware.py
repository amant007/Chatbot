import time
import uuid
import logging
from django.db import connection
from django.http import JsonResponse
from django.core.cache import cache
from core.models import RequestLog, BlacklistEntry

logger = logging.getLogger(__name__)

class TraceIDMiddleware:
    """
    Assigns or preserves a unique distributed Trace-ID (`X-Trace-ID`) for every request.
    Attaches `request.trace_id` for use across all service layers and API serializers.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        trace_id = request.headers.get('X-Trace-ID') or str(uuid.uuid4())
        request.trace_id = trace_id

        # Check IP blacklist
        ip = self._get_client_ip(request)
        if ip and self._is_blacklisted_ip(ip):
            response = JsonResponse({
                'error': 'Forbidden: IP address has been blacklisted by administrator.',
                'trace_id': trace_id
            }, status=403)
            response['X-Trace-ID'] = trace_id
            return response

        response = self.get_response(request)
        response['X-Trace-ID'] = trace_id
        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def _is_blacklisted_ip(self, ip):
        cache_key = f"blacklist_ip_{ip}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        is_blocked = BlacklistEntry.objects.filter(entry_type='ip', value=ip, is_active=True).exists()
        cache.set(cache_key, is_blocked, timeout=60) # Cache blacklist check for 60s
        return is_blocked


class ObservabilityMiddleware:
    """
    Observability & System Design Telemetry Middleware.
    Profiles request latency (ms), DB query execution counts, HTTP status codes,
    and writes metrics asynchronously/directly to the RequestLog table.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Ignore telemetry for static/admin assets if desirable
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return self.get_response(request)

        start_time = time.perf_counter()
        initial_queries = len(connection.queries)

        response = None
        error_msg = None

        try:
            response = self.get_response(request)
        except Exception as exc:
            error_msg = str(exc)
            logger.exception("Unhandled server exception during request processing")
            raise exc
        finally:
            end_time = time.perf_counter()
            duration_ms = round((end_time - start_time) * 1000, 2)
            db_queries = len(connection.queries) - initial_queries

            status_code = response.status_code if response else 500
            cache_hit = getattr(request, '_cache_hit', False)

            if response:
                response['X-Response-Time-Ms'] = str(duration_ms)
                response['X-Cache-Status'] = 'HIT' if cache_hit else 'MISS'

            # Persist telemetry record for observability analytics
            try:
                ip = self._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
                
                # Only log API paths to avoid polluting telemetry with dev pings
                if request.path.startswith('/api/'):
                    RequestLog.objects.create(
                        trace_id=getattr(request, 'trace_id', str(uuid.uuid4())),
                        method=request.method,
                        path=request.path,
                        status_code=status_code,
                        response_time_ms=duration_ms,
                        db_query_count=db_queries,
                        ip_address=ip,
                        user_agent=user_agent,
                        cache_hit=cache_hit,
                        error_message=error_msg
                    )
            except Exception as log_err:
                logger.error(f"Failed to record telemetry RequestLog: {log_err}")

        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
