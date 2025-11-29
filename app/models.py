from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


class PointStatus(str, enum.Enum):
    ONGOING = "ongoing"
    ENDED = "ended"


class Creator(Base):
    __tablename__ = "creators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Optional for Google OAuth users
    google_id = Column(String, unique=True, nullable=True)  # Google user ID
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    donation_points = relationship("DonationPoint", back_populates="creator")


class DonationPoint(Base):
    __tablename__ = "donation_points"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    organization_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String)
    images = Column(String)  # JSON array of file paths
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    status = Column(SQLEnum(PointStatus), default=PointStatus.ONGOING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    creator = relationship("Creator", back_populates="donation_points")

