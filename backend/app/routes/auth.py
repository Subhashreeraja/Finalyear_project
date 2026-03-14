"""Smart City auth: Login and Registration for Admin, Monitor, Public User."""
import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from app.db import get_conn, init_db, ROLES
from app.auth_utils import encode_jwt

bp = Blueprint("auth", __name__)

# Validation helpers
def normalize_mobile(mobile: str) -> str:
    return re.sub(r"\D", "", str(mobile or "").strip())

def is_valid_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, (email or "").strip().lower()))

def validate_password(pwd: str) -> tuple[bool, str]:
    if len(pwd) < 6:
        return False, "Password must be at least 6 characters"
    return True, ""

@bp.route("/register", methods=["POST"])
def register():
    """Public User self-registration. Requires name, email, mobile, password."""
    init_db()
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    mobile = normalize_mobile(data.get("mobile") or "")
    password = (data.get("password") or "").strip()

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    if len(mobile) < 10:
        return jsonify({"error": "Valid 10-digit mobile number is required"}), 400
    ok, msg = validate_password(password)
    if not ok:
        return jsonify({"error": msg}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s OR mobile = %s", (email, mobile))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Email or mobile already registered"}), 400

    password_hash = generate_password_hash(password)
    cur.execute(
        """INSERT INTO users (name, email, mobile, password_hash, role, verified)
           VALUES (%s, %s, %s, %s, 'PUBLIC', FALSE)
           RETURNING id, name, email, mobile, role, location, verified""",
        (name, email, mobile, password_hash),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    user = {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "mobile": row["mobile"],
        "role": row["role"],
        "location": row["location"],
        "verified": bool(row["verified"]),
    }
    token = encode_jwt(
        user_id=int(row["id"]),
        email=row["email"],
        role=row["role"],
        name=row["name"],
        location=row["location"],
    )
    return jsonify({"user": user, "token": token})


@bp.route("/login", methods=["POST"])
def login():
    """Login for Admin, Monitor, Public User. All 4 fields required. For Public User, all must match."""
    init_db()
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    mobile = normalize_mobile(data.get("mobile") or "")
    password = (data.get("password") or "").strip()

    if not all([name, email, mobile, password]):
        return jsonify({"error": "Name, email, mobile and password are required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    if len(mobile) < 10:
        return jsonify({"error": "Valid 10-digit mobile number is required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """SELECT id, name, email, mobile, password_hash, role, location, verified
           FROM users WHERE email = %s""",
        (email,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # For PUBLIC users: validate that name and mobile also match
    if row["role"] == "PUBLIC":
        if row["name"].strip().lower() != name.lower():
            return jsonify({"error": "Invalid credentials"}), 401
        if normalize_mobile(row["mobile"]) != mobile:
            return jsonify({"error": "Invalid credentials"}), 401

    # For Admin/Monitor: name and mobile are optional extra checks; we already matched email+password
    # Per requirements, all 4 fields are used for login - we validate name and mobile match for consistency
    if row["name"].strip().lower() != name.lower():
        return jsonify({"error": "Invalid credentials"}), 401
    if normalize_mobile(row["mobile"]) != mobile:
        return jsonify({"error": "Invalid credentials"}), 401

    user = {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "mobile": row["mobile"],
        "role": row["role"],
        "location": row["location"],
        "verified": bool(row["verified"]),
    }
    token = encode_jwt(
        user_id=row["id"],
        email=row["email"],
        role=row["role"],
        name=row["name"],
        location=row["location"],
    )
    return jsonify({"user": user, "token": token})
