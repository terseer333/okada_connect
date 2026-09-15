"""Customer endpoints: location tracking for ride matching."""
from fastapi import APIRouter, Depends
from psycopg import Connection

from config.db import get_conn
from middleware.auth import require_role
from models import users
from schemas import LocationUpdateRequest

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
