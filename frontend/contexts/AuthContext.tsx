'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'guru' | 'siswa' | 'operator' | 'orang_tua'
  full_name: string
  phone?: string
  is_active: boolean
  // Additional fields based on role
  nis?: string
  nisn?: string
  barcode_id?: string
  kelas_id?: number
  nama_kelas?: string
  tingkat?: string
  nip?: string
  nama_pelajaran?: string
  hubungan?: string
  pekerjaan?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get('token')
      if (savedToken) {
        try {
          setToken(savedToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
          
          // Get user profile
          const response = await api.get('/auth/profile')
          if (response.data.success) {
            setUser(response.data.data)
          } else {
            // Token invalid, clear it
            Cookies.remove('token')
            setToken(null)
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          Cookies.remove('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        
        // Save token to cookie
        Cookies.set('token', newToken, { expires: 7 }) // 7 days
        
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        
        setToken(newToken)
        setUser(userData)
        
        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            router.push('/admin/dashboard')
            break
          case 'guru':
            router.push('/guru/dashboard')
            break
          case 'siswa':
            router.push('/siswa/dashboard')
            break
          case 'operator':
            router.push('/operator/dashboard')
            break
          case 'orang_tua':
            router.push('/parent/dashboard')
            break
          default:
            router.push('/')
        }
      } else {
        throw new Error(response.data.message || 'Login gagal')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || 'Login gagal')
    }
  }

  const logout = () => {
    Cookies.remove('token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}