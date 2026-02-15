import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_conn():
    return psycopg2.connect(
        os.getenv("DATABASE_URL", "postgresql://localhost/crowdai"),
        cursor_factory=RealDictCursor,
    )

def init_db():
    """Create users and OTP tables if not exist."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            mobile VARCHAR(20) UNIQUE NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'registered_user',
            zone_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS otp_codes (
            mobile VARCHAR(20) PRIMARY KEY,
            code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
    """)
    conn.commit()
    cur.close()
    conn.close()
