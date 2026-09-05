from django.contrib import admin
from django.urls import path
from chatbot.views import (
    users_list,
    signup,
    login,
    conversations,
    rename_conversation,
    delete_conversation
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/users/', users_list),
    path('api/signup/', signup),
    path('api/login/', login),

    path('api/conversations/', conversations),
    path(
        'api/conversations/<int:conversation_id>/rename/',
        rename_conversation
    ),
    path(
        'api/conversations/<int:conversation_id>/delete/',
        delete_conversation
    ),
]