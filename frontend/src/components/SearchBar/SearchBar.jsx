import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './SearchBar.css'

function SearchBar({ onSearch, onCreatePoint }) {
  const [searchTerm, setSearchTerm] = useState('')
  const { isAuthenticated } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search donation points..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {isAuthenticated && (
        <button 
          className="create-point-button"
          onClick={onCreatePoint}
        >
          + Create Point
        </button>
      )}
    </div>
  )
}

export default SearchBar

