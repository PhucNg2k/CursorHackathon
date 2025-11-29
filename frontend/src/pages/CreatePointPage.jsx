import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pointsAPI } from '../services/api'
import './CreatePointPage.css'

function CreatePointPage() {
  const { isAuthenticated, isVerified } = useAuth()
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
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (!isVerified) {
    return (
      <div className="create-point-page">
        <div className="error-message">
          <h2>Verification Required</h2>
          <p>You need to verify your creator account before creating donation points.</p>
          <button onClick={() => navigate('/profile')}>Go to Profile</button>
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

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files))
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
      images.forEach((image) => {
        formDataToSend.append('files', image)
      })

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
              />
              <button type="button" onClick={handleGetLocation} className="get-location-btn">
                Get Current Location
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
            />
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

          <div className="form-group">
            <label>Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <p className="image-count">{images.length} image(s) selected</p>
            )}
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

