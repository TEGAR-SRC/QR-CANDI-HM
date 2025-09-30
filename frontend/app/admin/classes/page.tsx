'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  School, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  GraduationCap
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Class {
  id: number
  nama_kelas: string
  tingkat: string
  wali_kelas_id: number
  wali_kelas_nama: string
  jumlah_siswa: number
  created_at: string
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTingkat, setSelectedTingkat] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      if (response.data.success) {
        setClasses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal memuat data kelas')
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cls.wali_kelas_nama || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTingkat = selectedTingkat === '' || cls.tingkat === selectedTingkat
    return matchesSearch && matchesTingkat
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return

    try {
      await api.delete(`/classes/${id}`)
      toast.success('Kelas berhasil dihapus')
      fetchClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Gagal menghapus kelas')
    }
  }

  const getTingkatOptions = () => {
    const tingkats = [...new Set(classes.map(cls => cls.tingkat))]
    return tingkats.sort()
  }

  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data kelas...</p>
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
              <School className="h-8 w-8 mr-2 text-primary-600" />
              Kelola Kelas
            </h1>
            <p className="text-gray-600">Kelola data kelas dan wali kelas</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kelas (nama, wali kelas)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
            >
              <option value="">Semua Tingkat</option>
              {getTingkatOptions().map((tingkat) => (
                <option key={tingkat} value={tingkat}>
                  Kelas {tingkat}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <School className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Kelas</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((sum, cls) => sum + cls.jumlah_siswa, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wali Kelas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(classes.map(cls => cls.wali_kelas_id)).size}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <School className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hasil Filter</p>
                <p className="text-2xl font-bold text-gray-900">{filteredClasses.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <School className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{cls.nama_kelas}</h3>
                      <p className="text-sm text-gray-500">Kelas {cls.tingkat}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button className="text-indigo-600 hover:text-indigo-900 p-1">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900 p-1">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cls.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tingkat:</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                      Kelas {cls.tingkat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Wali Kelas:</span>
                    <span className="text-sm font-medium text-gray-900">{cls.wali_kelas_nama || 'Belum ditentukan'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jumlah Siswa:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {cls.jumlah_siswa} siswa
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dibuat:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(cls.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Users className="h-4 w-4 mr-2" />
                    Lihat Siswa
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <School className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Tidak ada kelas ditemukan</p>
              <p className="text-gray-400 text-sm">Coba ubah filter pencarian Anda</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}