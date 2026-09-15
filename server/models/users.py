"""User and rider database access."""
import uuid
from datetime import datetime

import psycopg
from psycopg.rows import Row


def _row_to_dict(row: Row) -> dict:
    return dict(row._asdict()) if hasattr(row, "_asdict") else dict(row)


def user_public(row) -> dict:
    """User fields safe to return to the client (never the password hash)."""
    u = _row_to_dict(row)
    return {
        "id": str(u["id"]),
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


def update_rider_location(conn, user_id: str, latitude: float, longitude: float):
    return conn.execute(
        """UPDATE riders
           SET current_latitude = %s, current_longitude = %s,
               location_updated_at = now(), updated_at = now()
           WHERE user_id = %s
           RETURNING *""",
        (latitude, longitude, user_id),
    ).fetchone()


def upsert_customer_location(conn, user_id: str, latitude: float, longitude: float):
    return conn.execute(
        """INSERT INTO customer_locations (user_id, latitude, longitude)
           VALUES (%s, %s, %s)
           ON CONFLICT (user_id)
           DO UPDATE SET latitude = EXCLUDED.latitude,
                         longitude = EXCLUDED.longitude,
                         updated_at = now()
           RETURNING *""",
        (user_id, latitude, longitude),
    ).fetchone()


# MVP matching radius from the README ("Search radius: 3 km").
NEARBY_RADIUS_KM = 3.0


def find_nearby_riders(conn, latitude: float, longitude: float, radius_km: float = NEARBY_RADIUS_KM):
    """Riders who are online and within radius_km of the given point.

    Haversine distance in SQL (no extensions needed). location_updated_at must
    be recent enough that we trust the rider is actually still there.
    """
    return conn.execute(
        """WITH candidates AS (
             SELECT r.user_id, r.motorcycle_number, r.motorcycle_model,
                    r.rating, r.rating_count,
                    r.current_latitude, r.current_longitude,
                    r.location_updated_at,
                    u.name, u.phone,
                    6371.0 * 2 * asin(sqrt(
                      power(sin(radians(r.current_latitude - %(lat)s) / 2), 2) +
                      cos(radians(%(lat)s)) * cos(radians(r.current_latitude)) *
                      power(sin(radians(r.current_longitude - %(lon)s) / 2), 2)
                    )) AS distance_km
             FROM riders r
             JOIN users u ON u.id = r.user_id
             WHERE r.availability_status = 'online'
               AND r.current_latitude IS NOT NULL
               AND r.current_longitude IS NOT NULL
               AND r.location_updated_at > now() - interval '15 minutes'
           )
           SELECT * FROM candidates
           WHERE distance_km <= %(radius_km)s
           ORDER BY distance_km ASC
           LIMIT 20""",
        {"lat": latitude, "lon": longitude, "radius_km": radius_km},
    ).fetchall()
