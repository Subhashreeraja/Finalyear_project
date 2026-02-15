from flask import Blueprint, request, jsonify
from app.services.twilio_service import send_sms_otp, send_whatsapp_alert

bp = Blueprint("alerts", __name__)

@bp.route("/sms", methods=["POST"])
def send_sms():
    data = request.get_json() or {}
    to = data.get("to")
    message = data.get("message", "CrowdAi alert")
    if not to:
        return jsonify({"error": "Missing 'to' number"}), 400
    ok = send_sms_otp(to, message) if len(message) <= 6 and message.isdigit() else False
    # For generic SMS use Twilio client directly in a similar helper
    return jsonify({"success": ok})

@bp.route("/whatsapp", methods=["POST"])
def send_whatsapp():
    data = request.get_json() or {}
    to = data.get("to")
    message = data.get("message", "CrowdAi alert")
    if not to:
        return jsonify({"error": "Missing 'to' number"}), 400
    ok = send_whatsapp_alert(to, message)
    return jsonify({"success": ok})
