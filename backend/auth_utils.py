import os
import json
import hmac
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import users_collection

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "kharcha-super-secret-key-2026-july-10")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 900       # 15 minutes
REFRESH_TOKEN_EXPIRE_SECONDS = 604800   # 7 days (1 week)

security = HTTPBearer()

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

# --- PASSWORD HASHING (STORES PLAIN TEXT BY REQUEST) ---
def hash_password(password: str) -> tuple[str, str]:
    """
    Returns password as plain text and an empty string for salt.
    """
    return password, ""

def verify_password(plain_password: str, hashed_password: str, salt_hex: str) -> bool:
    """
    Verify a plain text password.
    """
    return plain_password == hashed_password

# --- JWT CREATION & VERIFICATION ---
def create_jwt(payload: dict, expires_in_seconds: int) -> str:
    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    header_b64 = base64url_encode(header_json)
    
    exp_time = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    payload_copy = payload.copy()
    payload_copy["exp"] = int(exp_time.timestamp())
    payload_json = json.dumps(payload_copy, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64url_encode(payload_json)
    
    signature_base = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_base, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        signature_base = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        expected_signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_base, hashlib.sha256).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        payload_bytes = base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        exp = payload.get("exp")
        if not exp or datetime.utcnow().timestamp() > exp:
            return None
            
        return payload
    except Exception:
        return None

def create_access_token(user_id: str) -> str:
    return create_jwt({"sub": user_id, "type": "access"}, ACCESS_TOKEN_EXPIRE_SECONDS)

def create_refresh_token(user_id: str) -> str:
    return create_jwt({"sub": user_id, "type": "refresh"}, REFRESH_TOKEN_EXPIRE_SECONDS)

# --- FASTAPI DEPENDENCY ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = verify_jwt(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification",
        )
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
