"""Request/response models."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=1, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["customer", "rider"]
    motorcycleNumber: str | None = Field(default=None, max_length=50)
    motorcycleModel: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class StatusUpdateRequest(BaseModel):
    availabilityStatus: Literal["offline", "online", "busy"]


class UserPublic(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    role: str
    createdAt: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic
    riderProfile: dict | None


class RiderResponse(BaseModel):
    rider: dict
