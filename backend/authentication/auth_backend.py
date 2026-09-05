import time
import json
import base64
import hmac
import hashlib
import uuid
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.core.cache import cache
from core.models import BlacklistEntry

def generate_jwt_token(user_id, username, is_staff=False, expires_in=86400 * 7):
    """
    Generates a secure signed JWT token (HMAC-SHA256).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    jti = str(uuid.uuid4())
    payload = {
        "user_id": user_id,
        "username": username,
        "is_staff": is_staff,
        "jti": jti,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in
    }
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_jwt_token(token):
    """
    Verifies JWT token signature, expiration, and checks Redis/DB blacklist.
    """
    parts = token.split('.')
    if len(parts) != 3:
        raise AuthenticationFailed("Invalid token structure.")
    
    header_b64, payload_b64, sig_b64 = parts
    def b64_decode(data):
        missing_padding = len(data) % 4
        if missing_padding:
            data += '=' * (4 - missing_padding)
        return base64.urlsafe_b64decode(data)
    
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    
    try:
        actual_sig = b64_decode(sig_b64)
    except Exception:
        raise AuthenticationFailed("Invalid signature encoding.")
        
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise AuthenticationFailed("Token signature mismatch.")
        
    payload = json.loads(b64_decode(payload_b64).decode())
    
    if payload.get('exp', 0) < time.time():
        raise AuthenticationFailed("Token has expired.")
        
    jti = payload.get('jti')
    if jti:
        cache_key = f"blacklist_token_{jti}"
        is_blacklisted = cache.get(cache_key)
        if is_blacklisted is None:
            is_blacklisted = BlacklistEntry.objects.filter(entry_type='token', value=jti, is_active=True).exists()
            cache.set(cache_key, is_blacklisted, timeout=300)
        if is_blacklisted:
            raise AuthenticationFailed("Token has been revoked.")
            
    return payload


class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        try:
            user = User.objects.get(id=payload['user_id'])
            return (user, token)
        except User.DoesNotExist:
            raise AuthenticationFailed("User no longer exists.")
