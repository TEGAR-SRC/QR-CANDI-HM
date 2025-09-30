'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  Users, 
  GraduationCap, 
  School, 
  UserCheck, 
  TrendingUp, 
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  total_siswa: number
  total_guru: number
  total_kelas: number
  absensi_hari_ini: number
  absensi_bulan_ini: number
  siswa_terlambat: number
  kelas_populer: Array<{
    nama_kelas: string
    total_absensi: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard')
      console.log('Dashboard API Response:', response.data) // Debug log
      if (response.data.success) {
        setStats(response.data.data)
      } else {
        console.warn('API returned success: false', response.data)
        // Set default stats if API fails
        setStats({
          total_siswa: 0,
          total_guru: 0,
          total_kelas: 0,
          absensi_hari_ini: 0,
          absensi_bulan_ini: 0,
          siswa_terlambat: 0,
          kelas_populer: []
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default stats on error
      setStats({
        total_siswa: 0,
        total_guru: 0,
        total_kelas: 0,
        absensi_hari_ini: 0,
        absensi_bulan_ini: 0,
        siswa_terlambat: 0,
        kelas_populer: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Remove loading state to always show content

  // Default stats if API fails
  const defaultStats = {
    total_siswa: 0,
    total_guru: 0,
    total_kelas: 0,
    absensi_hari_ini: 0,
    absensi_bulan_ini: 0,
    siswa_terlambat: 0,
    kelas_populer: []
  }

  const currentStats = stats || defaultStats

  const statCards = [
    {
      title: 'Total Siswa',
      value: currentStats.total_siswa,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Guru',
      value: currentStats.total_guru,
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Kelas',
      value: currentStats.total_kelas,
      icon: School,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Absensi Hari Ini',
      value: currentStats.absensi_hari_ini,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-8 max-w-7xl mx-auto pt-8 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600 text-lg">Selamat datang di sistem absensi Candi QR</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className={`p-4 rounded-xl ${stat.bgColor} shadow-sm`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Monthly Attendance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Bulan Ini</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Absensi</p>
                    <p className="text-2xl font-bold text-gray-900">{currentStats.absensi_bulan_ini}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Siswa Terlambat Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{currentStats.siswa_terlambat}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Popular Classes */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kelas dengan Absensi Terbanyak Hari Ini</h3>
            <div className="space-y-3">
              {currentStats.kelas_populer && currentStats.kelas_populer.length > 0 ? (
                currentStats.kelas_populer.map((kelas, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">{kelas.nama_kelas}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {kelas.total_absensi} absensi
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Tidak ada data</p>
                  <p className="text-gray-400 text-sm">Data akan muncul setelah ada absensi</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/admin/students"
              className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Kelola Siswa</h3>
              <p className="text-gray-600">Tambah, edit, atau hapus data siswa</p>
            </a>
            <a
              href="/admin/attendance"
              className="group p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Lihat Absensi</h3>
              <p className="text-gray-600">Monitor kehadiran siswa</p>
            </a>
            <a
              href="/admin/reports"
              className="group p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Laporan</h3>
              <p className="text-gray-600">Generate laporan absensi</p>
            </a>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Sistem siap digunakan</p>
                <p className="text-sm text-gray-600">Database berhasil diinisialisasi dengan data default</p>
              </div>
              <span className="text-xs text-gray-500">Baru saja</span>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Admin login berhasil</p>
                <p className="text-sm text-gray-600">Administrator berhasil masuk ke sistem</p>
              </div>
              <span className="text-xs text-gray-500">Baru saja</span>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Belum ada data</p>
                <p className="text-sm text-gray-600">Mulai tambahkan siswa, guru, dan kelas untuk melihat statistik</p>
              </div>
              <span className="text-xs text-gray-500">Info</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}