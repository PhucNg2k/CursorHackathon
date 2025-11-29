import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CreatePointPage from './pages/CreatePointPage'
import PointDetailPage from './pages/PointDetailPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-point" element={<CreatePointPage />} />
          <Route path="/points/:id" element={<PointDetailPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

