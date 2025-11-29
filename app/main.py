from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import creators, donation_points, admin

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Donation Points API",
    description="Backend API for donation points map application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(creators.router)
app.include_router(donation_points.router)
app.include_router(admin.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Donation Points API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
