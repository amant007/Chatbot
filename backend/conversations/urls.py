from django.urls import path, include
from rest_framework.routers import DefaultRouter
from conversations.views import ConversationViewSet, SendMessageView, FeedbackView

router = DefaultRouter()
router.register(r'threads', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('send/', SendMessageView.as_view(), name='chat-send'),
    path('feedback/', FeedbackView.as_view(), name='chat-feedback'),
    path('', include(router.urls)),
]
