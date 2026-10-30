"""User profile endpoints: read profile, update profile, and upload photo."""
import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from psycopg import Connection

from config.db import get_conn
from middleware.auth import get_current_user
from models import users
from schemas import ProfileUpdateRequest

router = APIRouter(prefix="/api/users", tags=["users"])

# Directory where uploaded profile photos are stored
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/me", dependencies=[Depends(get_current_user)])
def get_me(user=Depends(get_current_user), conn: Connection = Depends(get_conn)):
    """Fetch current user profile."""
    u = users.find_user_by_id(conn, user["id"])
    if u is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": users.user_public(u)}


@router.patch("/me", dependencies=[Depends(get_current_user)])
def update_profile(
    body: ProfileUpdateRequest,
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """Update profile name and/or phone."""
    u = users.update_user_profile(conn, user["id"], name=body.name, phone=body.phone)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": users.user_public(u)}


@router.post("/me/photo", dependencies=[Depends(get_current_user)])
async def upload_photo(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    conn: Connection = Depends(get_conn),
):
    """Upload a profile photo. The file is saved to disk and its path stored on the user."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WebP) are allowed.")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        ext = ".jpg"

    filename = f"user_{user['id']}_{int(time.time())}{ext}"
    dest_path = UPLOAD_DIR / filename

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    photo_url = f"/uploads/{filename}"
    u = users.update_user_photo(conn, user["id"], photo_url)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"photoUrl": photo_url, "user": users.user_public(u)}
