import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict

import jwt
from flask import Blueprint, Response, current_app, jsonify, request

from app.models.admin_models import (
    AdminUser,
    CrowdStatusResponse,
    OverviewResponse,
    PlaceOverview,
    PlaceType,
)
from app.services.camera_service import (
    generate_mjpeg_stream,
    list_cameras,
    summarize_crowd,
)
from app.services.twilio_service import send_whatsapp_alert


bp = Blueprint("admin", __name__)

PLACE_TYPES: tuple[PlaceType, ...] = (
    "railway_station",
    "mall",
    "market",
    "bus_stand",
    "temple",
)
_gate_status_by_place: Dict[str, str] = {pt: "closed" for pt in PLACE_TYPES}


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
    # Per-place stats: place_type -> (total_cameras, active, crowd_count)
    by_place: Dict[str, tuple[int, int, int]] = {pt: (0, 0, 0) for pt in PLACE_TYPES}
    for cam in cams:
        state = get_camera_state(cam.id)
        is_active = bool(state.get("active"))
        count = int(state.get("people_count", 0) or 0)
        if is_active:
            active += 1
        total_count += count
        tc, ac, cc = by_place.get(cam.place_type, (0, 0, 0))
        by_place[cam.place_type] = (tc + 1, ac + (1 if is_active else 0), cc + count)

    overcrowded = total_count > int(os.getenv("CROWD_THRESHOLD", "80"))
    places = [
        PlaceOverview(
            place_type=pt,
            total_cameras=by_place[pt][0],
            active_cameras=by_place[pt][1],
            total_crowd_count=by_place[pt][2],
            gate_status=_gate_status_by_place.get(pt, "closed"),  # type: ignore[arg-type]
        )
        for pt in PLACE_TYPES
    ]
    resp = OverviewResponse(
        total_cameras=len(cams),
        active_cameras=active,
        total_crowd_count=total_count,
        overcrowded=overcrowded,
        gate_status="open",  # legacy; use per-place
        places=places,
    )
    return jsonify(
        {
            "totalCameras": resp.total_cameras,
            "activeCameras": resp.active_cameras,
            "totalCrowdCount": resp.total_crowd_count,
            "overcrowded": resp.overcrowded,
            "gateStatus": resp.gate_status.capitalize(),
            "places": [
                {
                    "placeType": p.place_type,
                    "totalCameras": p.total_cameras,
                    "activeCameras": p.active_cameras,
                    "totalCrowdCount": p.total_crowd_count,
                    "gateStatus": p.gate_status.capitalize(),
                }
                for p in resp.places
            ],
        }
    )


@bp.route("/cameras", methods=["GET"])
@admin_required
def cameras():
    items = [
        {"id": cam.id, "name": cam.name, "video": cam.video, "placeType": cam.place_type}
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
                    "placeType": s.place_type,
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
    global _gate_status_by_place
    data = request.get_json() or {}
    place_type = (data.get("placeType") or data.get("place_type") or "").strip()
    action = (data.get("action") or "").strip().lower()
    if place_type not in PLACE_TYPES:
        return jsonify({"error": "Invalid placeType. Use railway_station, mall, market, bus_stand, or temple."}), 400
    if action not in ("open", "close"):
        return jsonify({"error": "Invalid action. Use 'open' or 'close'."}), 400
    _gate_status_by_place[place_type] = "open" if action == "open" else "closed"
    return jsonify({"placeType": place_type, "gateStatus": _gate_status_by_place[place_type].capitalize()})

