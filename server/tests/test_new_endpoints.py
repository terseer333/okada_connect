"""Tests for new endpoints: success case and unauthorized case for every endpoint."""
import io
import os
import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from utils.security import sign_token, hash_password
import config.db


@pytest.fixture(scope="session")
def client():
    if config.db.pool is None:
        config.db.init_db(app)
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_conn(client):
    with config.db.pool.connection() as conn:
        yield conn


@pytest.fixture
def customer_user(db_conn):
    uid = str(uuid.uuid4())
    email = f"test_cust_{uid[:8]}@example.com"
    pwd = hash_password("password123")
    db_conn.execute(
        """INSERT INTO users (id, name, phone, email, password_hash, role)
           VALUES (%s, %s, %s, %s, %s, 'customer')""",
        (uid, "Test Customer", "+2348000000001", email, pwd),
    )
    token = sign_token(uid, "customer")
    yield {"id": uid, "token": token, "email": email}


@pytest.fixture
def rider_user(db_conn):
    uid = str(uuid.uuid4())
    email = f"test_rider_{uid[:8]}@example.com"
    pwd = hash_password("password123")
    db_conn.execute(
        """INSERT INTO users (id, name, phone, email, password_hash, role)
           VALUES (%s, %s, %s, %s, %s, 'rider')""",
        (uid, "Test Rider", "+2348000000002", email, pwd),
    )
    db_conn.execute(
        """INSERT INTO riders (user_id, motorcycle_number, motorcycle_model, availability_status, current_latitude, current_longitude, location_updated_at)
           VALUES (%s, 'ABJ-123-XY', 'Bajaj Boxer 150', 'online', 9.0765, 7.3986, now())""",
        (uid,),
    )
    token = sign_token(uid, "rider")
    yield {"id": uid, "token": token, "email": email}


