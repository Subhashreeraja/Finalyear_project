import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict

import jwt
from flask import Blueprint, Response, current_app, jsonify, request

from app.models.admin_models import AdminUser, CrowdStatusResponse, OverviewResponse
from app.services.camera_service import (
    generate_mjpeg_stream,
    list_cameras,
    summarize_crowd,
)
from app.services.twilio_service import send_whatsapp_alert


bp = Blueprint("admin", __name__)


_gate_status: str = "closed"


def _get_admin_credentials() -> tuple[str, str]:
    email = os.getenv("ADMIN_EMAIL", "admin@crowdai.local")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    return email, password


def _encode_jwt(admin: AdminUser) -> str:
    secret = current_app.config.get("SECRET_KEY", "dev-secret-key")
    payload = {
        "sub": admin.email,
        "role": admin.role,
        "name": admin.name,
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def _decode_jwt(token: str) -> Dict[str, Any] | None:
    secret = current_app.config.get("SECRET_KEY", "dev-secret-key")
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def _get_token_from_header() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _get_token_from_header()
        if not token:
            return jsonify({"error": "Missing Authorization header"}), 401
        payload = _decode_jwt(token)
        if not payload or payload.get("role") != "admin":
            return jsonify({"error": "Invalid or expired token"}), 401
        return fn(*args, **kwargs)

    return wrapper


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    admin_email, admin_password = _get_admin_credentials()
    if email != admin_email.lower() or password != admin_password:
        return jsonify({"error": "Invalid admin credentials"}), 401

    admin = AdminUser(email=admin_email, name="System Admin")
    token = _encode_jwt(admin)
    return jsonify(
        {
            "token": token,
            "admin": {
                "email": admin.email,
                "name": admin.name,
                "role": admin.role,
            },
        }
    )


@bp.route("/overview", methods=["GET"])
def overview():
    from app.services.camera_service import get_camera_state

    cams = list(list_cameras())
    active = 0
    total_count = 0
    for cam in cams:
        state = get_camera_state(cam.id)
        if state.get("active"):
            active += 1
        total_count += int(state.get("people_count", 0) or 0)

    overcrowded = total_count > int(os.getenv("CROWD_THRESHOLD", "80"))
    resp = OverviewResponse(
        total_cameras=len(cams),
        active_cameras=active,
        total_crowd_count=total_count,
        overcrowded=overcrowded,
        gate_status=_gate_status,  # type: ignore[arg-type]
    )
    return jsonify(
        {
            "totalCameras": resp.total_cameras,
            "activeCameras": resp.active_cameras,
            "totalCrowdCount": resp.total_crowd_count,
            "overcrowded": resp.overcrowded,
            "gateStatus": resp.gate_status.capitalize(),
        }
    )


@bp.route("/cameras", methods=["GET"])
@admin_required
def cameras():
    items = [
        {"id": cam.id, "name": cam.name, "video": cam.video}
        for cam in list_cameras()
    ]
    return jsonify(items)


@bp.route("/stream/<int:camera_id>", methods=["GET"])
def stream(camera_id: int):
    return Response(
        generate_mjpeg_stream(camera_id),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@bp.route("/crowd-status", methods=["GET"])
def crowd_status():
    statuses, total, overall = summarize_crowd()
    threshold = int(os.getenv("CROWD_THRESHOLD", "80"))
    alert_triggered = total > threshold
    whatsapp_sent = None

    if alert_triggered:
        to = os.getenv("ALERT_WHATSAPP_TO")
        if to:
            message = (
                f"CrowdAi Alert: Overcrowding detected. "
                f"Total people count {total} exceeds threshold {threshold}."
            )
            whatsapp_sent = send_whatsapp_alert(to, message)

    resp = CrowdStatusResponse(
        cameras=statuses,
        total_count=total,
        status=overall,
        alert_triggered=alert_triggered,
        whatsapp_sent=whatsapp_sent,
    )

    return jsonify(
        {
            "cameras": [
                {
                    "id": s.id,
                    "name": s.name,
                    "peopleCount": s.people_count,
                    "status": s.status,
                }
                for s in resp.cameras
            ],
            "totalCount": resp.total_count,
            "status": resp.status,
            "alert": {
                "threshold": threshold,
                "alertTriggered": resp.alert_triggered,
                "whatsappSent": resp.whatsapp_sent,
            },
        }
    )


@bp.route("/gate-control", methods=["POST"])
@admin_required
def gate_control():
    global _gate_status
    data = request.get_json() or {}
    action = (data.get("action") or "").strip().lower()
    if action not in ("open", "close"):
        return jsonify({"error": "Invalid action. Use 'open' or 'close'."}), 400
    _gate_status = "open" if action == "open" else "closed"
    return jsonify({"gateStatus": _gate_status.capitalize()})

