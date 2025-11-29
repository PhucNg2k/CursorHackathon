import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { pointsAPI } from '../../services/api'
import './CreatePointModal.css'

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          })
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
            <label>Latitude *</label>
            <div className="location-input">
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
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="get-location-btn"
                disabled={loading}
              >
                Get Location
              </button>
            </div>
          </div>

          <div className="form-group">
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

