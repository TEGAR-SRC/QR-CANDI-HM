'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { 
  Users, 
  GraduationCap, 
  School, 
  UserCheck, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Settings,
  Download,
  Upload,
  BarChart3,
  Activity,
  Zap,
  Shield,
  Crown
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SuperDashboardData {
  statistik: {
    total_users: number
    total_siswa: number
    total_guru: number
    total_orang_tua: number
    total_kelas: number
    absensi_hari_ini: number
    absensi_bulan_ini: number
  }
  kehadiran_hari_ini: {
    hadir: number
    terlambat: number
    tidak_hadir: number
  }
  top_kelas: Array<{
    nama_kelas: string
    total_absensi: number
    hadir: number
    persentase_hadir: number
  }>
  aktivitas_terbaru: Array<{
    tipe: string
    detail: string
    waktu: string
    status: string
  }>
  statistik_per_jam: Array<{
    jam: number
    jumlah_absensi: number
  }>
}

export default function SuperDashboardPage() {
  const [data, setData] = useState<SuperDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuperDashboardData()
  }, [])

  const fetchSuperDashboardData = async () => {
    try {
      const response = await api.get('/super-admin/dashboard')
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching super dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      title: 'Total Users',
      value: data?.statistik.total_users || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12%'
    },
    {
      title: 'Total Siswa',
      value: data?.statistik.total_siswa || 0,
      icon: School,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+8%'
    },
    {
      title: 'Total Guru',
      value: data?.statistik.total_guru || 0,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+5%'
    },
    {
      title: 'Absensi Hari Ini',
      value: data?.statistik.absensi_hari_ini || 0,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+15%'
    }
  ]

  const kehadiranStats = [
    {
      label: 'Hadir',
      value: data?.kehadiran_hari_ini.hadir || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    {
      label: 'Terlambat',
      value: data?.kehadiran_hari_ini.terlambat || 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: Clock
    },
    {
      label: 'Tidak Hadir',
      value: data?.kehadiran_hari_ini.tidak_hadir || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle
    }
  ]

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Crown className="h-8 w-8 text-yellow-600" />
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">Fitur dewa yang tidak ada di role lain</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          </div>
        </div>

        {/* Super Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </Card>
          ))}
        </div>

        {/* Kehadiran Hari Ini */}
        <Card title="Kehadiran Hari Ini" className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kehadiranStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Kelas & Aktivitas Terbaru */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Kelas */}
          <Card title="Top Kelas dengan Kehadiran Terbaik">
            <div className="space-y-4">
              {data?.top_kelas && data.top_kelas.length > 0 ? (
                data.top_kelas.map((kelas, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{kelas.nama_kelas}</p>
                        <p className="text-sm text-gray-600">{kelas.total_absensi} total absensi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{kelas.persentase_hadir}%</p>
                      <p className="text-xs text-gray-500">{kelas.hadir} hadir</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data kehadiran hari ini</p>
                </div>
              )}
            </div>
          </Card>

          {/* Aktivitas Terbaru */}
          <Card title="Aktivitas Sistem Terbaru">
            <div className="space-y-3">
              {data?.aktivitas_terbaru && data.aktivitas_terbaru.length > 0 ? (
                data.aktivitas_terbaru.map((aktivitas, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {aktivitas.detail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(aktivitas.waktu)} • {aktivitas.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada aktivitas terbaru</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Statistik Per Jam */}
        <Card title="Statistik Absensi Per Jam">
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {data?.statistik_per_jam && data.statistik_per_jam.length > 0 ? (
              data.statistik_per_jam.map((stat, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-full bg-primary-100 rounded-t"
                    style={{ height: `${(stat.jumlah_absensi / Math.max(...data.statistik_per_jam.map(s => s.jumlah_absensi))) * 60}px` }}
                  ></div>
                  <p className="text-xs text-gray-600 mt-1">{stat.jam}:00</p>
                  <p className="text-xs font-medium text-gray-900">{stat.jumlah_absensi}</p>
                </div>
              ))
            ) : (
              <div className="col-span-12 text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data statistik per jam</p>
              </div>
            )}
          </div>
        </Card>

        {/* Super Admin Features */}
        <Card title="Fitur Super Admin" className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
              <MapPin className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Kelola Lokasi</h3>
              <p className="text-sm text-gray-500">Set titik absensi GPS</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
              <Clock className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Jadwal Absensi</h3>
              <p className="text-sm text-gray-500">Atur jam absensi</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
              <Shield className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Level Users</h3>
              <p className="text-sm text-gray-500">Kelola permission</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Status Absensi</h3>
              <p className="text-sm text-gray-500">Kustomisasi status</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}