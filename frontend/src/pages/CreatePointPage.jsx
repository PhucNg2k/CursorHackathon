import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pointsAPI } from '../services/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './CreatePointPage.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng)
    },
  })
  return null
}

function CreatePointPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    organization_name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    start_date: '',
    end_date: '',
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get user's current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setSelectedLocation([lat, lng])
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }))
        },
        () => {
          // Default to Ho Chi Minh City if geolocation fails
          const defaultLat = 10.8231
          const defaultLng = 106.6297
          setSelectedLocation([defaultLat, defaultLng])
        }
      )
    } else {
      // Default to Ho Chi Minh City
      const defaultLat = 10.8231
      const defaultLng = 106.6297
      setSelectedLocation([defaultLat, defaultLng])
    }
  }, [])

  const handleMapClick = (latlng) => {
    const lat = latlng.lat
    const lng = latlng.lng
    setSelectedLocation([lat, lng])
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }))
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Update map marker when coordinates are manually entered
    if (name === 'latitude' || name === 'longitude') {
      const lat = name === 'latitude' ? parseFloat(value) : parseFloat(formData.latitude)
      const lng = name === 'longitude' ? parseFloat(value) : parseFloat(formData.longitude)
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setSelectedLocation([lat, lng])
      }
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }


  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setSelectedLocation([lat, lng])
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }))
        },
        (error) => {
          alert('Error getting location: ' + error.message)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('organization_name', formData.organization_name)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('latitude', parseFloat(formData.latitude))
      formDataToSend.append('longitude', parseFloat(formData.longitude))
      if (formData.description) {
        formDataToSend.append('description', formData.description)
      }
      if (formData.start_date) {
        formDataToSend.append('start_date', formData.start_date)
      }
      if (formData.end_date) {
        formDataToSend.append('end_date', formData.end_date)
      }
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      await pointsAPI.create(formDataToSend)
      alert('Donation point created successfully!')
      navigate('/')
    } catch (error) {
      console.error('Failed to create point:', error)
      alert(error.response?.data?.detail || 'Failed to create donation point')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-point-page">
      <div className="create-point-container">
        <h1>Create Donation Point</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name *</label>
            <input
              type="text"
              name="organization_name"
              value={formData.organization_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <div className="location-buttons">
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="get-location-btn"
              >
                Get Location
              </button>
              <button 
                type="button" 
                onClick={() => setShowMap(!showMap)} 
                className="map-pinning-btn"
              >
                {showMap ? 'Hide Map' : 'Map Pinning'}
              </button>
            </div>
            
            {showMap && (
              <div className="map-picker">
                {selectedLocation ? (
                  <MapContainer
                    key={`${selectedLocation[0]}-${selectedLocation[1]}`}
                    center={selectedLocation}
                    zoom={13}
                    style={{ height: '400px', width: '100%', borderRadius: '5px' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    <Marker position={selectedLocation} />
                  </MapContainer>
                ) : (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '5px' }}>
                    <p>Click on the map to set location</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="coordinates-input">
              <div className="coordinate-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  min="-90"
                  max="90"
                />
              </div>
              <div className="coordinate-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                  min="-180"
                  max="180"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Image (Optional)</label>
            {imagePreview ? (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="remove-image-btn"
                  disabled={loading}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="image-input"
                />
                <p className="image-hint">Accepted formats: JPEG, PNG, GIF, WebP (max 10MB)</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
            />
          </div>


          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating...' : 'Create Donation Point'}
          </button>

          <button type="button" onClick={() => navigate('/')} className="cancel-button">
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatePointPage

