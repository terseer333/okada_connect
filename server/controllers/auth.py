"""Authentication endpoints: register, login, me."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from config.db import get_conn
from middleware.auth import get_current_user
from models import users
from schemas import AuthResponse, LoginRequest, MeResponse, RegisterRequest
from utils.security import hash_password, sign_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, conn: Connection = Depends(get_conn)):
    email = body.email.strip().lower()

    if users.find_user_by_email(conn, email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    password_hash = hash_password(body.password)
    user = users.insert_user(
        conn,
        name=body.name.strip(),
        phone=body.phone.strip(),
        email=email,
        password_hash=password_hash,
        role=body.role,
    )

    if body.role == "rider":
        users.insert_rider_profile(
            conn,
            user.id,
            body.motorcycleNumber.strip() if body.motorcycleNumber else None,
            body.motorcycleModel.strip() if body.motorcycleModel else None,
        )

    return {"token": sign_token(user.id, user.role), "user": users.user_public(user)}


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, conn: Connection = Depends(get_conn)):
    user = users.find_user_by_email(conn, body.email.strip().lower())
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"token": sign_token(user.id, user.role), "user": users.user_public(user)}


@router.get("/me", response_model=MeResponse)
def me(user=Depends(get_current_user), conn: Connection = Depends(get_conn)):
    row = users.find_user_by_id(conn, user["id"])
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")

    rider_profile = None
    if row.role == "rider":
        rider_row = users.find_rider_by_user_id(conn, row.id)
        if rider_row is not None:
            rider_profile = users._row_to_dict(rider_row)

    return {"user": users.user_public(row), "riderProfile": rider_profile}
