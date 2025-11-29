import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/Map/MapView'
import Sidebar from '../components/Sidebar/Sidebar'
import SearchBar from '../components/SearchBar/SearchBar'
import CreatePointModal from '../components/Modal/CreatePointModal'
import { pointsAPI } from '../services/api'
import './HomePage.css'

function HomePage() {
  const { isAuthenticated } = useAuth()
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    verified: null,
  })
  const [userLocation, setUserLocation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [centerPoint, setCenterPoint] = useState(null)

  useEffect(() => {
    fetchPoints()
    getCurrentLocation()
  }, [filters])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const fetchPoints = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.search) {
        // For now, we'll fetch all and filter client-side
        // Backend doesn't have text search yet
      }
      if (userLocation) {
        params.lat = userLocation.lat
        params.lng = userLocation.lng
        params.radius = 50 // 50km radius
      }
      const response = await pointsAPI.getAll(params)
      setPoints(response.data)
    } catch (error) {
      console.error('Failed to fetch points:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm })
  }

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  const handlePointCreated = () => {
    // Refresh points list after creating
    fetchPoints()
  }

  const handlePointClick = (point) => {
    setCenterPoint(point)
  }

  return (
    <div className="home-page">
      <Sidebar
        points={points}
        loading={loading}
        onFilterChange={handleFilterChange}
        filters={filters}
        onCreatePoint={() => setIsModalOpen(true)}
        onPointClick={handlePointClick}
      />
      <div className="map-container">
        <SearchBar 
          onSearch={handleSearch}
          onCreatePoint={() => setIsModalOpen(true)}
        />
        <MapView
          points={points}
          userLocation={userLocation}
          loading={loading}
          centerPoint={centerPoint}
        />
        {isAuthenticated && (
          <button 
            className="create-point-fab"
            onClick={() => setIsModalOpen(true)}
            title="Create Donation Point"
          >
            <span>+</span>
            <span className="fab-text">Create Point</span>
          </button>
        )}
        <CreatePointModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handlePointCreated}
        />
      </div>
    </div>
  )
}

export default HomePage

