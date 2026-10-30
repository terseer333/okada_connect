"""Ride request database access.

Phase 6 — customers create requests and riders see nearby ones.
Phase 7 — requests move through the lifecycle:
pending -> accepted -> arriving -> in_progress -> completed (or cancelled).
"""
from models.users import NEARBY_RADIUS_KM, _row_to_dict

ACTIVE_STATUSES = ("pending", "accepted", "arriving", "in_progress")

# A pending request stops being offered to riders after this long, so a
# customer can't get matched to a request nobody is looking at anymore.
REQUEST_TTL = "3 minutes"

# One query returns a ride with everything both sides need to know.
_DETAIL_COLUMNS = """
SELECT rr.*,
       cu.name AS customer_name, cu.phone AS customer_phone, cu.photo_url AS customer_photo_url,
       ru.name AS rider_name,      ru.phone AS rider_phone, ru.photo_url AS rider_photo_url,
       rp.motorcycle_number AS rider_motorcycle_number,
       rp.motorcycle_model  AS rider_motorcycle_model,
       rp.rating AS rider_rating, rp.rating_count AS rider_rating_count,
       rp.current_latitude AS rider_latitude, rp.current_longitude AS rider_longitude
"""
_DETAIL_FROM = """
FROM ride_requests rr
JOIN users cu ON cu.id = rr.customer_id
LEFT JOIN users ru ON ru.id = rr.rider_id
LEFT JOIN riders rp ON rp.user_id = rr.rider_id
"""
_DETAIL_SELECT = _DETAIL_COLUMNS + _DETAIL_FROM


def _haversine_sql(lat_expr: str, lon_expr: str) -> str:
    """SQL haversine against %(lat)s/%(lon)s params (mirrors utils.geo)."""
    return f"""6371.0 * 2 * asin(sqrt(
      power(sin(radians({lat_expr} - %(lat)s) / 2), 2) +
      cos(radians(%(lat)s)) * cos(radians({lat_expr})) *
      power(sin(radians({lon_expr} - %(lon)s) / 2), 2)
    ))"""


def serialize_ride(row) -> dict:
    """Row from _DETAIL_SELECT → camelCase payload for the client."""
    from utils.geo import haversine_km  # local import keeps model deps flat

    r = _row_to_dict(row)
    ride = {
        "id": str(r["id"]),
        "customerId": str(r["customer_id"]),
        "riderId": str(r["rider_id"]) if r["rider_id"] else None,
        "pickupLatitude": r["pickup_latitude"],
        "pickupLongitude": r["pickup_longitude"],
        "destinationLatitude": r.get("destination_latitude"),
        "destinationLongitude": r.get("destination_longitude"),
        "pickupAddress": r.get("pickup_address") or "Pickup Point",
        "destinationAddress": r.get("destination_address") or "City Centre",
        "fare": float(r.get("fare") or 800.0),
        "status": r["status"],
        "customerLatitude": r.get("customer_latitude"),
        "customerLongitude": r.get("customer_longitude"),
        "requestedAt": r["requested_at"],
        "acceptedAt": r["accepted_at"],
        "startedAt": r["started_at"],
        "completedAt": r["completed_at"],
        "cancelledAt": r["cancelled_at"],
        "customer": {
            "id": str(r["customer_id"]),
            "name": r["customer_name"],
            "phone": r["customer_phone"],
            "photoUrl": r.get("customer_photo_url"),
        },
        "rider": None,
    }
    if r["rider_id"]:
        ride["rider"] = {
            "id": str(r["rider_id"]),
            "name": r["rider_name"],
            "phone": r["rider_phone"],
            "photoUrl": r.get("rider_photo_url"),
            "motorcycleNumber": r["rider_motorcycle_number"],
            "motorcycleModel": r["rider_motorcycle_model"],
            "rating": r["rider_rating"],
            "ratingCount": r["rider_rating_count"],
            "latitude": r["rider_latitude"],
            "longitude": r["rider_longitude"],
        }
        if r["rider_latitude"] is not None:
            ride["distanceKm"] = round(
                haversine_km(
                    r["rider_latitude"], r["rider_longitude"],
                    r["pickup_latitude"], r["pickup_longitude"],
                ),
                2,
            )
    if "distance_km" in r and r["distance_km"] is not None:
        # Nearby-request listings annotate distance in SQL (rider → pickup).
        ride["distanceKm"] = round(r["distance_km"], 2)
    return ride


def get_ride_detail(conn, ride_id: str):
    return conn.execute(_DETAIL_SELECT + " WHERE rr.id = %s", (ride_id,)).fetchone()


def find_active_ride_for_customer(conn, customer_id: str):
    return conn.execute(
        _DETAIL_SELECT
        + """ WHERE rr.customer_id = %s AND rr.status = ANY(%s)
              ORDER BY rr.requested_at DESC LIMIT 1""",
        (customer_id, list(ACTIVE_STATUSES)),
    ).fetchone()


def find_active_ride_for_rider(conn, rider_id: str):
    return conn.execute(
        _DETAIL_SELECT
        + """ WHERE rr.rider_id = %s AND rr.status = ANY(%s)
              ORDER BY rr.requested_at DESC LIMIT 1""",
        (rider_id, list(ACTIVE_STATUSES)),
    ).fetchone()


