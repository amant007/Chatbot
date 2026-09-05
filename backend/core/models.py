import uuid
from django.db import models

class RequestLog(models.Model):
    """
    Core Observability Model: Captures telemetry data for every incoming API call,
    including distributed Trace ID, microsecond response latency, and DB query profiling.
    """
    trace_id = models.CharField(max_length=64, db_index=True)
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=255, db_index=True)
    status_code = models.IntegerField(db_index=True)
    response_time_ms = models.FloatField(help_text="Execution latency in milliseconds")
    db_query_count = models.IntegerField(default=0, help_text="Number of SQL queries executed")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    cache_hit = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['trace_id']),
            models.Index(fields=['status_code']),
        ]

    def __str__(self):
        return f"[{self.method}] {self.path} ({self.status_code}) - {self.response_time_ms:.2f}ms - {self.trace_id[:8]}"


class BlacklistEntry(models.Model):
    """
    Security & System Design Model: Maintains blacklisted IPs and revoked token JTIs.
    Enables instant eviction and blocking at the API Gateway middleware layer.
    """
    ENTRY_TYPES = [
        ('ip', 'IP Address'),
        ('token', 'JWT Token JTI'),
    ]
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES, default='ip')
    value = models.CharField(max_length=255, unique=True, db_index=True)
    reason = models.TextField(blank=True, default='Suspicious or abusive activity')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.entry_type.upper()}: {self.value} (Active: {self.is_active})"
