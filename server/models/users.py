"""User and rider database access."""
import uuid
from datetime import datetime

import psycopg


def _row_to_dict(row: psycopg.Row) -> dict:
    return dict(row._asdict()) if hasattr(row, "_asdict") else dict(row)


def user_public(row) -> dict:
    """User fields safe to return to the client (never the password hash)."""
    u = _row_to_dict(row)
    return {
        "id": u["id"],
        "name": u["name"],
        "phone": u["phone"],
        "email": u["email"],
        "role": u["role"],
        "createdAt": u["created_at"],
    }


def find_user_by_email(conn, email: str):
    return conn.execute(
        "SELECT * FROM users WHERE email = %s", (email,)
    ).fetchone()


def insert_user(conn, *, name: str, phone: str, email: str, password_hash: str, role: str):
    return conn.execute(
        """INSERT INTO users (name, phone, email, password_hash, role)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING *""",
        (name, phone, email, password_hash, role),
    ).fetchone()


def insert_rider_profile(conn, user_id: str, motorcycle_number: str | None, motorcycle_model: str | None):
    conn.execute(
        """INSERT INTO riders (user_id, motorcycle_number, motorcycle_model)
           VALUES (%s, %s, %s)""",
        (user_id, motorcycle_number, motorcycle_model),
    )


def find_user_by_id(conn, user_id: str):
    try:
        uuid.UUID(str(user_id))
    except ValueError:
        return None
    return conn.execute("SELECT * FROM users WHERE id = %s", (user_id,)).fetchone()


def find_rider_by_user_id(conn, user_id: str):
    return conn.execute("SELECT * FROM riders WHERE user_id = %s", (user_id,)).fetchone()


def update_rider_status(conn, user_id: str, availability_status: str):
    return conn.execute(
        """UPDATE riders
           SET availability_status = %s, updated_at = now()
           WHERE user_id = %s
           RETURNING *""",
        (availability_status, user_id),
    ).fetchone()
