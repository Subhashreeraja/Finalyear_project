import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    """Connect using DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (no URL encoding needed)."""
    url = os.getenv("DATABASE_URL")
    if url and "YOUR_POSTGRES_PASSWORD" not in url:
        return psycopg2.connect(url, cursor_factory=RealDictCursor)
    # Fallback: individual vars (password can contain @ : / etc with no encoding)
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD")
    dbname = os.getenv("PGDATABASE", "crowdai")
    if not password:
        return psycopg2.connect(
            f"postgresql://{user}@{host}:{port}/{dbname}",
            cursor_factory=RealDictCursor,
        )
    return psycopg2.connect(
        host=host, port=port, user=user, password=password, dbname=dbname,
        cursor_factory=RealDictCursor,
    )

# Role enum: SYSTEM_ADMIN, LOCATION_ADMIN, PUBLIC (Guest has no account)
# ADMIN/MONITOR kept for backward compatibility
ROLES = ("SYSTEM_ADMIN", "LOCATION_ADMIN", "PUBLIC", "ADMIN", "MONITOR")


def ensure_database():
    """Create the database if it does not exist."""
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD")
    dbname = os.getenv("PGDATABASE", "crowdai")
    conn = psycopg2.connect(
        host=host, port=port, user=user, password=password, dbname="postgres",
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
    if not cur.fetchone():
        cur.execute(f'CREATE DATABASE "{dbname}"')
    cur.close()
    conn.close()


def init_db():
    """Ensure users table exists. Does NOT drop existing data."""
    ensure_database()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS otp_codes;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            mobile VARCHAR(20) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(30) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'LOCATION_ADMIN', 'PUBLIC', 'ADMIN', 'MONITOR')),
            location VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT FALSE,
            UNIQUE(email),
            UNIQUE(mobile)
        );
    """)
    # Migrate constraint for existing tables (allow new roles)
    try:
        cur.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check")
        cur.execute("""ALTER TABLE users ADD CONSTRAINT users_role_check
            CHECK (role IN ('SYSTEM_ADMIN', 'LOCATION_ADMIN', 'PUBLIC', 'ADMIN', 'MONITOR'))""")
    except Exception:
        pass
    conn.commit()
    cur.close()
    conn.close()
