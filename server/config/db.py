"""Database connection pool and schema bootstrap."""
import os
from pathlib import Path

import psycopg
import psycopg_pool
from dotenv import load_dotenv
from psycopg.rows import namedtuple_row

# Load .env from repo root or server directory
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"postgresql://postgres:@/okada_connect?host={REPO_ROOT / '.pgserver'}",
)
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


def get_conn():
    """Yield a pooled connection (used as a FastAPI dependency).

    The pool runs in autocommit mode, so each statement is durable the moment
    it executes: a client can never observe a response whose writes are still
    pending, and a failed request can never leave an aborted transaction
    behind for the next one.
    """
    with pool.connection() as conn:
        yield conn


pool = None
_pg_server = None


def init_db(app):
    """Create the pool and apply the schema on startup."""
    global pool, _pg_server
    if ".pgserver" in DATABASE_URL:
        import pgserver
        pg_dir = DATABASE_URL.split("host=")[-1].split("&")[0]
        _pg_server = pgserver.get_server(pg_dir)
        try:
            _pg_server.psql("CREATE DATABASE okada_connect;")
        except Exception:
            pass

    pool = psycopg_pool.ConnectionPool(
        DATABASE_URL,
        open=True,
        min_size=1,
        max_size=10,
        # autocommit: every statement lands immediately, so a response can
        # never be sent before the data it describes is committed (FastAPI
        # finalizes generator dependencies after the response is sent).
        kwargs={"row_factory": namedtuple_row, "autocommit": True},
    )

    schema = SCHEMA_PATH.read_text()
    with pool.connection() as conn:
        conn.execute(schema)
    print("[db] schema ready")
