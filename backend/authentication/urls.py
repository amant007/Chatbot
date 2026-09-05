from django.urls import path
from authentication.views import GuestSessionView, RegisterView, LoginView, ProfileView

urlpatterns = [
    path('guest/', GuestSessionView.as_view(), name='auth-guest'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
]