def insert_ride_request(
    conn,
    customer_id: str,
    latitude: float,
    longitude: float,
    pickup_address: str | None = None,
    destination_latitude: float | None = None,
    destination_longitude: float | None = None,
    destination_address: str | None = None,
    fare: float | None = None,
):
    return conn.execute(
        """INSERT INTO ride_requests (
               customer_id, pickup_latitude, pickup_longitude,
               pickup_address, destination_latitude, destination_longitude,
               destination_address, fare
           )
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (
            customer_id,
            latitude,
            longitude,
            pickup_address or "Pickup Point",
            destination_latitude,
            destination_longitude,
            destination_address or "Destination",
            fare if fare is not None else 800.0,
        ),
    ).fetchone()


def list_nearby_pending_requests(
    conn,
    latitude: float,
    longitude: float,
    radius_km: float = NEARBY_RADIUS_KM,
):
    """Fresh pending requests within radius_km, closest first.

    Joined with customer info so the rider card can render without extra
    queries. Distance is from the rider's current position to the pickup.
    """
    distance = _haversine_sql("rr.pickup_latitude", "rr.pickup_longitude")
    return conn.execute(
        _DETAIL_COLUMNS
        + f""", {distance} AS distance_km
           {_DETAIL_FROM}
           WHERE rr.status = 'pending'
             AND rr.requested_at > now() - interval '{REQUEST_TTL}'
             AND {distance} <= %(radius_km)s
           ORDER BY rr.requested_at ASC
           LIMIT 20""",
        {"lat": latitude, "lon": longitude, "radius_km": radius_km},
    ).fetchall()


def accept_ride(conn, ride_id: str, rider_id: str):
    """Atomic first-come-first-served accept: only one rider can win."""
    return conn.execute(
        """UPDATE ride_requests
           SET status = 'accepted', rider_id = %s, accepted_at = now(), updated_at = now()
           WHERE id = %s AND status = 'pending' AND rider_id IS NULL
           RETURNING *""",
        (rider_id, ride_id),
    ).fetchone()


def mark_arriving(conn, ride_id: str, rider_id: str):
    return conn.execute(
        """UPDATE ride_requests
           SET status = 'arriving', updated_at = now()
           WHERE id = %s AND rider_id = %s AND status = 'accepted'
           RETURNING *""",
        (ride_id, rider_id),
    ).fetchone()


def start_ride(conn, ride_id: str, rider_id: str):
    return conn.execute(
        """UPDATE ride_requests
           SET status = 'in_progress', started_at = now(), updated_at = now()
           WHERE id = %s AND rider_id = %s AND status IN ('accepted', 'arriving')
           RETURNING *""",
        (ride_id, rider_id),
    ).fetchone()


def complete_ride(conn, ride_id: str, *, rider_id: str | None = None, customer_id: str | None = None):
    return conn.execute(
        """UPDATE ride_requests
           SET status = 'completed', completed_at = now(), updated_at = now()
           WHERE id = %(id)s
             AND status IN ('accepted', 'arriving', 'in_progress')
             AND (%(rider)s::uuid IS NULL OR rider_id = %(rider)s)
             AND (%(customer)s::uuid IS NULL OR customer_id = %(customer)s)
           RETURNING *""",
        {"rider": rider_id, "customer": customer_id, "id": ride_id},
    ).fetchone()


def cancel_ride(conn, ride_id: str, customer_id: str):
    return conn.execute(
        """UPDATE ride_requests
           SET status = 'cancelled', cancelled_at = now(), updated_at = now()
           WHERE id = %s AND customer_id = %s
             AND status IN ('pending', 'accepted', 'arriving')
           RETURNING *""",
        (ride_id, customer_id),
    ).fetchone()


def list_user_ride_history(conn, user_id: str, role: str, page: int = 1, limit: int = 10):
    offset = max(0, (page - 1) * limit)
    filter_col = "rr.customer_id" if role == "customer" else "rr.rider_id"
    count_row = conn.execute(
        f"SELECT count(*) as total FROM ride_requests rr WHERE {filter_col} = %s",
        (user_id,),
    ).fetchone()
    total = count_row[0] if count_row else 0

    rows = conn.execute(
        _DETAIL_SELECT
        + f" WHERE {filter_col} = %s ORDER BY rr.requested_at DESC LIMIT %s OFFSET %s",
        (user_id, limit, offset),
    ).fetchall()

    return [serialize_ride(r) for r in rows], total


def update_customer_location_for_active_ride(conn, customer_id: str, latitude: float, longitude: float):
    """Updates the customer's live position on their active ride."""
    return conn.execute(
        """UPDATE ride_requests
           SET customer_latitude = %(lat)s,
               customer_longitude = %(lon)s,
               updated_at = now()
           WHERE customer_id = %(customer_id)s
             AND status IN ('pending', 'accepted', 'arriving')
           RETURNING id""",
        {"customer_id": customer_id, "lat": latitude, "lon": longitude},
    ).fetchone()

