"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
    }
    
    setLoading(false)
  }, [])

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAccessToken(data.accessToken)
        localStorage.setItem('accessToken', data.accessToken)
        return data.accessToken
      } else {
        // Refresh token invalid, logout
        await logout()
        return null
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }, [])

  // Auto-refresh token before expiry (every 10 minutes)
  useEffect(() => {
    if (!accessToken) return

    const interval = setInterval(() => {
      refreshAccessToken()
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
  }, [accessToken, refreshAccessToken])

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setUser(data.user)
      setAccessToken(data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('accessToken', data.accessToken)

      router.push('/')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signup = async (email, password) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      return { success: true, email: data.email }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const resendOTP = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      router.push('/auth')
    }
  }

  const value = {
    user,
    accessToken,
    loading,
    login,
    signup,
    verifyOTP,
    resendOTP,
    logout,
    refreshAccessToken,
    isAuthenticated: !!user && !!accessToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
