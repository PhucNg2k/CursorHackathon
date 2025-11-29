from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from .models import PointStatus


# Creator Schemas
class CreatorBase(BaseModel):
    name: str
    email: EmailStr


class GoogleLogin(BaseModel):
    id_token: str  # Google ID token from frontend


class CreatorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class CreatorResponse(CreatorBase):
    id: int
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Donation Point Schemas
class DonationPointBase(BaseModel):
    organization_name: str
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class DonationPointCreate(DonationPointBase):
    pass


class DonationPointUpdate(BaseModel):
    status: Optional[PointStatus] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None


class DonationPointResponse(DonationPointBase):
    id: int
    creator_id: int
    images: Optional[List[str]] = None
    status: PointStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Search Schemas
class GPSSearch(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius: float = Field(default=10.0, ge=0.1, le=1000.0)  # km


class RouteSearch(BaseModel):
    start_lat: float = Field(..., ge=-90, le=90)
    start_lng: float = Field(..., ge=-180, le=180)
    end_lat: float = Field(..., ge=-90, le=90)
    end_lng: float = Field(..., ge=-180, le=180)

