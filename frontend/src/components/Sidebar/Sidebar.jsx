import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

function Sidebar({ points, loading, onFilterChange, filters, onCreatePoint }) {
  const { isAuthenticated, user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="sidebar-wrapper">
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content" style={{ display: isOpen ? 'block' : 'none' }}>
            <div className="sidebar-header">
              <h2>Donation Points</h2>
              {isAuthenticated ? (
                <div className="user-info">
                  <p>Welcome, {user?.name}</p>
                  <div className="user-actions">
                    <Link to="/profile">Profile</Link>
                    <button onClick={logout}>Logout</button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="login-link">Login</Link>
              )}
            </div>

            <div className="sidebar-filters">
              <h3>Filters</h3>
              <select
                value={filters.verified !== null ? filters.verified.toString() : ''}
                onChange={(e) =>
                  onFilterChange({
                    verified: e.target.value === '' ? null : e.target.value === 'true',
                  })
                }
              >
                <option value="">All Creators</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>

            <div className="points-list">
              <h3>Points ({points.length})</h3>
              {loading ? (
                <p>Loading...</p>
              ) : points.length === 0 ? (
                <p>No donation points found</p>
              ) : (
                <ul>
                  {points.map((point) => (
                    <li key={point.id}>
                      <Link to={`/points/${point.id}`}>
                        <div className="point-item">
                          <h4>{point.organization_name}</h4>
                          <p>{point.address}</p>
                          <span className={`status ${point.status}`}>{point.status}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      </div>
      <button 
        className="toggle-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? '←' : '→'}
      </button>
    </div>
  )
}

export default Sidebar
