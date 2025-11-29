from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import math
import shutil
from pathlib import Path
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/donation-points", tags=["donation-points"])

# Configuration for image uploads
UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_image_url(image_path: Optional[str]) -> Optional[str]:
    """Generate URL for image if it exists"""
    if not image_path:
        return None
    return f"/api/donation-points/images/{Path(image_path).name}"


def save_uploaded_file(file: UploadFile, point_id: int) -> str:
    """Save uploaded file and return the file path"""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    filename = f"point_{point_id}_{int(datetime.now().timestamp())}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return str(file_path)


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
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Create a new donation point (requires authenticated creator)"""
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
        start_date=start_date,
        end_date=end_date,
        status=models.PointStatus.ONGOING
    )
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    
    # Handle image upload if provided
    if image:
        try:
            image_path = save_uploaded_file(image, db_point.id)
            db_point.image_path = image_path
            db.commit()
            db.refresh(db_point)
        except Exception as e:
            # If image upload fails, delete the point or just log the error
            # For now, we'll just not set the image_path
            print(f"Error saving image: {e}")
    
    # Convert to response with image_url
    response_data = schemas.DonationPointResponse.model_validate(db_point)
    response_data.image_url = get_image_url(db_point.image_path)
    return response_data


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
    
    # Format response with image URLs
    responses = []
    for point in points:
        response = schemas.DonationPointResponse.model_validate(point)
        response.image_url = get_image_url(point.image_path)
        responses.append(response)
    return responses


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve uploaded images"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Security check: ensure file is within upload directory
    try:
        file_path.resolve().relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return FileResponse(file_path)


@router.get("/{point_id}", response_model=schemas.DonationPointResponse)
def get_donation_point(point_id: int, db: Session = Depends(get_db)):
    """Get a single donation point by ID"""
    point = db.query(models.DonationPoint).filter(models.DonationPoint.id == point_id).first()
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation point not found"
        )
    
    response = schemas.DonationPointResponse.model_validate(point)
    response.image_url = get_image_url(point.image_path)
    return response


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
    
    response = schemas.DonationPointResponse.model_validate(point)
    response.image_url = get_image_url(point.image_path)
    return response



