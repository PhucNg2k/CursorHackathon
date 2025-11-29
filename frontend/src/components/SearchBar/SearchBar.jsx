import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './SearchBar.css'

function SearchBar({ onSearch, onCreatePoint }) {
  const [searchTerm, setSearchTerm] = useState('')
  const { isAuthenticated } = useAuth()

  const handleChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value) // Search on every keystroke
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Search already happens on keystroke, but keep form for accessibility
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search donation points..."
          value={searchTerm}
          onChange={handleChange}
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

