import time
import numpy as np
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, Sum, Q
from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from core.models import RequestLog, BlacklistEntry
from conversations.models import Conversation, Message, UserFeedback
from documents.models import Document, DocumentChunk

class ObservabilityMetricsView(APIView):
    """
    Returns live aggregated system telemetry, latency distributions (p50/p95),
    cache hit rates, token metrics, and user satisfaction ratings.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        last_24h = now - timedelta(hours=24)

        # 1. Request logs in last 24h
        logs = RequestLog.objects.filter(created_at__gte=last_24h)
        total_requests = logs.count()

        latencies = list(logs.values_list('response_time_ms', flat=True))
        if latencies:
            avg_latency = round(float(np.mean(latencies)), 2)
            p50_latency = round(float(np.percentile(latencies, 50)), 2)
            p95_latency = round(float(np.percentile(latencies, 95)), 2)
            p99_latency = round(float(np.percentile(latencies, 99)), 2)
        else:
            avg_latency, p50_latency, p95_latency, p99_latency = 0.0, 0.0, 0.0, 0.0

        # Cache Hit Rate
        cache_hits = logs.filter(cache_hit=True).count()
        cache_hit_rate = round((cache_hits / total_requests * 100), 1) if total_requests > 0 else 0.0

        # Error Rate
        error_count = logs.filter(status_code__gte=400).count()
        error_rate = round((error_count / total_requests * 100), 1) if total_requests > 0 else 0.0

        # Token Metrics
        messages_24h = Message.objects.filter(created_at__gte=last_24h)
        token_stats = messages_24h.aggregate(
            total_prompt=Sum('prompt_tokens'),
            total_completion=Sum('completion_tokens'),
        )
        total_prompt_tokens = token_stats['total_prompt'] or 0
        total_completion_tokens = token_stats['total_completion'] or 0
        total_tokens = total_prompt_tokens + total_completion_tokens

        # User Feedback Analytics
        feedback_qs = UserFeedback.objects.all()
        total_feedback = feedback_qs.count()
        positive_feedback = feedback_qs.filter(rating_type='thumbs_up').count()
        satisfaction_rate = round((positive_feedback / total_feedback * 100), 1) if total_feedback > 0 else 100.0
        avg_stars = round(feedback_qs.aggregate(Avg('stars'))['stars__avg'] or 5.0, 1)

        # Time Series Trend (Hourly Buckets)
        time_series = []
        for i in range(12, -1, -1):
            start_hour = now - timedelta(hours=i+1)
            end_hour = now - timedelta(hours=i)
            hour_logs = RequestLog.objects.filter(created_at__gte=start_hour, created_at__lt=end_hour)
            h_count = hour_logs.count()
            h_lat = hour_logs.aggregate(Avg('response_time_ms'))['response_time_ms__avg'] or 0.0
            time_series.append({
                'time': end_hour.strftime('%H:00'),
                'requests': h_count,
                'avg_latency': round(h_lat, 1)
            })

        # Top recent slow requests
        slow_requests = RequestLog.objects.order_by('-response_time_ms')[:8].values(
            'trace_id', 'method', 'path', 'status_code', 'response_time_ms', 'db_query_count', 'created_at'
        )

        return Response({
            'overview': {
                'total_requests': total_requests,
                'avg_latency_ms': avg_latency,
                'p50_latency_ms': p50_latency,
                'p95_latency_ms': p95_latency,
                'p99_latency_ms': p99_latency,
                'cache_hit_rate_pct': cache_hit_rate,
                'error_rate_pct': error_rate,
                'total_tokens': total_tokens,
                'prompt_tokens': total_prompt_tokens,
                'completion_tokens': total_completion_tokens,
                'satisfaction_rate_pct': satisfaction_rate,
                'total_feedback': total_feedback,
                'avg_stars': avg_stars,
                'total_conversations': Conversation.objects.count(),
                'total_documents': Document.objects.count(),
                'total_chunks': DocumentChunk.objects.count(),
            },
            'time_series': time_series,
            'slow_requests': list(slow_requests),
        })


class TraceInspectorView(APIView):
    """
    Search and inspect distributed traces and request execution details.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        trace_id = request.query_params.get('trace_id', '').strip()
        search_query = request.query_params.get('search', '').strip()
        limit = int(request.query_params.get('limit', 25))

        qs = RequestLog.objects.all()
        if trace_id:
            qs = qs.filter(trace_id__icontains=trace_id)
        elif search_query:
            qs = qs.filter(Q(path__icontains=search_query) | Q(trace_id__icontains=search_query) | Q(error_message__icontains=search_query))

        traces = qs[:limit].values(
            'id', 'trace_id', 'method', 'path', 'status_code',
            'response_time_ms', 'db_query_count', 'ip_address',
            'user_agent', 'cache_hit', 'error_message', 'created_at'
        )
        return Response({'count': len(traces), 'results': list(traces)})


