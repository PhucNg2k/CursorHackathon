# Donation Points Frontend

React + Vite frontend for the Donation Points Map application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

4. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- Google OAuth authentication
- Interactive map with Leaflet
- Create and view donation points
- Search and filter functionality
- Responsive design

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Map/        # Map components
│   │   ├── Sidebar/    # Sidebar component
│   │   └── SearchBar/  # Search bar component
│   ├── context/        # React Context (Auth)
│   ├── pages/          # Page components
│   ├── services/       # API service
│   └── App.jsx         # Main app component
├── public/             # Static files
└── package.json
```

## Build

```bash
npm run build
```

The build output will be in the `dist` directory.

