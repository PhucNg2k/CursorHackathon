from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import json
import os
import math
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/donation-points", tags=["donation-points"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula"""
    R = 6371  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


@router.post("", response_model=schemas.DonationPointResponse, status_code=status.HTTP_201_CREATED)
async def create_donation_point(
    organization_name: str = Form(...),
    address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    start_date: Optional[datetime] = Form(None),
    end_date: Optional[datetime] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_verified_creator)
):
    """Create a new donation point with images (requires verified creator)"""
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    # Create donation point first to get the ID
    db_point = models.DonationPoint(
        creator_id=current_creator.id,
        organization_name=organization_name,
        address=address,
        latitude=latitude,
        longitude=longitude,
        description=description,
        images=json.dumps([]),  # Will be updated after saving files
        start_date=start_date,
        end_date=end_date,
        status=models.PointStatus.ONGOING
    )
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    
    # Save uploaded images if any
    uploaded_paths = []
    if files:
        for file in files:
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            file_path = os.path.join(UPLOAD_DIR, f"{db_point.id}_{len(uploaded_paths)}{file_ext}")
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            uploaded_paths.append(file_path)
    
    # Update images in database
    if uploaded_paths:
        db_point.images = json.dumps(uploaded_paths)
        db.commit()
        db.refresh(db_point)
    
    # Parse images JSON for response
    response_point = schemas.DonationPointResponse.model_validate(db_point)
    try:
        response_point.images = json.loads(db_point.images) if db_point.images else []
    except (json.JSONDecodeError, TypeError):
        response_point.images = []
    return response_point


@router.get("", response_model=List[schemas.DonationPointResponse])
def search_donation_points(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 10.0,
    start_lat: Optional[float] = None,
    start_lng: Optional[float] = None,
    end_lat: Optional[float] = None,
    end_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Search donation points by GPS location or route"""
    query = db.query(models.DonationPoint)
    
    # GPS-based search (current location with radius)
    if lat is not None and lng is not None:
        # Get all points and filter by distance
        all_points = query.all()
        filtered_points = []
        for point in all_points:
            distance = haversine_distance(lat, lng, point.latitude, point.longitude)
            if distance <= radius:
                filtered_points.append(point)
        query = db.query(models.DonationPoint).filter(
            models.DonationPoint.id.in_([p.id for p in filtered_points])
        )
    
    # Route-based search (bounding box)
    elif all([start_lat is not None, start_lng is not None, end_lat is not None, end_lng is not None]):
        min_lat = min(start_lat, end_lat)
        max_lat = max(start_lat, end_lat)
        min_lng = min(start_lng, end_lng)
        max_lng = max(start_lng, end_lng)
        
        query = query.filter(
            and_(
                models.DonationPoint.latitude >= min_lat,
                models.DonationPoint.latitude <= max_lat,
                models.DonationPoint.longitude >= min_lng,
                models.DonationPoint.longitude <= max_lng
            )
        )
    
    # If no search params, return all points
    points = query.all()
    
    # Format response
    result = []
    for point in points:
        response_point = schemas.DonationPointResponse.model_validate(point)
        try:
            response_point.images = json.loads(point.images) if point.images else []
        except (json.JSONDecodeError, TypeError):
            response_point.images = []
        result.append(response_point)
    
    return result


@router.get("/{point_id}", response_model=schemas.DonationPointResponse)
def get_donation_point(point_id: int, db: Session = Depends(get_db)):
    """Get a single donation point by ID"""
    point = db.query(models.DonationPoint).filter(models.DonationPoint.id == point_id).first()
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation point not found"
        )
    
    response_point = schemas.DonationPointResponse.model_validate(point)
    try:
        response_point.images = json.loads(point.images) if point.images else []
    except (json.JSONDecodeError, TypeError):
        response_point.images = []
    return response_point


@router.patch("/{point_id}", response_model=schemas.DonationPointResponse)
def update_donation_point(
    point_id: int,
    point_update: schemas.DonationPointUpdate,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Update a donation point (only by its creator)"""
    point = db.query(models.DonationPoint).filter(models.DonationPoint.id == point_id).first()
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation point not found"
        )
    
    # Check if current creator owns this point
    if point.creator_id != current_creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this donation point"
        )
    
    # Update fields
    if point_update.status is not None:
        point.status = point_update.status
    if point_update.description is not None:
        point.description = point_update.description
    if point_update.end_date is not None:
        point.end_date = point_update.end_date
    
    db.commit()
    db.refresh(point)
    
    response_point = schemas.DonationPointResponse.model_validate(point)
    try:
        response_point.images = json.loads(point.images) if point.images else []
    except (json.JSONDecodeError, TypeError):
        response_point.images = []
    return response_point


@router.post("/{point_id}/images", response_model=schemas.DonationPointResponse)
async def upload_images(
    point_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Upload images for a donation point"""
    point = db.query(models.DonationPoint).filter(models.DonationPoint.id == point_id).first()
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation point not found"
        )
    
    # Check if current creator owns this point
    if point.creator_id != current_creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload images for this donation point"
        )
    
    # Load existing images
    try:
        existing_images = json.loads(point.images) if point.images else []
    except (json.JSONDecodeError, TypeError):
        existing_images = []
    
    # Save uploaded files
    uploaded_paths = []
    for file in files:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"{point_id}_{len(existing_images) + len(uploaded_paths)}{file_ext}")
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        uploaded_paths.append(file_path)
    
    # Update images in database
    all_images = existing_images + uploaded_paths
    point.images = json.dumps(all_images)
    db.commit()
    db.refresh(point)
    
    response_point = schemas.DonationPointResponse.model_validate(point)
    try:
        response_point.images = json.loads(point.images) if point.images else []
    except (json.JSONDecodeError, TypeError):
        response_point.images = []
    return response_point