# ----------------------------------------------------------------------
# 1. POST /api/riders/location
# ----------------------------------------------------------------------
def test_rider_location_success(client, rider_user):
    headers = {"Authorization": f"Bearer {rider_user['token']}"}
    res = client.post("/api/riders/location", json={"lat": 9.0770, "lng": 7.3990}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["location"]["lat"] == 9.0770
    assert data["location"]["lng"] == 7.3990


def test_rider_location_unauthorized(client, customer_user):
    # No auth
    res = client.post("/api/riders/location", json={"lat": 9.0770, "lng": 7.3990})
    assert res.status_code in (401, 403)

    # Wrong role (customer cannot update rider location)
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.post("/api/riders/location", json={"lat": 9.0770, "lng": 7.3990}, headers=headers)
    assert res.status_code == 403


# ----------------------------------------------------------------------
# 2. GET /api/riders/nearby
# ----------------------------------------------------------------------
def test_riders_nearby_success(client, customer_user, rider_user):
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    # Customer near rider position (9.0765, 7.3986)
    res = client.get("/api/riders/nearby?lat=9.0760&lng=7.3980&radius=5", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "riders" in data
    # Check privacy: phone and full name must NOT be present
    for r in data["riders"]:
        assert "phone" not in r
        assert "name" not in r
        assert "id" in r
        assert "distanceKm" in r


def test_riders_nearby_unauthorized(client):
    res = client.get("/api/riders/nearby?lat=9.0760&lng=7.3980")
    assert res.status_code in (401, 403)


# ----------------------------------------------------------------------
# 3. GET /api/rides/:id/tracking
# ----------------------------------------------------------------------
def test_ride_tracking_success(client, db_conn, customer_user, rider_user):
    ride_id = str(uuid.uuid4())
    db_conn.execute(
        """INSERT INTO ride_requests (id, customer_id, rider_id, pickup_latitude, pickup_longitude, status, accepted_at)
           VALUES (%s, %s, %s, 9.0750, 7.3970, 'accepted', now())""",
        (ride_id, customer_user["id"], rider_user["id"]),
    )

    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.get(f"/api/rides/{ride_id}/tracking", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["trackingActive"] is True
    assert data["status"] == "accepted"
    assert "riderPosition" in data
    assert "customerPosition" in data
    assert "distanceKm" in data
    assert "etaMinutes" in data


def test_customer_location_success(client, db_conn, customer_user):
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.post("/api/customers/location", json={"lat": 9.0755, "lng": 7.3975}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["latitude"] == 9.0755
    assert data["longitude"] == 7.3975


def test_customer_location_unauthorized(client, rider_user):
    # No auth
    res = client.post("/api/customers/location", json={"lat": 9.0755, "lng": 7.3975})
    assert res.status_code in (401, 403)

    # Wrong role (rider cannot call customer location)
    headers = {"Authorization": f"Bearer {rider_user['token']}"}
    res = client.post("/api/customers/location", json={"lat": 9.0755, "lng": 7.3975}, headers=headers)
    assert res.status_code == 403


def test_ride_tracking_unauthorized(client, db_conn, customer_user, rider_user):
    ride_id = str(uuid.uuid4())
    db_conn.execute(
        """INSERT INTO ride_requests (id, customer_id, rider_id, pickup_latitude, pickup_longitude, status)
           VALUES (%s, %s, %s, 9.0750, 7.3970, 'accepted')""",
        (ride_id, customer_user["id"], rider_user["id"]),
    )

    # Unauthenticated
    res = client.get(f"/api/rides/{ride_id}/tracking")
    assert res.status_code in (401, 403)

    # Different user not on the ride
    other_uid = str(uuid.uuid4())
    other_token = sign_token(other_uid, "customer")
    res = client.get(f"/api/rides/{ride_id}/tracking", headers={"Authorization": f"Bearer {other_token}"})
    assert res.status_code == 403


# ----------------------------------------------------------------------
# 4. GET /api/rides/history
# ----------------------------------------------------------------------
def test_ride_history_success(client, db_conn, customer_user):
    ride_id = str(uuid.uuid4())
    db_conn.execute(
        """INSERT INTO ride_requests (id, customer_id, pickup_latitude, pickup_longitude, status, requested_at, fare)
           VALUES (%s, %s, 9.0750, 7.3970, 'completed', now(), 850.0)""",
        (ride_id, customer_user["id"]),
    )

    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.get("/api/rides/history?page=1&limit=5", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "rides" in data
    assert "total" in data
    assert data["total"] >= 1
    assert data["page"] == 1


def test_ride_history_unauthorized(client):
    res = client.get("/api/rides/history")
    assert res.status_code in (401, 403)


# ----------------------------------------------------------------------
# 5. GET /api/wallet & GET /api/wallet/transactions
# ----------------------------------------------------------------------
def test_wallet_success(client, customer_user):
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.get("/api/wallet", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "balance" in data
    assert data.get("isSampleData") is True

    res_tx = client.get("/api/wallet/transactions", headers=headers)
    assert res_tx.status_code == 200
    tx_data = res_tx.json()
    assert "transactions" in tx_data
    assert tx_data.get("isSampleData") is True


def test_wallet_unauthorized(client):
    res = client.get("/api/wallet")
    assert res.status_code in (401, 403)

    res_tx = client.get("/api/wallet/transactions")
    assert res_tx.status_code in (401, 403)


# ----------------------------------------------------------------------
# 6. GET & PATCH /api/users/me
# ----------------------------------------------------------------------
def test_users_me_success(client, customer_user):
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    res = client.get("/api/users/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == customer_user["email"]

    res_patch = client.patch(
        "/api/users/me",
        json={"name": "Updated Customer Name", "phone": "+2348111222333"},
        headers=headers,
    )
    assert res_patch.status_code == 200
    updated = res_patch.json()
    assert updated["user"]["name"] == "Updated Customer Name"
    assert updated["user"]["phone"] == "+2348111222333"


def test_users_me_unauthorized(client):
    res = client.get("/api/users/me")
    assert res.status_code in (401, 403)

    res_patch = client.patch("/api/users/me", json={"name": "No Auth"})
    assert res_patch.status_code in (401, 403)


# ----------------------------------------------------------------------
# 7. POST /api/users/me/photo
# ----------------------------------------------------------------------
def test_users_me_photo_success(client, customer_user):
    headers = {"Authorization": f"Bearer {customer_user['token']}"}
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("avatar.png", io.BytesIO(fake_png), "image/png")}
    res = client.post("/api/users/me/photo", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "photoUrl" in data
    assert data["photoUrl"].startswith("/uploads/")


def test_users_me_photo_unauthorized(client):
    fake_png = b"\x89PNG\r\n\x1a\n"
    files = {"file": ("avatar.png", io.BytesIO(fake_png), "image/png")}
    res = client.post("/api/users/me/photo", files=files)
    assert res.status_code in (401, 403)
