import axios from 'axios'

// Use relative URLs in development (to use Vite proxy) or full URL in production
const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL, // Empty string uses relative URLs, which will go through Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('No token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (idToken) => {
    console.log('[API] Calling login with idToken:', idToken.substring(0, 20) + '...')
    try {
      const response = await api.post('/api/creators/login', { id_token: idToken })
      console.log('[API] Login response:', response)
      console.log('[API] Login response.data:', response.data)
      return response
    } catch (error) {
      console.error('[API] Login error:', error)
      console.error('[API] Login error response:', error.response)
      throw error
    }
  },
  getMe: () => api.get('/api/creators/me'),
  updateProfile: (id, data) => api.patch(`/api/creators/${id}`, data),
  verifyCreator: (id) => api.post(`/api/creators/${id}/verify`),
}

// Admin API
export const adminAPI = {
  listCreators: () => api.get('/api/admin/creators'),
  verifyCreator: (id) => api.post(`/api/admin/creators/${id}/verify`),
  unverifyCreator: (id) => api.post(`/api/admin/creators/${id}/unverify`),
}

// Helper function to get full image URL
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // Otherwise, construct full URL using the API base URL
  const baseURL = API_URL || ''
  return `${baseURL}${imageUrl}`
}

// Donation Points API
export const pointsAPI = {
  getAll: (params) => api.get('/api/donation-points', { params }),
  getById: (id) => api.get(`/api/donation-points/${id}`),
  create: (formData) => api.post('/api/donation-points', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/api/donation-points/${id}`, data),
}

export default api

