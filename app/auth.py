from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db

# Security settings
SECRET_KEY = "your-secret-key-change-in-production"  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/creators/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_creator(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Creator:
    """Get current authenticated creator from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"[AUTH DEBUG] Token received: {token[:20]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[AUTH DEBUG] Token payload: {payload}")
        creator_id = payload.get("sub")
        print(f"[AUTH DEBUG] Creator ID from token: {creator_id}, type: {type(creator_id)}")
        
        if creator_id is None:
            print("[AUTH DEBUG] Creator ID is None")
            raise credentials_exception
        
        # JWT returns 'sub' as string, convert to integer for database query
        try:
            creator_id = int(creator_id)
            print(f"[AUTH DEBUG] Creator ID converted to int: {creator_id}")
        except (ValueError, TypeError) as e:
            print(f"[AUTH DEBUG] Failed to convert creator_id to int: {e}")
            raise credentials_exception
    except JWTError as e:
        print(f"[AUTH DEBUG] JWT Error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"[AUTH DEBUG] Unexpected error: {e}")
        raise credentials_exception
    
    # Check if creator exists in database
    creator = db.query(models.Creator).filter(models.Creator.id == creator_id).first()
    print(f"[AUTH DEBUG] Creator found in DB: {creator is not None}")
    if creator:
        print(f"[AUTH DEBUG] Creator details: id={creator.id}, email={creator.email}, name={creator.name}")
    else:
        print(f"[AUTH DEBUG] No creator found with ID: {creator_id}")
        # List all creators in DB for debugging
        all_creators = db.query(models.Creator).all()
        print(f"[AUTH DEBUG] All creators in DB: {[(c.id, c.email) for c in all_creators]}")
    
    if creator is None:
        raise credentials_exception
    return creator


def get_current_verified_creator(
    current_creator: models.Creator = Depends(get_current_creator),
) -> models.Creator:
    """Get current creator and verify they are verified"""
    if not current_creator.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator account not verified",
        )
    return current_creator

