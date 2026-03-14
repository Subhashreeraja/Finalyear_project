"""Seed System Admin and Location Admin accounts. Run from backend/: python scripts/seed_users.py"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from dotenv import load_dotenv
env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)

from werkzeug.security import generate_password_hash
from app.db import get_conn, init_db

def seed():
    init_db()
    conn = get_conn()
    cur = conn.cursor()

    # System Admin - full city access
    sys_admin_email = os.getenv("SYSTEM_ADMIN_EMAIL", "systemadmin@smartcity.local")
    sys_admin_password = os.getenv("SYSTEM_ADMIN_PASSWORD", "sysadmin123")
    sys_admin_name = os.getenv("SYSTEM_ADMIN_NAME", "System Admin")
    sys_admin_mobile = os.getenv("SYSTEM_ADMIN_MOBILE", "1234567890")

    # Location Admins - tied to location (mall_admin, temple_admin, railway_admin, etc.)
    location_admins = [
        ("mall_admin@smartcity.local", "malladmin123", "Mall Location Admin", "8888888881", "mall"),
        ("temple_admin@smartcity.local", "templeadmin123", "Temple Location Admin", "8888888882", "temple"),
        ("railway_admin@smartcity.local", "railwayadmin123", "Railway Location Admin", "8888888883", "railway_station"),
        ("market_admin@smartcity.local", "marketadmin123", "Market Location Admin", "8888888884", "market"),
        ("busstand_admin@smartcity.local", "busstandadmin123", "Bus Stand Location Admin", "8888888885", "bus_stand"),
    ]

    pw_sys = generate_password_hash(sys_admin_password)
    cur.execute(
        """INSERT INTO users (name, email, mobile, password_hash, role, location)
           VALUES (%s, %s, %s, %s, 'SYSTEM_ADMIN', NULL)
           ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name, mobile = EXCLUDED.mobile, password_hash = EXCLUDED.password_hash, role = 'SYSTEM_ADMIN'""",
        (sys_admin_name, sys_admin_email, sys_admin_mobile, pw_sys),
    )

    for email, pwd, name, mobile, loc in location_admins:
        pw = generate_password_hash(pwd)
        cur.execute(
            """INSERT INTO users (name, email, mobile, password_hash, role, location)
               VALUES (%s, %s, %s, %s, 'LOCATION_ADMIN', %s)
               ON CONFLICT (email) DO UPDATE SET
               name = EXCLUDED.name, mobile = EXCLUDED.mobile, password_hash = EXCLUDED.password_hash, location = EXCLUDED.location, role = 'LOCATION_ADMIN'""",
            (name, email, mobile, pw, loc),
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Seeded System Admin and Location Admin accounts.")
    print(f"  System Admin: {sys_admin_email} / {sys_admin_password}")
    print("  Location Admins:")
    for email, pwd, _, _, loc in location_admins:
        print(f"    {loc}: {email} / {pwd}")

if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        if "no password supplied" in str(e).lower() or "fe_sendauth" in str(e).lower():
            print("Database connection failed: no password supplied.")
            print("Ensure backend/.env has PGPASSWORD or DATABASE_URL set.")
        else:
            raise
