'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Users, 
  BarChart3,
  PieChart,
  FileText,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReportData {
  total_siswa: number
  total_guru: number
  total_kelas: number
  absensi_hari_ini: number
  absensi_bulan_ini: number
  persentase_kehadiran: number
  siswa_terlambat: number
  kelas_populer: Array<{
    nama_kelas: string
    total_absensi: number
    persentase_hadir: number
  }>
  statistik_harian: Array<{
    tanggal: string
    hadir: number
    terlambat: number
    tidak_hadir: number
    izin: number
    sakit: number
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchReportData()
    fetchClasses()
  }, [])

  const fetchReportData = async () => {
    try {
      const response = await api.get('/reports/attendance', {
        params: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          kelas_id: selectedClass
        }
      })
      if (response.data.success) {
        setReportData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      if (response.data.success) {
        setClasses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleExportExcel = async (type: string) => {
    try {
      const response = await api.get(`/reports/export/${type}`, {
        params: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          kelas_id: selectedClass
        },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laporan_${type}_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Laporan berhasil diexport')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Gagal mengexport laporan')
    }
  }

  const applyFilters = () => {
    fetchReportData()
  }

  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data laporan...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-8 w-8 mr-2 text-primary-600" />
              Laporan Absensi
            </h1>
            <p className="text-gray-600">Analisis dan laporan kehadiran siswa</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={applyFilters}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Terapkan Filter
              </button>
            </div>
          </div>
        </Card>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleExportExcel('daily')}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Harian
          </button>
          <button 
            onClick={() => handleExportExcel('monthly')}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Bulanan
          </button>
          <button 
            onClick={() => handleExportExcel('class')}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Per Kelas
          </button>
          <button 
            onClick={() => handleExportExcel('student')}
            className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Per Siswa
          </button>
        </div>

        {reportData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.total_siswa}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absensi Bulan Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.absensi_bulan_ini}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <PieChart className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Persentase Kehadiran</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.persentase_kehadiran}%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Siswa Terlambat</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.siswa_terlambat}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Classes */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kelas dengan Kehadiran Terbaik</h3>
                  <div className="space-y-4">
                    {reportData.kelas_populer?.slice(0, 5).map((kelas, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{kelas.nama_kelas}</p>
                            <p className="text-sm text-gray-500">{kelas.total_absensi} absensi</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{kelas.persentase_hadir}%</p>
                          <p className="text-xs text-gray-500">kehadiran</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Daily Statistics */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik 7 Hari Terakhir</h3>
                  <div className="space-y-3">
                    {reportData.statistik_harian?.slice(-7).map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(stat.tanggal).toLocaleDateString('id-ID', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        </div>
                        <div className="flex space-x-4 text-xs">
                          <span className="text-green-600 font-medium">H: {stat.hadir}</span>
                          <span className="text-yellow-600 font-medium">T: {stat.terlambat}</span>
                          <span className="text-red-600 font-medium">A: {stat.tidak_hadir}</span>
                          <span className="text-blue-600 font-medium">I: {stat.izin}</span>
                          <span className="text-purple-600 font-medium">S: {stat.sakit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Reports */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Laporan Detail</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                    <div className="flex items-center mb-3">
                      <FileText className="h-6 w-6 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Laporan Kehadiran Harian</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Rekap kehadiran siswa per hari dengan detail waktu masuk dan pulang</p>
                    <button 
                      onClick={() => handleExportExcel('daily-detail')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Download Laporan →
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                    <div className="flex items-center mb-3">
                      <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Statistik Per Kelas</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Analisis kehadiran dan performa setiap kelas</p>
                    <button 
                      onClick={() => handleExportExcel('class-statistics')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Download Laporan →
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                    <div className="flex items-center mb-3">
                      <Users className="h-6 w-6 text-purple-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Rekap Individual</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Laporan kehadiran per siswa dengan persentase kehadiran</p>
                    <button 
                      onClick={() => handleExportExcel('individual')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Download Laporan →
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {!reportData && !loading && (
          <Card className="p-12">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Tidak ada data laporan</p>
              <p className="text-gray-400 text-sm">Silakan pilih rentang tanggal dan terapkan filter</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}