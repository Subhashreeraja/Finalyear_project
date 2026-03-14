"""JWT and auth helpers for Smart City auth."""
from datetime import datetime, timedelta
from functools import wraps
from typing import Any

import jwt
from flask import jsonify, request


def encode_jwt(user_id: int, email: str, role: str, name: str, location: str | None = None) -> str:
    from flask import current_app
    secret = current_app.config.get("SECRET_KEY", "dev-secret-key")
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "name": name,
        "location": location,
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_jwt(token: str) -> dict[str, Any] | None:
    from flask import current_app
    secret = current_app.config.get("SECRET_KEY", "dev-secret-key")
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def get_token_from_request() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def auth_required(fn):
    """Require any authenticated user (ADMIN, MONITOR, or PUBLIC)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"error": "Missing Authorization header"}), 401
        payload = decode_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        return fn(*args, **kwargs)
    return wrapper


def role_required(*allowed_roles: str):
    """Require user to have one of the given roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = get_token_from_request()
            if not token:
                return jsonify({"error": "Missing Authorization header"}), 401
            payload = decode_jwt(token)
            if not payload:
                return jsonify({"error": "Invalid or expired token"}), 401
            if payload.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


admin_required = lambda fn: role_required("ADMIN", "SYSTEM_ADMIN")(fn)
location_admin_required = lambda fn: role_required("MONITOR", "LOCATION_ADMIN")(fn)
public_required = lambda fn: role_required("PUBLIC")(fn)
