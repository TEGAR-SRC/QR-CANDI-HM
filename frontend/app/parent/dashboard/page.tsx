'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { formatDate, formatTime, getStatusColor, getStatusText } from '@/lib/utils'
import Link from 'next/link'

interface Child {
  siswa_id: number
  nis: string
  nama_siswa: string
  nama_kelas: string
  tingkat: string
  hubungan: string
}

interface AttendanceStats {
  sekolah: {
    total_hari: number
    hadir_masuk: number
    terlambat_masuk: number
    tidak_hadir_masuk: number
    hadir_pulang: number
  }
  kelas: {
    total_absensi: number
    hadir: number
    terlambat: number
    tidak_hadir: number
    izin: number
    sakit: number
  }
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      fetchChildStats(selectedChild.siswa_id)
    }
  }, [selectedChild])

  const fetchChildren = async () => {
    try {
      const response = await api.get('/parents/children')
      if (response.data.success) {
        setChildren(response.data.data)
        if (response.data.data.length > 0) {
          setSelectedChild(response.data.data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildStats = async (siswaId: number) => {
    try {
      const response = await api.get(`/parents/children/${siswaId}/stats`)
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching child stats:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  const getAttendanceIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'terlambat':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'tidak_hadir':
      case 'tidak hadir':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const attendanceRate = stats?.sekolah ? 
    Math.round((stats.sekolah.hadir_masuk / stats.sekolah.total_hari) * 100) : 0

  return (
    <Layout allowedRoles={['orang_tua']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Orang Tua</h1>
          <p className="text-gray-600">Pantau kehadiran dan perkembangan anak Anda</p>
        </div>

        {/* Children Selection */}
        {children.length > 0 && (
          <Card title="Pilih Anak">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <button
                  key={child.siswa_id}
                  onClick={() => setSelectedChild(child)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedChild?.siswa_id === child.siswa_id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary-600">
                        {child.nama_siswa.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{child.nama_siswa}</h3>
                      <p className="text-sm text-gray-500">{child.nama_kelas}</p>
                      <p className="text-xs text-gray-400">NIS: {child.nis}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {selectedChild && (
          <>
            {/* Child Info */}
            <Card title={`Data ${selectedChild.nama_siswa}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nama Lengkap</p>
                  <p className="font-medium">{selectedChild.nama_siswa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kelas</p>
                  <p className="font-medium">{selectedChild.nama_kelas} ({selectedChild.tingkat})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NIS</p>
                  <p className="font-medium">{selectedChild.nis}</p>
                </div>
              </div>
            </Card>

            {/* Attendance Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Statistik Absensi Sekolah">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tingkat Kehadiran</span>
                    <span className="text-2xl font-bold text-primary-600">{attendanceRate}%</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-gray-600">Hadir Tepat Waktu</span>
                      </div>
                      <span className="font-medium">{stats?.sekolah.hadir_masuk || 0} hari</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-gray-600">Terlambat</span>
                      </div>
                      <span className="font-medium">{stats?.sekolah.terlambat_masuk || 0} hari</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-gray-600">Tidak Hadir</span>
                      </div>
                      <span className="font-medium">{stats?.sekolah.tidak_hadir_masuk || 0} hari</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Statistik Absensi Kelas">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Absensi</span>
                    <span className="font-medium">{stats?.kelas.total_absensi || 0}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Hadir</span>
                      </div>
                      <span className="font-medium">{stats?.kelas.hadir || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Terlambat</span>
                      </div>
                      <span className="font-medium">{stats?.kelas.terlambat || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Tidak Hadir</span>
                      </div>
                      <span className="font-medium">{stats?.kelas.tidak_hadir || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card title="Aksi Cepat">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href={`/parent/children/${selectedChild.siswa_id}/attendance`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Riwayat Absensi</h3>
                        <p className="text-sm text-gray-500">Lihat detail kehadiran anak</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/parent/children">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Data Anak</h3>
                        <p className="text-sm text-gray-500">Kelola data anak-anak</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </>
        )}

        {children.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Anak</h3>
              <p className="text-gray-500">Hubungi operator sekolah untuk mendaftarkan data anak Anda</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}