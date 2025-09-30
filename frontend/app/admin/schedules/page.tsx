'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  BookOpen,
  Users
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Schedule {
  id: number
  mata_pelajaran: string
  kelas: string
  guru: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  ruang: string
  semester: string
  tahun_ajaran: string
  created_at: string
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchSchedules()
    fetchClasses()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules')
      if (response.data.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Gagal memuat data jadwal')
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

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.ruang.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDay = selectedDay === '' || schedule.hari === selectedDay
    const matchesClass = selectedClass === '' || schedule.kelas === selectedClass
    return matchesSearch && matchesDay && matchesClass
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return

    try {
      await api.delete(`/schedules/${id}`)
      toast.success('Jadwal berhasil dihapus')
      fetchSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Gagal menghapus jadwal')
    }
  }

  const groupSchedulesByDay = () => {
    const grouped: { [key: string]: Schedule[] } = {}
    DAYS.forEach(day => {
      grouped[day] = filteredSchedules
        .filter(schedule => schedule.hari === day)
        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
    })
    return grouped
  }

  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data jadwal...</p>
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
              <Calendar className="h-8 w-8 mr-2 text-primary-600" />
              Jadwal Pelajaran
            </h1>
            <p className="text-gray-600">Kelola jadwal mata pelajaran</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jadwal
          </button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari jadwal (mata pelajaran, guru, ruang)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="">Semua Hari</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
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
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jadwal</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mata Pelajaran</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(schedules.map(schedule => schedule.mata_pelajaran)).size}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kelas Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(schedules.map(schedule => schedule.kelas)).size}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hasil Filter</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSchedules.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Table by Day */}
        <div className="space-y-6">
          {Object.entries(groupSchedulesByDay()).map(([day, daySchedules]) => (
            <Card key={day}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                  {day}
                  <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                    {daySchedules.length} jadwal
                  </span>
                </h3>

                {daySchedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Waktu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mata Pelajaran
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kelas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Guru
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ruang
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {daySchedules.map((schedule) => (
                          <tr key={schedule.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{schedule.jam_mulai}</div>
                                  <div className="text-gray-500">{schedule.jam_selesai}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{schedule.mata_pelajaran}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {schedule.kelas}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {schedule.guru}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {schedule.ruang}
                              </span>
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
                                  onClick={() => handleDelete(schedule.id)}
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada jadwal untuk hari {day}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredSchedules.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Tidak ada jadwal ditemukan</p>
              <p className="text-gray-400 text-sm">Coba ubah filter pencarian Anda</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}