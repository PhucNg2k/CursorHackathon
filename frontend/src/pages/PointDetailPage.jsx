import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pointsAPI, getImageUrl } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './PointDetailPage.css'

function PointDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [point, setPoint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPoint()
  }, [id])

  const fetchPoint = async () => {
    try {
      const response = await pointsAPI.getById(id)
      setPoint(response.data)
    } catch (error) {
      console.error('Failed to fetch point:', error)
      alert('Failed to load donation point')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="point-detail-page">Loading...</div>
  }

  if (!point) {
    return <div className="point-detail-page">Point not found</div>
  }

  const isOwner = user && user.id === point.creator_id

  return (
    <div className="point-detail-page">
      <div className="point-detail-container">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Map
        </button>

        <h1>{point.organization_name}</h1>

        {point.image_url && (
          <div className="point-image-section">
            <img 
              src={getImageUrl(point.image_url)} 
              alt={point.organization_name}
              className="point-detail-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className="point-info">
          <p><strong>Address:</strong> {point.address}</p>
          <p><strong>Status:</strong> <span className={`status ${point.status}`}>{point.status}</span></p>
          {point.description && (
            <p><strong>Description:</strong> {point.description}</p>
          )}
          {point.start_date && (
            <p><strong>Start Date:</strong> {new Date(point.start_date).toLocaleString()}</p>
          )}
          {point.end_date && (
            <p><strong>End Date:</strong> {new Date(point.end_date).toLocaleString()}</p>
          )}
          <p><strong>Created:</strong> {new Date(point.created_at).toLocaleString()}</p>
        </div>

        <div className="point-location">
          <h2>Location</h2>
          <p>Latitude: {point.latitude}</p>
          <p>Longitude: {point.longitude}</p>
          <a
            href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="map-link"
          >
            Open in Google Maps
          </a>
        </div>

        {isOwner && (
          <div className="owner-actions">
            <button onClick={() => navigate(`/points/${id}/edit`)} className="edit-button">
              Edit Point
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PointDetailPage

