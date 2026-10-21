"""Ride request endpoints (Phase 6) and ride lifecycle (Phase 7).

Customer side: create a request, watch its status, cancel or complete it.
Rider side:    see nearby pending requests, accept one, start and finish it.
"""
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from config.db import get_conn
from middleware.auth import get_current_user, require_role
from models import rides, users
from schemas import LocationUpdateRequest

router = APIRouter(prefix="/api/rides", tags=["rides"])

CUSTOMER_ONLY = [Depends(require_role("customer"))]
RIDER_ONLY = [Depends(require_role("rider"))]


def _serialized(conn, ride_row) -> dict:
    """Re-read the ride so customer/rider info is joined in."""
    return rides.serialize_ride(rides.get_ride_detail(conn, ride_row.id))


# ---------------------------------------------------------------- customer --

@router.post("/", status_code=201, dependencies=CUSTOMER_ONLY)
def create_ride_request(
    body: LocationUpdateRequest,
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
    ride = rides.insert_ride_request(conn, user["id"], body.latitude, body.longitude)

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
    if (
        rider is None
        or rider.availability_status == "offline"
        or rider.current_latitude is None
        or rider.current_longitude is None
    ):
        return {"requests": []}

    rows = rides.list_nearby_pending_requests(conn, rider.current_latitude, rider.current_longitude)
    return {"requests": [rides.serialize_ride(r) for r in rows]}


@router.post("/{ride_id}/accept", dependencies=RIDER_ONLY)
def accept_ride(
    ride_id: str,
    user=Depends(require_role("rider")),
    conn: Connection = Depends(get_conn),
):
    """First rider to accept wins; everyone else gets a 409."""
    ride = rides.get_ride_detail(conn, ride_id)
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride request not found.")
    if ride.status != "pending":
        raise HTTPException(status_code=409, detail="This request was already taken.")

    # Claim the rider atomically (fails if they went offline or got busy),
    # then claim the request. Undo the claim if we lost the race for it.
    if users.mark_rider_busy(conn, user["id"]) is None:
        raise HTTPException(status_code=409, detail="You're offline or already on a ride.")

    updated = rides.accept_ride(conn, ride_id, user["id"])
    if updated is None:
        users.update_rider_status(conn, user["id"], "online")
        raise HTTPException(status_code=409, detail="This request was already taken.")

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
