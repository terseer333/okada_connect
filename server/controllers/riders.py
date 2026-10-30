"""Rider endpoints: profile, availability status, and location."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from config.db import get_conn
from middleware.auth import require_role
from models import users
from schemas import LocationUpdateRequest, RiderLocationPostRequest, RiderResponse, StatusUpdateRequest

router = APIRouter(prefix="/api/riders", tags=["riders"])

# All rider routes require an authenticated rider.
PROTECTED = [Depends(require_role("rider"))]


@router.get("/profile", response_model=RiderResponse, dependencies=PROTECTED)
def get_profile(user=Depends(require_role("rider")), conn: Connection = Depends(get_conn)):
    rider = users.find_rider_by_user_id(conn, user["id"])
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found. Register as rider first to create a profile.")
    return {"rider": users._row_to_dict(rider)}


@router.patch("/status", response_model=RiderResponse, dependencies=PROTECTED)
def update_status(
    body: StatusUpdateRequest,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    rider = users.update_rider_status(conn, user["id"], body.availabilityStatus)
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found. Register as rider first to create a profile.")
    return {"rider": users._row_to_dict(rider)}


@router.post("/location", dependencies=PROTECTED)
def post_location(
    body: RiderLocationPostRequest,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Rider posts GPS position every 4s while online. Stores latest position only."""
    try:
        lat = body.get_lat()
        lng = body.get_lng()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    rider = users.update_rider_location(conn, user["id"], lat, lng)
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found.")
    return {"success": True, "location": {"lat": lat, "lng": lng}}


@router.put("/location", response_model=RiderResponse, dependencies=PROTECTED)
def update_location(
    body: LocationUpdateRequest,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Legacy endpoint for updating location."""
    rider = users.update_rider_location(conn, user["id"], body.latitude, body.longitude)
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider profile not found. Register as rider first to create a profile.")
    return {"rider": users._row_to_dict(rider)}


@router.get("/nearby", tags=["customers"])
def nearby_riders(
    lat: float | None = None,
    lng: float | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius: float = users.NEARBY_RADIUS_KM,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Available riders within radius. Anonymized IDs and distances, no full name or phone."""
    resolved_lat = lat if lat is not None else latitude
    resolved_lng = lng if lng is not None else longitude
    if resolved_lat is None or resolved_lng is None:
        raise HTTPException(status_code=422, detail="Query parameters lat/lng (or latitude/longitude) are required.")

    riders_list = users.find_nearby_riders(conn, resolved_lat, resolved_lng, radius_km=radius)
    serialized_riders = [
        {
            "id": f"rider_{str(r.user_id)[:8]}",
            "userId": str(r.user_id),
            "distanceKm": round(r.distance_km, 2),
            "latitude": r.current_latitude,
            "longitude": r.current_longitude,
            "rating": r.rating,
            "ratingCount": r.rating_count,
            "motorcycleModel": r.motorcycle_model,
            "motorcycleNumber": r.motorcycle_number,
        }
        for r in riders_list
    ]
    return {
        "riders": serialized_riders,
        "nearbyRiders": serialized_riders,
    }
