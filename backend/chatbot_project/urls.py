from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'system': 'OmniChat AI API Gateway',
        'trace_id': getattr(request, 'trace_id', 'none')
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('authentication.urls')),
    path('api/chat/', include('conversations.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/admin-dashboard/', include('admin_dashboard.urls')),
]
