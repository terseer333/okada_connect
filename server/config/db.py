"""Database connection pool and schema bootstrap."""
import os
from pathlib import Path

import psycopg
import psycopg_pool
from dotenv import load_dotenv
from psycopg.rows import namedtuple_row

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
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


def init_db(app):
    """Create the pool and apply the schema on startup."""
    global pool
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