class FeedbackListView(APIView):
    """
    Returns user feedback records with associated conversation & message context.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        feedbacks = UserFeedback.objects.select_related('message', 'message__conversation').order_by('-created_at')[:50]
        results = []
        for fb in feedbacks:
            results.append({
                'id': fb.id,
                'rating_type': fb.rating_type,
                'stars': fb.stars,
                'tags': fb.tags,
                'comment': fb.comment,
                'created_at': fb.created_at,
                'message_id': fb.message.id,
                'message_content': fb.message.content[:100],
                'conversation_id': fb.message.conversation.id,
                'conversation_title': fb.message.conversation.title,
                'trace_id': fb.message.trace_id,
            })
        return Response({'results': results})


class CacheManagementView(APIView):
    """
    Cache status inspection, key clearing, and benchmark latency test.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        t0 = time.perf_counter()
        cache.set('omnichat_health_ping', 'ok', timeout=10)
        ping_val = cache.get('omnichat_health_ping')
        t1 = time.perf_counter()
        cache_latency_ms = round((t1 - t0) * 1000, 2)

        return Response({
            'cache_engine': getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', 'Unknown'),
            'cache_operational': ping_val == 'ok',
            'ping_latency_ms': cache_latency_ms,
        })

    def post(self, request):
        action = request.data.get('action')
        if action == 'flush':
            cache.clear()
            return Response({'message': 'All cache entries successfully flushed.'})
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class BlacklistManagementView(APIView):
    """
    Manage IP & Token Blacklist for API security & system design demonstration.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        entries = BlacklistEntry.objects.all().order_by('-created_at')
        return Response({
            'count': entries.count(),
            'results': [
                {
                    'id': e.id,
                    'entry_type': e.entry_type,
                    'value': e.value,
                    'reason': e.reason,
                    'is_active': e.is_active,
                    'created_at': e.created_at
                } for e in entries
            ]
        })

    def post(self, request):
        entry_type = request.data.get('entry_type', 'ip')
        value = request.data.get('value', '').strip()
        reason = request.data.get('reason', 'Administrator manual block')

        if not value:
            return Response({'error': 'Value is required'}, status=status.HTTP_400_BAD_REQUEST)

        entry, created = BlacklistEntry.objects.update_or_create(
            value=value,
            defaults={'entry_type': entry_type, 'reason': reason, 'is_active': True}
        )
        cache.delete(f"blacklist_{entry_type}_{value}")
        return Response({
            'message': f'{entry_type.upper()} successfully blacklisted',
            'entry': {'id': entry.id, 'value': entry.value, 'is_active': entry.is_active}
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        entry_id = request.data.get('id')
        if not entry_id:
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            entry = BlacklistEntry.objects.get(id=entry_id)
            cache.delete(f"blacklist_{entry.entry_type}_{entry.value}")
            entry.delete()
            return Response({'message': 'Blacklist entry removed.'})
        except BlacklistEntry.DoesNotExist:
            return Response({'error': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)
