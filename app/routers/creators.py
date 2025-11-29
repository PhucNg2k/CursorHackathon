from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta
from typing import List, Optional
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/creators", tags=["creators"])

# Google OAuth Client ID (set via environment variable)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


@router.post("/login", response_model=schemas.Token)
def login_with_google(google_login: schemas.GoogleLogin, db: Session = Depends(get_db)):
    """Login/Register creator with Google OAuth token"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable."
        )
    
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            google_login.id_token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        # Extract user info from Google token
        google_id = idinfo.get("sub")
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0])  # Fallback to email username if no name
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # Check if creator exists by email or google_id
        creator = db.query(models.Creator).filter(
            (models.Creator.email == email) | (models.Creator.google_id == google_id)
        ).first()
        
        if creator:
            # Update google_id if not set
            if not creator.google_id:
                creator.google_id = google_id
                db.commit()
                db.refresh(creator)
        else:
            # Create new creator
            creator = models.Creator(
                name=name,
                email=email,
                google_id=google_id,
                password_hash=None,  # No password for Google OAuth users
                verified=False
            )
            db.add(creator)
            db.commit()
            db.refresh(creator)
        
        # Generate JWT token
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": creator.id}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/{creator_id}/verify", response_model=schemas.CreatorResponse)
def verify_creator(
    creator_id: int,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Verify a creator (admin endpoint - for MVP, any authenticated creator can verify others)"""
    # In production, add admin role check here
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )
    
    creator.verified = True
    db.commit()
    db.refresh(creator)
    return creator


@router.get("/me", response_model=schemas.CreatorResponse)
def get_current_creator_info(
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Get current authenticated creator information"""
    return current_creator


@router.get("", response_model=List[schemas.CreatorResponse])
def list_creators(
    search: Optional[str] = None,
    verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all creators with optional search and filter"""
    query = db.query(models.Creator)
    
    # Search by name or email
    if search:
        query = query.filter(
            or_(
                models.Creator.name.ilike(f"%{search}%"),
                models.Creator.email.ilike(f"%{search}%")
            )
        )
    
    # Filter by verified status
    if verified is not None:
        query = query.filter(models.Creator.verified == verified)
    
    creators = query.all()
    return creators


@router.get("/{creator_id}", response_model=schemas.CreatorResponse)
def get_creator(creator_id: int, db: Session = Depends(get_db)):
    """Get a single creator by ID"""
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )
    return creator


@router.patch("/{creator_id}", response_model=schemas.CreatorResponse)
def update_creator(
    creator_id: int,
    creator_update: schemas.CreatorUpdate,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Update a creator (only themselves)"""
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )
    
    # Check if current creator is updating themselves
    if creator.id != current_creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this creator"
        )
    
    # Update fields
    if creator_update.name is not None:
        creator.name = creator_update.name
    if creator_update.email is not None:
        # Check if email already exists (and not owned by this creator)
        existing_creator = db.query(models.Creator).filter(
            models.Creator.email == creator_update.email,
            models.Creator.id != creator_id
        ).first()
        if existing_creator:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        creator.email = creator_update.email
    
    db.commit()
    db.refresh(creator)
    return creator


@router.delete("/{creator_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_creator(
    creator_id: int,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Delete a creator (only themselves)"""
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )
    
    # Check if current creator is deleting themselves
    if creator.id != current_creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this creator"
        )
    
    # Check if creator has donation points
    donation_points = db.query(models.DonationPoint).filter(
        models.DonationPoint.creator_id == creator_id
    ).count()
    
    if donation_points > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete creator with existing donation points"
        )
    
    db.delete(creator)
    db.commit()
    return None

