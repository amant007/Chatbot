import uuid
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from authentication.serializers import UserSerializer, RegisterSerializer, LoginSerializer
from authentication.auth_backend import generate_jwt_token


class GuestSessionView(APIView):
    """
    Creates an anonymous guest session token allowing seamless chat without registration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        guest_id = f"guest_{uuid.uuid4().hex[:16]}"
        return Response({
            'guest_id': guest_id,
            'is_guest': True,
            'message': 'Guest session initialized successfully'
        })


class RegisterView(APIView):
    """
    Registers a new user and automatically migrates any ongoing guest conversations.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = generate_jwt_token(user.id, user.username, user.is_staff)
            
            # Migrate guest conversations if guest_session_id provided
            guest_session_id = request.data.get('guest_session_id')
            if guest_session_id:
                from conversations.models import Conversation
                Conversation.objects.filter(guest_session_id=guest_session_id, user__isnull=True).update(
                    user=user,
                    guest_session_id=None
                )
                
            return Response({
                'user': UserSerializer(user).data,
                'token': token,
                'message': 'Account registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Authenticates user, issues JWT, and optionally migrates guest conversations.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if not user:
                return Response({'error': 'Invalid username or password credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
                
            token = generate_jwt_token(user.id, user.username, user.is_staff)
            
            # Migrate guest conversations if guest_session_id provided
            guest_session_id = serializer.validated_data.get('guest_session_id')
            if guest_session_id:
                from conversations.models import Conversation
                Conversation.objects.filter(guest_session_id=guest_session_id, user__isnull=True).update(
                    user=user,
                    guest_session_id=None
                )
                
            return Response({
                'user': UserSerializer(user).data,
                'token': token,
                'message': 'Logged in successfully'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """
    Returns current authenticated user profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
