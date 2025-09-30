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
  Settings,
  UserPlus,
  BarChart3
} from 'lucide-react'

interface SchoolData {
  total_siswa: number
  total_guru: number
  total_kelas: number
  total_orang_tua: number
  absensi_hari_ini: number
  absensi_bulan_ini: number
}

export default function OperatorDashboard() {
  const [data, setData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/operators/school-data')
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
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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

  const statCards = [
    {
      title: 'Total Siswa',
      value: data?.total_siswa || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Guru',
      value: data?.total_guru || 0,
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Kelas',
      value: data?.total_kelas || 0,
      icon: School,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Orang Tua',
      value: data?.total_orang_tua || 0,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <Layout allowedRoles={['operator']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Operator</h1>
          <p className="text-gray-600">Kelola data sekolah dan sistem absensi</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Stats */}
          <Card title="Statistik Absensi">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Absensi Hari Ini</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {data?.absensi_hari_ini || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Absensi Bulan Ini</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {data?.absensi_bulan_ini || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Aksi Cepat">
            <div className="space-y-3">
              <a
                href="/operator/users"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Kelola User</h3>
                  <p className="text-sm text-gray-500">Lihat dan kelola semua user</p>
                </div>
              </a>
              
              <a
                href="/operator/bulk-create"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Buat User Massal</h3>
                  <p className="text-sm text-gray-500">Import data siswa, guru, orang tua</p>
                </div>
              </a>
              
              <a
                href="/operator/settings"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Pengaturan Sekolah</h3>
                  <p className="text-sm text-gray-500">Konfigurasi sistem sekolah</p>
                </div>
              </a>
            </div>
          </Card>
        </div>

        {/* System Status */}
        <Card title="Status Sistem">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">API Server</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">WhatsApp API</p>
              <p className="text-xs text-gray-500">Configured</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}