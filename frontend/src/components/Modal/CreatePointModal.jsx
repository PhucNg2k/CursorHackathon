import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { pointsAPI } from '../../services/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './CreatePointModal.css'

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

function CreatePointModal({ isOpen, onClose, onSuccess }) {
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    organization_name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    start_date: '',
    end_date: '',
  })
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="error-message">
            <h2>Authentication Required</h2>
            <p>You need to login to create donation points.</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
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

      await pointsAPI.create(formDataToSend)
      alert('Donation point created successfully!')
      
      // Reset form
      setFormData({
        organization_name: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        start_date: '',
        end_date: '',
      })
      
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create point:', error)
      alert(error.response?.data?.detail || 'Failed to create donation point')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        organization_name: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        start_date: '',
        end_date: '',
      })
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content create-point-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Donation Point</h2>
          <button className="close-button" onClick={handleClose} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Organization Name *</label>
            <input
              type="text"
              name="organization_name"
              value={formData.organization_name}
              onChange={handleInputChange}
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <div className="location-buttons">
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="get-location-btn"
                disabled={loading}
              >
                Get Location
              </button>
              <button 
                type="button" 
                onClick={() => setShowMap(!showMap)} 
                className="map-pinning-btn"
                disabled={loading}
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
                    style={{ height: '300px', width: '100%', borderRadius: '5px', marginTop: '1rem' }}
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
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '5px', marginTop: '1rem' }}>
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
                  disabled={loading}
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
                  disabled={loading}
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
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={handleClose} 
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="submit-button"
            >
              {loading ? 'Creating...' : 'Create Point'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePointModal

