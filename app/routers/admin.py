from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/creators", response_model=List[schemas.CreatorResponse])
def list_all_creators(
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """List all creators (admin endpoint - any authenticated user can access)"""
    creators = db.query(models.Creator).all()
    return creators


@router.post("/creators/{creator_id}/verify", response_model=schemas.CreatorResponse)
def verify_creator(
    creator_id: int,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Verify a creator (admin endpoint - any authenticated user can verify others)"""
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


@router.post("/creators/{creator_id}/unverify", response_model=schemas.CreatorResponse)
def unverify_creator(
    creator_id: int,
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(auth.get_current_creator)
):
    """Unverify a creator (admin endpoint)"""
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )
    
    creator.verified = False
    db.commit()
    db.refresh(creator)
    return creator

