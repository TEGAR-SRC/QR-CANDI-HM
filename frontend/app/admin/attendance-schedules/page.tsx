'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  Timer
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface AttendanceSchedule {
  id: number
  name: string
  attendance_type: string
  start_time: string
  end_time: string
  late_threshold: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AttendanceSchedulesPage() {
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    attendance_type: 'sekolah',
    start_time: '',
    end_time: '',
    late_threshold: 15,
    is_active: true
  })

  const attendanceTypes = [
    { value: 'sekolah', label: 'Absensi Sekolah', description: 'Masuk dan pulang sekolah' },
    { value: 'kelas', label: 'Absensi Kelas', description: 'Per mata pelajaran' },
    { value: 'khusus', label: 'Absensi Khusus', description: 'Acara atau kegiatan khusus' }
  ]

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await api.post('/super-admin/schedules', { action: 'list' })
      if (response.data.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Gagal memuat data jadwal absensi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        action: editingSchedule ? 'update' : 'create',
        ...formData
      }

      if (editingSchedule) {
        payload.id = editingSchedule.id
      }

      const response = await api.post('/super-admin/schedules', payload)
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchSchedules()
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan jadwal')
    }
  }

  const handleEdit = (schedule: AttendanceSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      attendance_type: schedule.attendance_type,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      late_threshold: schedule.late_threshold,
      is_active: schedule.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return
    }

    try {
      const response = await api.post('/super-admin/schedules', { 
        action: 'delete', 
        id 
      })
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchSchedules()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus jadwal')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      attendance_type: 'sekolah',
      start_time: '',
      end_time: '',
      late_threshold: 15,
      is_active: true
    })
    setEditingSchedule(null)
    setShowForm(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sekolah':
        return 'text-blue-600 bg-blue-100'
      case 'kelas':
        return 'text-green-600 bg-green-100'
      case 'khusus':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeLabel = (type: string) => {
    return attendanceTypes.find(t => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="h-8 w-8 mr-2 text-primary-600" />
              Kelola Jadwal Absensi
            </h1>
            <p className="text-gray-600">Atur jadwal dan waktu absensi</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jadwal
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <Input
                  label="Nama Jadwal"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Absensi Masuk Sekolah"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Absensi
                  </label>
                  <select
                    value={formData.attendance_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendance_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {attendanceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Jam Mulai"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                  <Input
                    label="Jam Selesai"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>

                <Input
                  label="Toleransi Keterlambatan (menit)"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.late_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, late_threshold: parseInt(e.target.value) }))}
                  placeholder="15"
                  required
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Jadwal aktif
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {editingSchedule ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Schedules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Clock className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(schedule.attendance_type)}`}>
                        {getTypeLabel(schedule.attendance_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="font-medium text-gray-900">
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Toleransi Keterlambatan</p>
                      <p className="font-medium text-gray-900">
                        {schedule.late_threshold} menit
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      schedule.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {schedule.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                {/* Duration Info */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Durasi:</span>
                    <span className="font-medium">
                      {(() => {
                        const start = new Date(`2000-01-01T${schedule.start_time}`)
                        const end = new Date(`2000-01-01T${schedule.end_time}`)
                        const diffMs = end.getTime() - start.getTime()
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                        return `${diffHours}j ${diffMinutes}m`
                      })()}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada jadwal</h3>
              <p className="text-gray-500 mb-4">Tambahkan jadwal absensi pertama</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jadwal
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}