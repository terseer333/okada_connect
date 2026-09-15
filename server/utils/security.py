"""Password hashing and JWT helpers."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
TOKEN_TTL = timedelta(days=7)

SALT_ROUNDS = 12


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=SALT_ROUNDS)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def sign_token(user_id: str, role: str) -> str:
    payload = {
        "sub": str(user_id),  # UUID objects are not JSON serializable
        "role": role,
        "exp": datetime.now(timezone.utc) + TOKEN_TTL,
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    """Return the payload, or None if invalid/expired."""
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
