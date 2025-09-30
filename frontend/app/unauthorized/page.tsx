'use client'

import { useRouter } from 'next/navigation'
import { ShieldX, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Akses Ditolak
        </h1>
        
        <p className="text-gray-600 mb-8">
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <Button
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Masuk Kembali
          </Button>
        </div>
      </div>
    </div>
  )
}