"""Rider endpoints: profile and availability status."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from config.db import get_conn
from middleware.auth import require_role
from models import users
from schemas import RiderResponse, StatusUpdateRequest

router = APIRouter(prefix="/api/riders", tags=["riders"])

# All rider routes require an authenticated rider.
PROTECTED = [Depends(require_role("rider"))]


@router.get("/profile", response_model=RiderResponse, dependencies=PROTECTED)
def get_profile(user=Depends(require_role("rider")), conn: Connection = Depends(get_conn)):
    rider = users.find_rider_by_user_id(conn, user["id"])
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    return {"rider": users._row_to_dict(rider)}


@router.patch("/status", response_model=RiderResponse, dependencies=PROTECTED)
def update_status(
    body: StatusUpdateRequest,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    rider = users.update_rider_status(conn, user["id"], body.availabilityStatus)
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    return {"rider": users._row_to_dict(rider)}
