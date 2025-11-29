import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No token available for fetchUser')
        setUser(null)
        return null
      }
      
      console.log('Fetching user with token:', token.substring(0, 20) + '...')
      const response = await authAPI.getMe()
      console.log('User fetched:', response.data)
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      localStorage.removeItem('token')
      setUser(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (idToken) => {
    try {
      console.log('[LOGIN] Starting login with idToken:', idToken.substring(0, 20) + '...')
      const response = await authAPI.login(idToken)
      console.log('[LOGIN] Response received:', response)
      console.log('[LOGIN] Response data:', response.data)
      console.log('[LOGIN] Response status:', response.status)
      
      const { access_token } = response.data
      console.log('[LOGIN] Access token extracted:', access_token ? access_token.substring(0, 20) + '...' : 'NULL')
      
      if (!access_token) {
        console.error('[LOGIN] No access token in response.data')
        console.error('[LOGIN] Full response.data:', JSON.stringify(response.data, null, 2))
        return { success: false, error: 'No access token received' }
      }
      
      // Store token first
      try {
        localStorage.setItem('token', access_token)
        const storedToken = localStorage.getItem('token')
        console.log('[LOGIN] Token stored in localStorage:', storedToken ? storedToken.substring(0, 20) + '...' : 'FAILED')
        
        if (!storedToken) {
          console.error('[LOGIN] Failed to store token in localStorage')
          return { success: false, error: 'Failed to store token' }
        }
      } catch (storageError) {
        console.error('[LOGIN] localStorage error:', storageError)
        return { success: false, error: 'Failed to store token: ' + storageError.message }
      }
      
      // Wait a bit for token to be stored, then fetch user
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Fetch user and wait for it to complete
      await fetchUser()
      // Ensure user state is set before returning
      return { success: true }
    } catch (error) {
      console.error('[LOGIN] Login failed:', error)
      console.error('[LOGIN] Error details:', error.response?.data)
      console.error('[LOGIN] Error status:', error.response?.status)
      console.error('[LOGIN] Error message:', error.message)
      localStorage.removeItem('token')
      return { success: false, error: error.response?.data?.detail || error.message || 'Login failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    fetchUser,
    isAuthenticated: !!user,
    isVerified: user?.verified || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

