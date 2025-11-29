import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initializeGoogleSignIn()
      }
      document.body.appendChild(script)
    }

    loadGoogleScript()
  }, [])

  const initializeGoogleSignIn = () => {
    if (!window.google || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      console.error('Google Sign-In not configured')
      return
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    })

    const buttonDiv = document.getElementById('google-signin-button')
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
      })
    }
  }

  const handleCredentialResponse = async (response) => {
    try {
      console.log('[LOGIN PAGE] Google credential received:', response.credential.substring(0, 20) + '...')
      const result = await login(response.credential)
      console.log('[LOGIN PAGE] Login result:', result)
      
      // Check if token is in localStorage
      const token = localStorage.getItem('token')
      console.log('[LOGIN PAGE] Token in localStorage after login:', token ? token.substring(0, 20) + '...' : 'NOT FOUND')
      
      if (result.success) {
        // Navigate immediately after successful login
        navigate('/', { replace: true })
      } else {
        alert(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('[LOGIN PAGE] Login error:', error)
      console.error('[LOGIN PAGE] Error stack:', error.stack)
      alert('Login failed: ' + (error.message || 'Please try again.'))
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Donation Points Map</h1>
        <p>Sign in with Google to continue</p>
        <div id="google-signin-button"></div>
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <p style={{ color: 'red', marginTop: '1rem' }}>
            Please configure VITE_GOOGLE_CLIENT_ID in .env file
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginPage

