'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  MapPin,
  Download,
  Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Attendance {
  id: number
  siswa_id: number
  siswa_nama: string
  siswa_nis: string
  kelas: string
  tanggal: string
  jam_masuk: string
  jam_pulang: string
  status_masuk: string
  status_pulang: string
  latitude: number
  longitude: number
  foto_masuk: string
  foto_pulang: string
  keterangan: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'terlambat', label: 'Terlambat' },
  { value: 'tidak_hadir', label: 'Tidak Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' }
]

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchAttendances()
    fetchClasses()
  }, [])

  const fetchAttendances = async () => {
    try {
      const response = await api.get('/attendance', {
        params: {
          status: selectedStatus,
          kelas: selectedClass,
          tanggal: selectedDate
        }
      })
      if (response.data.success) {
        setAttendances(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
      toast.error('Gagal memuat data absensi')
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

  const filteredAttendances = attendances.filter(attendance => {
    const matchesSearch = attendance.siswa_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attendance.siswa_nis.includes(searchTerm) ||
                         attendance.kelas.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) return

    try {
      await api.delete(`/attendance/${id}`)
      toast.success('Data absensi berhasil dihapus')
      fetchAttendances()
    } catch (error) {
      console.error('Error deleting attendance:', error)
      toast.error('Gagal menghapus data absensi')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-800'
      case 'terlambat': return 'bg-yellow-100 text-yellow-800'
      case 'tidak_hadir': return 'bg-red-100 text-red-800'
      case 'izin': return 'bg-blue-100 text-blue-800'
      case 'sakit': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusStats = () => {
    const stats = {
      hadir: attendances.filter(a => a.status_masuk === 'hadir').length,
      terlambat: attendances.filter(a => a.status_masuk === 'terlambat').length,
      tidak_hadir: attendances.filter(a => a.status_masuk === 'tidak_hadir').length,
      izin: attendances.filter(a => a.status_masuk === 'izin').length,
      sakit: attendances.filter(a => a.status_masuk === 'sakit').length
    }
    return stats
  }

  useEffect(() => {
    fetchAttendances()
  }, [selectedStatus, selectedClass, selectedDate])

  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data absensi...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = getStatusStats()

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCheck className="h-8 w-8 mr-2 text-primary-600" />
              Data Absensi
            </h1>
            <p className="text-gray-600">Monitor dan kelola data kehadiran siswa</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Absensi
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari siswa (nama, NIS, kelas)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.nama_kelas}>
                  {cls.nama_kelas}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Hadir</p>
                <p className="text-lg font-bold text-gray-900">{stats.hadir}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Terlambat</p>
                <p className="text-lg font-bold text-gray-900">{stats.terlambat}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Tidak Hadir</p>
                <p className="text-lg font-bold text-gray-900">{stats.tidak_hadir}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Izin</p>
                <p className="text-lg font-bold text-gray-900">{stats.izin}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Sakit</p>
                <p className="text-lg font-bold text-gray-900">{stats.sakit}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jam Masuk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Masuk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jam Pulang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Pulang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {attendance.siswa_nama.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendance.siswa_nama}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attendance.siswa_nis} - {attendance.kelas}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(attendance.tanggal)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {attendance.jam_masuk || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attendance.status_masuk)}`}>
                          {attendance.status_masuk}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {attendance.jam_pulang || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attendance.status_pulang)}`}>
                          {attendance.status_pulang || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance.latitude && attendance.longitude ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-500">
                              {attendance.latitude.toFixed(4)}, {attendance.longitude.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(attendance.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAttendances.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Tidak ada data absensi ditemukan</p>
                  <p className="text-gray-400 text-sm">Coba ubah filter pencarian Anda</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}