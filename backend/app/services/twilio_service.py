import os
from twilio.rest import Client

def get_twilio_client():
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    if not sid or not token:
        return None
    return Client(sid, token)

def send_sms_otp(to_number: str, otp: str) -> bool:
    client = get_twilio_client()
    if not client:
        return False
    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    if not from_number:
        return False
    try:
        client.messages.create(
            body=f"Your CrowdAi verification code is: {otp}. Valid for 10 minutes.",
            from_=from_number,
            to=to_number if to_number.startswith("+") else f"+{to_number}",
        )
        return True
    except Exception:
        return False

def send_whatsapp_alert(to_number: str, message: str) -> bool:
    client = get_twilio_client()
    if not client:
        return False
    from_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
    if not from_number:
        return False
    to = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
    try:
        client.messages.create(body=message, from_=from_number, to=to)
        return True
    except Exception:
        return False
