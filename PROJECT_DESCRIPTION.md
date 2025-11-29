# Kế hoạch xây dựng hệ thống quản lý điểm cứu trợ

## 1. Cấu trúc Project

```
CursorHackathon/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   ├── context/         # Auth context
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 2. Database Schema (MySQL)

### Tables:

- **users**: Thông tin người dùng
  - id, email, name, role (creator/donator/admin), phone, cccd, tax_code, created_at, updated_at

- **relief_points**: Điểm cứu trợ
  - id, creator_id (FK), source_province, destination, address, latitude, longitude, status (ongoing/delivering/done), description, created_at, updated_at

- **relief_point_images**: Hình ảnh điểm cứu trợ
  - id, relief_point_id (FK), image_url, created_at

### Relationships:

- users (1) -> (N) relief_points
- relief_points (1) -> (N) relief_point_images

## 3. Backend Implementation

### 3.1 Setup & Dependencies

- Express.js server
- Sequelize ORM cho MySQL
- Google OAuth2 (passport-google-oauth20)
- JWT authentication
- Multer cho upload images
- CORS, dotenv, bcrypt

### 3.2 Models (Sequelize)

- `User` model với các fields và associations
- `ReliefPoint` model với validation
- `ReliefPointImage` model

### 3.3 API Routes

- `/api/auth/google` - Google OAuth callback
- `/api/auth/me` - Get current user
- `/api/users/profile` - Update user profile (verification info)
- `/api/relief-points` - CRUD operations
  - GET: List all với filters (status, location)
  - POST: Create (chỉ Creator)
  - PUT: Update (chỉ Creator của điểm đó)
  - DELETE: Delete (chỉ Admin)
- `/api/relief-points/:id/images` - Upload images
- `/api/relief-points/search` - Search by location/coordinates

### 3.4 Middleware

- `authMiddleware` - Verify JWT token
- `roleMiddleware` - Check user role
- `creatorMiddleware` - Verify Creator role
- `adminMiddleware` - Verify Admin role
- `uploadMiddleware` - Handle image uploads

## 4. Frontend Implementation

### 4.1 Setup & Dependencies

- React + Vite
- React Router
- Leaflet + React-Leaflet cho map
- Axios cho API calls
- React Context cho auth state
- Tailwind CSS hoặc Material-UI cho styling

### 4.2 Components Structure

- **Layout Components**:
  - `MapView` - Main map với Leaflet
  - `Sidebar` - Navigation và filters
  - `SearchBar` - Tìm kiếm điểm cứu trợ
  - `ReliefPointMarker` - Custom marker trên map
  - `ReliefPointCard` - Card hiển thị thông tin điểm

- **Auth Components**:
  - `LoginButton` - Google OAuth login
  - `UserProfile` - Form điền thông tin verification

- **Creator Components**:
  - `CreateReliefPointForm` - Form tạo điểm cứu trợ
  - `UpdateReliefPointForm` - Form cập nhật điểm cứu trợ
  - `ReliefPointStatusSelector` - Chọn status

- **Donator Components**:
  - `ReliefPointList` - Danh sách điểm cứu trợ
  - `ReliefPointDetail` - Chi tiết điểm cứu trợ
  - `LocationSearch` - Tìm kiếm theo vị trí

### 4.3 Pages

- `/` - Home page với map
- `/login` - Google OAuth login
- `/profile` - User profile và verification
- `/create-relief-point` - Tạo điểm cứu trợ (Creator)
- `/relief-points/:id` - Chi tiết điểm cứu trợ
- `/relief-points/:id/edit` - Chỉnh sửa (Creator)

### 4.4 Features

- **Map Integration**:
  - Hiển thị tất cả relief points với custom markers
  - Click marker để xem chi tiết
  - Get user location để tính khoảng cách
  - Filter markers theo status

- **Search & Filter**:
  - Search theo địa chỉ/tỉnh thành
  - Filter theo status (Ongoing/Delivering/Done)
  - Sort theo khoảng cách từ user location

- **Google Maps Integration**:
  - Parse Google Maps link hoặc coordinates
  - Validate coordinates format

## 5. Authentication Flow

1. User click "Tạo điểm cứu trợ" hoặc "Đăng nhập"
2. Redirect đến Google OAuth
3. Callback với Google token
4. Backend verify token, tạo/update user trong DB
5. Return JWT token
6. Frontend store token, redirect đến profile nếu chưa có verification info
7. Creator điền thông tin verification (phone, CCCD, tax_code)
8. Sau khi verify, có thể tạo relief points

## 6. File Structure Details

### Backend Files:

- `backend/src/models/index.js` - Sequelize setup
- `backend/src/models/User.js`
- `backend/src/models/ReliefPoint.js`
- `backend/src/models/ReliefPointImage.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/reliefPoints.routes.js`
- `backend/src/controllers/auth.controller.js`
- `backend/src/controllers/reliefPoints.controller.js`
- `backend/src/middleware/auth.middleware.js`
- `backend/src/config/database.js`
- `backend/src/config/passport.js` - Google OAuth config
- `backend/server.js` - Entry point

### Frontend Files:

- `frontend/src/App.jsx` - Main app với routing
- `frontend/src/context/AuthContext.jsx` - Auth state management
- `frontend/src/services/api.js` - Axios instance và API calls
- `frontend/src/components/Map/MapView.jsx`
- `frontend/src/components/Map/ReliefPointMarker.jsx`
- `frontend/src/components/Sidebar/Sidebar.jsx`
- `frontend/src/components/SearchBar/SearchBar.jsx`
- `frontend/src/components/Forms/CreateReliefPointForm.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/CreateReliefPointPage.jsx`

## 7. Environment Variables

### Backend (.env):

- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- PORT
- UPLOAD_PATH (cho images)

### Frontend (.env):

- VITE_API_URL
- VITE_GOOGLE_CLIENT_ID

## 8. Implementation Steps

1. Setup backend structure với Express và Sequelize
2. Tạo database models và migrations
3. Implement Google OAuth authentication
4. Implement CRUD APIs cho relief points
5. Setup frontend với Vite và React
6. Implement Leaflet map integration
7. Build UI components (Sidebar, SearchBar, Forms)
8. Connect frontend với backend APIs
9. Implement image upload functionality
10. Testing và refinement