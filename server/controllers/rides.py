"""Ride request endpoints (Phase 6) and ride lifecycle (Phase 7).

Customer side: create a request, watch its status, cancel or complete it.
Rider side:    see nearby pending requests, accept one, start and finish it.
"""
import math
import os
import time
from fastapi import APIRouter, Depends, HTTPException
import httpx
from psycopg import Connection

from config.db import get_conn
from middleware.auth import get_current_user, require_role
from models import rides, users
from schemas import CreateRideRequest, LocationUpdateRequest
from utils.geo import haversine_km

router = APIRouter(prefix="/api/rides", tags=["rides"])

CUSTOMER_ONLY = [Depends(require_role("customer"))]
RIDER_ONLY = [Depends(require_role("rider"))]

# Cache for ETA/distance: ride_id -> (timestamp, distance_km, eta_minutes)
_ETA_CACHE: dict[str, tuple[float, float, int]] = {}


def compute_eta_routes_api(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, ride_id: str) -> tuple[float, int]:
    """Compute distance (km) and ETA (minutes) using Routes API with 10s caching per ride."""
    now = time.time()
    if ride_id in _ETA_CACHE:
        cached_ts, cached_dist, cached_eta = _ETA_CACHE[ride_id]
        if now - cached_ts < 10.0:
            return cached_dist, cached_eta

    api_key = os.environ.get("ROUTES_API_KEY") or os.environ.get("GOOGLE_MAPS_KEY") or os.environ.get("VITE_GOOGLE_MAPS_KEY")
    if api_key:
        try:
            url = "https://routes.googleapis.com/directions/v2:computeRoutes"
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
            }
            payload = {
                "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
                "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}},
                "travelMode": "TWO_WHEELER",
                "routingPreference": "TRAFFIC_AWARE",
            }
            with httpx.Client(timeout=3.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    routes_list = data.get("routes", [])
                    if routes_list:
                        meters = routes_list[0].get("distanceMeters", 0)
                        dur_str = routes_list[0].get("duration", "0s").rstrip("s")
                        secs = float(dur_str) if dur_str else 0
                        dist_km = round(meters / 1000.0, 2)
                        eta_mins = max(1, round(secs / 60.0))
                        _ETA_CACHE[ride_id] = (now, dist_km, eta_mins)
                        return dist_km, eta_mins
        except Exception:
            pass

    # Fallback to haversine calculation and standard okada speed (25 km/h)
    dist_km = round(haversine_km(origin_lat, origin_lng, dest_lat, dest_lng), 2)
    eta_mins = max(1, round((dist_km / 25.0) * 60))
    _ETA_CACHE[ride_id] = (now, dist_km, eta_mins)
    return dist_km, eta_mins


def _serialized(conn, ride_row) -> dict:
    """Re-read the ride so customer/rider info is joined in."""
    return rides.serialize_ride(rides.get_ride_detail(conn, ride_row.id))


@router.get("/history", dependencies=[Depends(get_current_user)])
def ride_history(
    page: int = 1,
    limit: int = 10,
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """Paginated list of rides for the current user (customer or rider)."""
    items, total = rides.list_user_ride_history(conn, user["id"], user["role"], page=page, limit=limit)
    total_pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
    return {
        "rides": items,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }


# ---------------------------------------------------------------- customer --

@router.post("", status_code=201, dependencies=CUSTOMER_ONLY)
@router.post("/", status_code=201, dependencies=CUSTOMER_ONLY)
def create_ride_request(
    body: CreateRideRequest,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Broadcast a ride request to available riders near the pickup point."""
    if rides.find_active_ride_for_customer(conn, user["id"]) is not None:
        raise HTTPException(
            status_code=409,
            detail="You already have an active ride. Cancel it before requesting another.",
        )

    users.upsert_customer_location(conn, user["id"], body.latitude, body.longitude)
    ride = rides.insert_ride_request(
        conn,
        user["id"],
        body.latitude,
        body.longitude,
        pickup_address=body.pickupAddress,
        destination_latitude=body.destinationLatitude,
        destination_longitude=body.destinationLongitude,
        destination_address=body.destinationAddress,
        fare=body.fare,
    )

    # MVP matching (README): send the request to every online rider within
    # the search radius. Real dispatch/queueing comes later.
    nearby = users.find_nearby_riders(conn, body.latitude, body.longitude)
    return {"ride": _serialized(conn, ride), "notifiedRiders": len(nearby)}


@router.get("/active", dependencies=[Depends(get_current_user)])
def active_ride(
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """The caller's current ride, if any. Works for both roles."""
    if user["role"] == "customer":
        row = rides.find_active_ride_for_customer(conn, user["id"])
    else:
        row = rides.find_active_ride_for_rider(conn, user["id"])
    return {"ride": rides.serialize_ride(row) if row else None}


@router.get("/{ride_id}/tracking", dependencies=[Depends(get_current_user)])
def ride_tracking(
    ride_id: str,
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """Returns assigned rider's position, customer position, distance, and ETA."""
    row = rides.get_ride_detail(conn, ride_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Check authorization: only the ride's customer or assigned rider can call it
    is_cust = str(row.customer_id) == user["id"]
    is_rider = row.rider_id is not None and str(row.rider_id) == user["id"]
    if not is_cust and not is_rider:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to track this ride.")

    serialized = rides.serialize_ride(row)
    status = serialized["status"]

    # Retrieve live customer GPS location
    cust_loc = conn.execute(
        "SELECT latitude, longitude FROM customer_locations WHERE user_id = %s",
        (str(row.customer_id),),
    ).fetchone()
    if cust_loc and cust_loc[0] is not None:
        cust_lat = cust_loc[0]
        cust_lng = cust_loc[1]
    else:
        cust_lat = serialized.get("customerLatitude") or serialized["pickupLatitude"]
        cust_lng = serialized.get("customerLongitude") or serialized["pickupLongitude"]
    customer_pos = {"lat": cust_lat, "lng": cust_lng}

    pickup_info = {
        "lat": serialized["pickupLatitude"],
        "lng": serialized["pickupLongitude"],
        "address": serialized.get("pickupAddress") or "Pickup Point",
    }
    dest_info = {
        "lat": serialized.get("destinationLatitude") or (serialized["pickupLatitude"] + 0.012),
        "lng": serialized.get("destinationLongitude") or (serialized["pickupLongitude"] + 0.012),
        "address": serialized.get("destinationAddress") or "Destination",
    }

    rider_info = serialized.get("rider")
    if row.rider_id:
        r_loc = conn.execute(
            "SELECT current_latitude, current_longitude FROM riders WHERE user_id = %s",
            (str(row.rider_id),),
        ).fetchone()
        if r_loc and r_loc[0] is not None:
            if rider_info is None:
                rider_info = {}
            rider_info["latitude"] = r_loc[0]
            rider_info["longitude"] = r_loc[1]
    has_rider_pos = rider_info is not None and rider_info.get("latitude") is not None and rider_info.get("longitude") is not None

    if status == "accepted":
        # Always activate rider tracking for the customer once accepted
        if has_rider_pos:
            rider_lat = rider_info["latitude"]
            rider_lng = rider_info["longitude"]
        else:
            # Fallback approaching position near pickup (~0.8km away)
            rider_lat = serialized["pickupLatitude"] + 0.0065
            rider_lng = serialized["pickupLongitude"] + 0.0055

        dist_km, eta_mins = compute_eta_routes_api(
            rider_lat, rider_lng, serialized["pickupLatitude"], serialized["pickupLongitude"], ride_id
        )

        return {
            "trackingActive": True,
            "status": status,
            "riderPosition": {"lat": rider_lat, "lng": rider_lng},
            "customerPosition": customer_pos,
            "distanceKm": dist_km,
            "etaMinutes": eta_mins,
            "pickup": pickup_info,
            "destination": dest_info,
            "rider": rider_info,
            "customer": serialized.get("customer"),
            "ride": serialized,
        }

    if status == "arriving":
        # Rider has arrived at pickup point — keep tracking active so passenger sees arrival
        return {
            "trackingActive": True,
            "status": status,
            "riderPosition": {"lat": serialized["pickupLatitude"], "lng": serialized["pickupLongitude"]},
            "customerPosition": customer_pos,
            "distanceKm": 0.0,
            "etaMinutes": 0,
            "pickup": pickup_info,
            "destination": dest_info,
            "rider": rider_info,
            "customer": serialized.get("customer"),
            "ride": serialized,
        }

    if status == "in_progress":
        # Trip in progress: track live okada movement toward destination
        r_lat = rider_info["latitude"] if has_rider_pos else serialized["pickupLatitude"]
        r_lng = rider_info["longitude"] if has_rider_pos else serialized["pickupLongitude"]
        dist_km = None
        eta_mins = None
        if serialized.get("destinationLatitude") is not None and serialized.get("destinationLongitude") is not None:
            dist_km, eta_mins = compute_eta_routes_api(
                r_lat, r_lng, serialized["destinationLatitude"], serialized["destinationLongitude"], ride_id
            )

        return {
            "trackingActive": True,
            "status": status,
            "riderPosition": {"lat": r_lat, "lng": r_lng},
            "customerPosition": customer_pos,
            "distanceKm": dist_km,
            "etaMinutes": eta_mins,
            "pickup": pickup_info,
            "destination": dest_info,
            "rider": rider_info,
            "customer": serialized.get("customer"),
            "ride": serialized,
        }

    # Tracking stops when completed or cancelled
    return {
        "trackingActive": False,
        "status": status,
        "riderPosition": None,
        "customerPosition": customer_pos,
        "distanceKm": None,
        "etaMinutes": None,
        "pickup": pickup_info,
        "destination": dest_info,
        "rider": rider_info,
        "customer": serialized.get("customer"),
        "ride": serialized,
    }


@router.post("/{ride_id}/cancel", dependencies=CUSTOMER_ONLY)
def cancel_ride(
    ride_id: str,
    user=Depends(require_role("customer")),
    conn: Connection = Depends(get_conn),
):
    """Customer cancels before the ride starts; the rider goes back online."""
    updated = rides.cancel_ride(conn, ride_id, user["id"])
    if updated is None:
        raise HTTPException(
            status_code=409,
            detail="This ride can't be cancelled (not found, not yours, or already finished).",
        )
    if updated.rider_id:
        users.update_rider_status(conn, updated.rider_id, "online")
    return {"ride": _serialized(conn, updated)}


@router.post("/{ride_id}/complete", dependencies=[Depends(get_current_user)])
def complete_ride(
    ride_id: str,
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """Either side can close out a ride that has started."""
    updated = rides.complete_ride(
        conn,
        ride_id,
        rider_id=user["id"] if user["role"] == "rider" else None,
        customer_id=user["id"] if user["role"] == "customer" else None,
    )
    if updated is None:
        raise HTTPException(
            status_code=409,
            detail="This ride can't be completed (not found, not yours, or already finished).",
        )
    if updated.rider_id:
        # Rider becomes available again (README rider flow, step 12).
        users.update_rider_status(conn, updated.rider_id, "online")
    return {"ride": _serialized(conn, updated)}


# ------------------------------------------------------------------- rider --

@router.get("/nearby-requests", dependencies=RIDER_ONLY)
def nearby_requests(
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Fresh pending requests around the rider's current location."""
    rider = users.find_rider_by_user_id(conn, user["id"])
    if rider is None or rider.availability_status == "offline":
        return {"requests": []}

    rider_lat = rider.current_latitude if rider.current_latitude is not None else 6.45407
    rider_lng = rider.current_longitude if rider.current_longitude is not None else 3.39467

    # Dispatch pending requests within 15 km of rider
    rows = rides.list_nearby_pending_requests(conn, rider_lat, rider_lng, radius_km=15.0)
    return {"requests": [rides.serialize_ride(r) for r in rows]}


@router.post("/{ride_id}/accept", dependencies=RIDER_ONLY)
def accept_ride(
    ride_id: str,
    payload: dict = None,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """First rider to accept wins; immediately synchronizes mutual location sharing."""
    ride = rides.get_ride_detail(conn, ride_id)
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride request not found.")
    if ride.status != "pending":
        raise HTTPException(status_code=409, detail="This request was already taken.")

    # Immediately store rider location if provided with accept
    if payload and isinstance(payload, dict):
        r_lat = payload.get("lat") or payload.get("latitude")
        r_lng = payload.get("lng") or payload.get("longitude")
        if r_lat is not None and r_lng is not None:
            users.update_rider_location(conn, user["id"], float(r_lat), float(r_lng))

    # Claim the rider atomically (fails if they went offline or got busy),
    # then claim the request. Undo the claim if we lost the race for it.
    if users.mark_rider_busy(conn, user["id"]) is None:
        raise HTTPException(status_code=409, detail="You're offline or already on a ride.")

    updated = rides.accept_ride(conn, ride_id, user["id"])
    if updated is None:
        users.update_rider_status(conn, user["id"], "online")
        raise HTTPException(status_code=409, detail="This request was already taken.")

    # Automatically synchronize customer's latest GPS location for the ride
    cust_loc = conn.execute(
        "SELECT latitude, longitude FROM customer_locations WHERE user_id = %s",
        (str(ride.customer_id),),
    ).fetchone()
    if cust_loc and cust_loc[0] is not None:
        rides.update_customer_location_for_active_ride(conn, str(ride.customer_id), cust_loc[0], cust_loc[1])
    else:
        rides.update_customer_location_for_active_ride(conn, str(ride.customer_id), ride.pickup_latitude, ride.pickup_longitude)

    return {"ride": _serialized(conn, updated)}


@router.post("/{ride_id}/arriving", dependencies=RIDER_ONLY)
def mark_arriving(
    ride_id: str,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Optional signal that the rider is approaching the pickup point."""
    updated = rides.mark_arriving(conn, ride_id, user["id"])
    if updated is None:
        raise HTTPException(
            status_code=409,
            detail="This ride can't be marked as arriving (not found, not yours, or wrong status).",
        )
    return {"ride": _serialized(conn, updated)}


@router.post("/{ride_id}/start", dependencies=RIDER_ONLY)
def start_ride(
    ride_id: str,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """Rider picks up the customer and begins the trip."""
    updated = rides.start_ride(conn, ride_id, user["id"])
    if updated is None:
        raise HTTPException(
            status_code=409,
            detail="This ride can't be started (not found, not yours, or not accepted yet).",
        )
    return {"ride": _serialized(conn, updated)}
