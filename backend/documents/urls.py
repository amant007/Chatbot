from django.urls import path, include
from rest_framework.routers import DefaultRouter
from documents.views import DocumentViewSet, TestRetrievalView

router = DefaultRouter()
router.register(r'items', DocumentViewSet, basename='document')

urlpatterns = [
    path('test-retrieval/', TestRetrievalView.as_view(), name='test-retrieval'),
    path('', include(router.urls)),
]
