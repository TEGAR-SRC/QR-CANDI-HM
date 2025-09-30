'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect based on user role
        switch (user.role) {
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
            router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-primary-600 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  return null
}