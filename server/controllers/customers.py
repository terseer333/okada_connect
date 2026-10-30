"""Customer endpoints: location tracking for ride matching."""
from fastapi import APIRouter, Depends
from psycopg import Connection

from config.db import get_conn
from middleware.auth import require_role
from models import rides, users
from schemas import LocationUpdateRequest, RiderLocationPostRequest

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.put("/location")
def update_location(
    body: LocationUpdateRequest,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Called by the customer client when their pickup point is confirmed."""
    users.upsert_customer_location(conn, user["id"], body.latitude, body.longitude)
    return {"ok": True}


@router.post("/location")
def post_customer_location(
    body: RiderLocationPostRequest,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Store customer's latest {lat, lng} for active ride only; no history."""
    lat = body.get_lat()
    lng = body.get_lng()
    users.upsert_customer_location(conn, user["id"], lat, lng)
    rides.update_customer_location_for_active_ride(conn, user["id"], lat, lng)
    return {"ok": True, "latitude": lat, "longitude": lng}
