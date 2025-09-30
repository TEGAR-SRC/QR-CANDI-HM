'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { 
  Calendar, 
  UserCheck, 
  Clock, 
  BookOpen,
  Users,
  TrendingUp
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface Schedule {
  id: number
  hari: string
  jam_mulai: string
  jam_selesai: string
  nama_kelas: string
  nama_pelajaran: string
}

interface AttendanceStats {
  total_absensi: number
  hadir: number
  terlambat: number
  tidak_hadir: number
}

interface DashboardData {
  jadwal_hari_ini: Schedule[]
  absensi_kelas_hari_ini: AttendanceStats
}

export default function GuruDashboard() {
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

  const getCurrentDay = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[new Date().getDay()]
  }

  const attendanceRate = data?.absensi_kelas_hari_ini ? 
    Math.round((data.absensi_kelas_hari_ini.hadir / data.absensi_kelas_hari_ini.total_absensi) * 100) : 0

  return (
    <Layout allowedRoles={['guru']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Guru</h1>
          <p className="text-gray-600">Selamat datang di sistem absensi Candi QR</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Jadwal Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.jadwal_hari_ini?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Absensi Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.absensi_kelas_hari_ini?.total_absensi || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card title={`Jadwal Mengajar - ${getCurrentDay()}`}>
          {data?.jadwal_hari_ini && data.jadwal_hari_ini.length > 0 ? (
            <div className="space-y-4">
              {data.jadwal_hari_ini.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Clock className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{schedule.nama_pelajaran}</h3>
                      <p className="text-sm text-gray-600">{schedule.nama_kelas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(schedule.jam_mulai)} - {formatTime(schedule.jam_selesai)}
                    </p>
                    <Badge variant="secondary">
                      {schedule.hari}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada jadwal mengajar hari ini</p>
            </div>
          )}
        </Card>

        {/* Today's Attendance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Statistik Absensi Kelas Hari Ini">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Absensi</span>
                <span className="text-lg font-semibold text-gray-900">
                  {data?.absensi_kelas_hari_ini?.total_absensi || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Hadir</span>
                  </div>
                  <span className="font-medium">{data?.absensi_kelas_hari_ini?.hadir || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Terlambat</span>
                  </div>
                  <span className="font-medium">{data?.absensi_kelas_hari_ini?.terlambat || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Tidak Hadir</span>
                  </div>
                  <span className="font-medium">{data?.absensi_kelas_hari_ini?.tidak_hadir || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Aksi Cepat">
            <div className="space-y-3">
              <a
                href="/guru/attendance"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Kelola Absensi</h3>
                  <p className="text-sm text-gray-500">Lihat dan kelola absensi kelas</p>
                </div>
              </a>
              
              <a
                href="/guru/schedules"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Jadwal Mengajar</h3>
                  <p className="text-sm text-gray-500">Lihat jadwal mengajar Anda</p>
                </div>
              </a>
              
              <a
                href="/guru/reports"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Laporan</h3>
                  <p className="text-sm text-gray-500">Generate laporan absensi</p>
                </div>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}