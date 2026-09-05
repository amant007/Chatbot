from django.urls import path
from admin_dashboard.views import (
    ObservabilityMetricsView,
    TraceInspectorView,
    FeedbackListView,
    CacheManagementView,
    BlacklistManagementView
)

urlpatterns = [
    path('metrics/', ObservabilityMetricsView.as_view(), name='admin-metrics'),
    path('traces/', TraceInspectorView.as_view(), name='admin-traces'),
    path('feedback/', FeedbackListView.as_view(), name='admin-feedback'),
    path('cache/', CacheManagementView.as_view(), name='admin-cache'),
    path('blacklist/', BlacklistManagementView.as_view(), name='admin-blacklist'),
]
