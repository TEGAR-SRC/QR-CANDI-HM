'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import { Loader2 } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

export default function Layout({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [loading, isAuthenticated, user, requireAuth, allowedRoles, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (requireAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  )
}