"""Database connection pool and schema bootstrap."""
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


def get_conn():
    """Yield a pooled connection (used as a FastAPI dependency)."""
    with pool.connection() as conn:
        yield conn


pool = None


def init_db(app):
    """Create the pool and apply the schema on startup."""
    global pool
    pool = psycopg_pool.ConnectionPool(DATABASE_URL, open=True, min_size=1, max_size=10)

    schema = SCHEMA_PATH.read_text()
    with pool.connection() as conn:
        conn.execute(schema)
    print("[db] schema ready")
