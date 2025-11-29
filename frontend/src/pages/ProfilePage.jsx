import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import './ProfilePage.css'

function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      const response = await authAPI.updateProfile(user.id, formData)
      updateUser(response.data)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await authAPI.verifyCreator(user.id)
      updateUser(response.data)
      alert('Creator verified successfully!')
    } catch (error) {
      console.error('Failed to verify:', error)
      alert(error.response?.data?.detail || 'Failed to verify creator')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>
        <div className="profile-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        {!user.verified && (
          <button onClick={handleVerify} className="verify-button" disabled={loading}>
            Verify Creator
          </button>
        )}

        <button onClick={logout} className="logout-button">
          Logout
        </button>

        <button onClick={() => navigate('/')} className="back-button">
          Back to Map
        </button>
      </div>
    </div>
  )
}

export default ProfilePage

