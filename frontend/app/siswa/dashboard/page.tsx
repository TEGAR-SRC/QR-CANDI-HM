'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { formatDate, formatTime, getStatusColor, getStatusText } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  absensi_hari_ini: {
    tanggal: string
    jam_masuk: string
    jam_pulang: string
    status_masuk: string
    status_pulang: string
  } | null
  riwayat_absensi: Array<{
    tanggal: string
    jam_masuk: string
    jam_pulang: string
    status_masuk: string
    status_pulang: string
  }>
  statistik_bulan_ini: {
    total_hari: number
    hadir: number
    terlambat: number
    tidak_hadir: number
  }
}

export default function SiswaDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard')
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  const attendanceRate = data?.statistik_bulan_ini ? 
    Math.round((data.statistik_bulan_ini.hadir / data.statistik_bulan_ini.total_hari) * 100) : 0

  return (
    <Layout allowedRoles={['siswa']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Siswa</h1>
          <p className="text-gray-600">Selamat datang di sistem absensi Candi QR</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/siswa/scan">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg mr-4">
                  <UserCheck className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
                  <p className="text-gray-600">Lakukan absensi dengan scan barcode</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/siswa/history">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Riwayat Absensi</h3>
                  <p className="text-gray-600">Lihat riwayat kehadiran Anda</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Today's Attendance */}
        <Card title="Absensi Hari Ini">
          {data?.absensi_hari_ini ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getAttendanceIcon(data.absensi_hari_ini.status_masuk)}
                  <span className="ml-2 text-sm text-gray-600">Status Masuk</span>
                </div>
                <Badge variant={data.absensi_hari_ini.status_masuk === 'hadir' ? 'success' : 
                               data.absensi_hari_ini.status_masuk === 'terlambat' ? 'warning' : 'error'}>
                  {getStatusText(data.absensi_hari_ini.status_masuk)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Jam Masuk</p>
                  <p className="font-medium">{formatTime(data.absensi_hari_ini.jam_masuk)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jam Pulang</p>
                  <p className="font-medium">{formatTime(data.absensi_hari_ini.jam_pulang)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada absensi hari ini</p>
              <Link href="/siswa/scan">
                <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                  Lakukan Absensi Sekarang
                </button>
              </Link>
            </div>
          )}
        </Card>

        {/* Monthly Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Statistik Bulan Ini">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tingkat Kehadiran</span>
                <span className="text-2xl font-bold text-primary-600">{attendanceRate}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">Hadir</span>
                  </div>
                  <span className="font-medium">{data?.statistik_bulan_ini.hadir || 0} hari</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-gray-600">Terlambat</span>
                  </div>
                  <span className="font-medium">{data?.statistik_bulan_ini.terlambat || 0} hari</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-gray-600">Tidak Hadir</span>
                  </div>
                  <span className="font-medium">{data?.statistik_bulan_ini.tidak_hadir || 0} hari</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Riwayat Terbaru">
            <div className="space-y-3">
              {data?.riwayat_absensi && data.riwayat_absensi.length > 0 ? (
                data.riwayat_absensi.slice(0, 5).map((absensi, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(absensi.tanggal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(absensi.jam_masuk)} - {formatTime(absensi.jam_pulang)}
                      </p>
                    </div>
                    <Badge variant={absensi.status_masuk === 'hadir' ? 'success' : 
                                   absensi.status_masuk === 'terlambat' ? 'warning' : 'error'}>
                      {getStatusText(absensi.status_masuk)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belum ada riwayat absensi</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}