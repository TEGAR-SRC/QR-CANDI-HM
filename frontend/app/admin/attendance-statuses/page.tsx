'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Palette
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface AttendanceStatus {
  id: number
  code: string
  name: string
  description: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AttendanceStatusesPage() {
  const [statuses, setStatuses] = useState<AttendanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStatus, setEditingStatus] = useState<AttendanceStatus | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#22C55E',
    is_active: true
  })

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const response = await api.post('/super-admin/attendance-statuses', { action: 'list' })
      if (response.data.success) {
        setStatuses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
      toast.error('Gagal memuat data status absensi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        action: editingStatus ? 'update' : 'create',
        ...formData
      }

      if (editingStatus) {
        payload.id = editingStatus.id
      }

      const response = await api.post('/super-admin/attendance-statuses', payload)
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchStatuses()
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error saving status:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan status')
    }
  }

  const handleEdit = (status: AttendanceStatus) => {
    setEditingStatus(status)
    setFormData({
      code: status.code,
      name: status.name,
      description: status.description,
      color: status.color,
      is_active: status.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus status ini?')) {
      return
    }

    try {
      const response = await api.post('/super-admin/attendance-statuses', { 
        action: 'delete', 
        id 
      })
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchStatuses()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error deleting status:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus status')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#22C55E',
      is_active: true
    })
    setEditingStatus(null)
    setShowForm(false)
  }

  const predefinedColors = [
    '#22C55E', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#6B7280', // Gray
    '#3B82F6', // Blue
    '#EC4899'  // Pink
  ]

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
              <UserCheck className="h-8 w-8 mr-2 text-primary-600" />
              Kelola Status Absensi
            </h1>
            <p className="text-gray-600">Atur status-status absensi yang tersedia</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Status
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingStatus ? 'Edit Status' : 'Tambah Status'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Kode Status"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="H"
                    required
                    maxLength={2}
                  />
                  <Input
                    label="Nama Status"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Hadir"
                    required
                  />
                </div>

                <Input
                  label="Deskripsi"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Hadir tepat waktu"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{formData.color}</span>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Warna yang sering digunakan:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded border-2 ${
                            formData.color === color ? 'border-gray-400' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Status aktif
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {editingStatus ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statuses.length > 0 ? (
            statuses.map((status) => (
              <Card key={status.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.code}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{status.name}</h3>
                      <p className="text-sm text-gray-500">{status.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(status)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(status.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kode:</span>
                    <span className="font-mono font-bold">{status.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warna:</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="font-mono text-xs">{status.color}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      status.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {status.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.code}
                    </div>
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada status</h3>
              <p className="text-gray-500 mb-4">Tambahkan status absensi pertama</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Status
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}