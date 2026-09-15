"""Rider endpoints: profile, availability status, and location."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from config.db import get_conn
from middleware.auth import require_role
from models import users
from schemas import LocationUpdateRequest, RiderResponse, StatusUpdateRequest

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


@router.put("/location", response_model=RiderResponse, dependencies=PROTECTED)
def update_location(
    body: LocationUpdateRequest,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Called periodically by the rider client while online (Phase 4)."""
    rider = users.update_rider_location(conn, user["id"], body.latitude, body.longitude)
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    return {"rider": users._row_to_dict(rider)}


@router.get("/nearby", tags=["customers"])
def nearby_riders(
    latitude: float,
    longitude: float,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Available riders within the search radius of the customer's point."""
    riders = users.find_nearby_riders(conn, latitude, longitude)
    return {
        "riders": [
            {
                "userId": str(r.user_id),
                "name": r.name,
                "phone": r.phone,
                "motorcycleNumber": r.motorcycle_number,
                "motorcycleModel": r.motorcycle_model,
                "rating": r.rating,
                "ratingCount": r.rating_count,
                "latitude": r.current_latitude,
                "longitude": r.current_longitude,
                "distanceKm": round(r.distance_km, 2),
            }
            for r in riders
        ]
    }
