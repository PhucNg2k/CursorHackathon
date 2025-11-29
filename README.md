# Donation Points Map - Backend API

Backend API for a donation points map application built with FastAPI.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Authentication**: JWT tokens

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variable for Google OAuth (optional, defaults to empty string):
```bash
export GOOGLE_CLIENT_ID="your-google-client-id"
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

Interactive API documentation: `http://localhost:8000/docs`

## API Endpoints

### Creators

- `POST /api/creators/login` - Login/Register creator with Google OAuth
  - Body: `{ "id_token": "string" }` (Google ID token from frontend)
  - Returns: `{ "access_token": "string", "token_type": "bearer" }`
  - Note: Creates new creator if email doesn't exist, otherwise logs in existing creator

- `GET /api/creators` - List all creators
  - Query params: `search` (optional, search by name/email), `verified` (optional, filter by verified status)
  - Returns: List of creator objects

- `GET /api/creators/{id}` - Get a single creator by ID
  - Returns: Creator object

- `GET /api/creators/me` - Get current authenticated creator info
  - Headers: `Authorization: Bearer <token>`
  - Returns: Creator object

- `PATCH /api/creators/{id}` - Update a creator (only themselves)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "name": "string (optional)", "email": "string (optional)" }`
  - Returns: Updated creator object

- `DELETE /api/creators/{id}` - Delete a creator (only themselves)
  - Headers: `Authorization: Bearer <token>`
  - Returns: 204 No Content
  - Note: Cannot delete if creator has donation points

- `POST /api/creators/{id}/verify` - Verify a creator (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Verified creator object

### Admin

- `GET /api/admin/creators` - List all creators (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: List of all creator objects

- `POST /api/admin/creators/{id}/verify` - Verify a creator (admin endpoint)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Verified creator object

- `POST /api/admin/creators/{id}/unverify` - Unverify a creator (admin endpoint)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Unverified creator object

### Donation Points

- `POST /api/donation-points` - Create a new donation point with images (requires authenticated creator)
  - Headers: `Authorization: Bearer <token>`
  - Content-Type: `multipart/form-data`
  - Body (form data):
    - `organization_name`: string (required)
    - `address`: string (required)
    - `latitude`: float (required, -90 to 90)
    - `longitude`: float (required, -180 to 180)
    - `description`: string (optional)
    - `start_date`: datetime (optional, ISO format)
    - `end_date`: datetime (optional, ISO format)
    - `files`: array of image files (optional)
  - Returns: Created donation point with image paths

- `GET /api/donation-points` - Search donation points
  - Query params:
    - GPS search: `?lat=37.7749&lng=-122.4194&radius=10` (radius in km, default 10)
    - Route search: `?start_lat=37.0&start_lng=-122.0&end_lat=38.0&end_lng=-121.0`
    - No params: Returns all points
  - Returns: List of donation points

- `GET /api/donation-points/{id}` - Get a single donation point
  - Returns: Donation point details

- `PATCH /api/donation-points/{id}` - Update a donation point (only by creator)
  - Headers: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "status": "ongoing" | "ended",
      "description": "string (optional)",
      "end_date": "2024-01-31T23:59:59 (optional)"
    }
    ```
  - Returns: Updated donation point

- `POST /api/donation-points/{id}/images` - Upload images for a donation point
  - Headers: `Authorization: Bearer <token>`
  - Body: Multipart form data with image files
  - Returns: Updated donation point with new images

## Database Models

### Creator
- `id`: Integer (primary key)
- `name`: String
- `email`: String (unique)
- `password_hash`: String
- `verified`: Boolean (default: false)
- `created_at`: DateTime

### DonationPoint
- `id`: Integer (primary key)
- `creator_id`: Integer (foreign key to Creator)
- `organization_name`: String
- `address`: String
- `latitude`: Float
- `longitude`: Float
- `description`: String (optional)
- `images`: JSON array of file paths
- `start_date`: DateTime (optional)
- `end_date`: DateTime (optional)
- `status`: Enum ("ongoing" | "ended")
- `created_at`: DateTime

## Features

- JWT-based authentication
- Creator registration and verification
- Geospatial search (GPS radius and route bounding box)
- Image upload support
- CORS enabled for frontend integration

## Notes

- Database file (`db.sqlite`) is created automatically on first run
- Images are stored in the `uploads/` directory
- For production, change the `SECRET_KEY` in `app/auth.py`
- **Users are automatically verified on login/registration** (no manual verification needed)
- Admin endpoints (`/api/admin/*`) are accessible by any authenticated user (for MVP simplicity)
