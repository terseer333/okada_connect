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
    role: Literal["customer", "rider"] | None = None


class StatusUpdateRequest(BaseModel):
    availabilityStatus: Literal["offline", "online", "busy"]


class LocationUpdateRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class CreateRideRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    pickupAddress: str | None = None
    destinationLatitude: float | None = None
    destinationLongitude: float | None = None
    destinationAddress: str | None = None
    fare: float | None = None


class RiderLocationPostRequest(BaseModel):
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    def get_lat(self) -> float:
        val = self.lat if self.lat is not None else self.latitude
        if val is None:
            raise ValueError("lat or latitude is required")
        return val

    def get_lng(self) -> float:
        val = self.lng if self.lng is not None else self.longitude
        if val is None:
            raise ValueError("lng or longitude is required")
        return val


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=1, max_length=30)


class UserPublic(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    role: str
    photoUrl: str | None = None
    createdAt: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic
    riderProfile: dict | None


class RiderResponse(BaseModel):
    rider: dict
