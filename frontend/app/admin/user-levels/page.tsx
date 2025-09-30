'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Crown,
  Star
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface UserLevel {
  id: number
  name: string
  level_number: number
  description: string
  permissions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function UserLevelsPage() {
  const [levels, setLevels] = useState<UserLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<UserLevel | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    level_number: 1,
    description: '',
    permissions: [] as string[],
    is_active: true
  })

  const availablePermissions = [
    { key: 'all', label: 'Akses Penuh', description: 'Akses ke semua fitur sistem' },
    { key: 'users', label: 'Kelola Users', description: 'Mengelola data users' },
    { key: 'attendance', label: 'Kelola Absensi', description: 'Mengelola data absensi' },
    { key: 'reports', label: 'Laporan', description: 'Melihat dan mengelola laporan' },
    { key: 'settings', label: 'Pengaturan', description: 'Mengelola pengaturan sistem' },
    { key: 'bulk_create', label: 'Buat Massal', description: 'Membuat data secara massal' },
    { key: 'school_settings', label: 'Pengaturan Sekolah', description: 'Mengelola data sekolah' },
    { key: 'users_view', label: 'Lihat Users', description: 'Melihat data users' },
    { key: 'scan', label: 'Scan Barcode', description: 'Melakukan scan barcode' },
    { key: 'attendance_manage', label: 'Kelola Absensi Kelas', description: 'Mengelola absensi kelas' },
    { key: 'reports_class', label: 'Laporan Kelas', description: 'Laporan per kelas' },
    { key: 'history', label: 'Riwayat', description: 'Melihat riwayat absensi' },
    { key: 'stats', label: 'Statistik', description: 'Melihat statistik' },
    { key: 'children_full', label: 'Data Anak Lengkap', description: 'Akses penuh data anak' },
    { key: 'children_view', label: 'Lihat Data Anak', description: 'Melihat data anak' },
    { key: 'notifications', label: 'Notifikasi', description: 'Mengelola notifikasi' },
    { key: 'view_only', label: 'Lihat Saja', description: 'Hanya bisa melihat data' }
  ]

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      const response = await api.post('/super-admin/user-levels', { action: 'list' })
      if (response.data.success) {
        setLevels(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast.error('Gagal memuat data level users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        action: editingLevel ? 'update' : 'create',
        ...formData
      }

      if (editingLevel) {
        payload.id = editingLevel.id
      }

      const response = await api.post('/super-admin/user-levels', payload)
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchLevels()
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error saving level:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan level')
    }
  }

  const handleEdit = (level: UserLevel) => {
    setEditingLevel(level)
    setFormData({
      name: level.name,
      level_number: level.level_number,
      description: level.description,
      permissions: level.permissions,
      is_active: level.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus level ini?')) {
      return
    }

    try {
      const response = await api.post('/super-admin/user-levels', { 
        action: 'delete', 
        id 
      })
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchLevels()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error deleting level:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus level')
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      level_number: 1,
      description: '',
      permissions: [],
      is_active: true
    })
    setEditingLevel(null)
    setShowForm(false)
  }

  const getLevelIcon = (levelNumber: number) => {
    if (levelNumber >= 9) return Crown
    if (levelNumber >= 7) return Shield
    if (levelNumber >= 5) return Star
    return Shield
  }

  const getLevelColor = (levelNumber: number) => {
    if (levelNumber >= 9) return 'text-yellow-600 bg-yellow-100'
    if (levelNumber >= 7) return 'text-purple-600 bg-purple-100'
    if (levelNumber >= 5) return 'text-blue-600 bg-blue-100'
    return 'text-gray-600 bg-gray-100'
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
              <Shield className="h-8 w-8 mr-2 text-primary-600" />
              Kelola Level Users
            </h1>
            <p className="text-gray-600">Atur level dan permission untuk setiap role</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Level
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingLevel ? 'Edit Level' : 'Tambah Level'}
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
                    label="Nama Level"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Super Admin"
                    required
                  />
                  <Input
                    label="Level Number"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.level_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, level_number: parseInt(e.target.value) }))}
                    placeholder="10"
                    required
                  />
                </div>

                <Input
                  label="Deskripsi"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Akses penuh ke semua fitur sistem"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {availablePermissions.map((permission) => (
                      <label key={permission.key} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.key)}
                          onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {permission.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.description}
                          </div>
                        </div>
                      </label>
                    ))}
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
                    Level aktif
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {editingLevel ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.length > 0 ? (
            levels.map((level) => {
              const IconComponent = getLevelIcon(level.level_number)
              const colorClass = getLevelColor(level.level_number)
              
              return (
                <Card key={level.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{level.name}</h3>
                        <p className="text-sm text-gray-500">Level {level.level_number}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(level)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(level.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{level.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Permissions:</span>
                      <span className="text-sm font-medium">{level.permissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        level.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {level.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Preview */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {level.permissions.slice(0, 3).map((permission) => (
                        <span 
                          key={permission}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {permission}
                        </span>
                      ))}
                      {level.permissions.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{level.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada level</h3>
              <p className="text-gray-500 mb-4">Tambahkan level user pertama</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Level
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}