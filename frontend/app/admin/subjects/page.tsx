'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Users
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Subject {
  id: number
  nama_pelajaran: string
  kode_pelajaran: string
  created_at: string
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects')
      if (response.data.success) {
        setSubjects(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Gagal memuat data mata pelajaran')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = (subject.nama_pelajaran || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subject.kode_pelajaran || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return

    try {
      await api.delete(`/subjects/${id}`)
      toast.success('Mata pelajaran berhasil dihapus')
      fetchSubjects()
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast.error('Gagal menghapus mata pelajaran')
    }
  }


  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data mata pelajaran...</p>
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
              <BookOpen className="h-8 w-8 mr-2 text-primary-600" />
              Mata Pelajaran
            </h1>
            <p className="text-gray-600">Kelola mata pelajaran dan kurikulum</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mata Pelajaran
          </button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari mata pelajaran (nama, kode)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mata Pelajaran</p>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.length}
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
                <p className="text-sm font-medium text-gray-600">Guru Pengampu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(subjects.map(subject => subject.guru_pengampu)).size}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hasil Filter</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSubjects.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{subject.nama_pelajaran}</h3>
                      <p className="text-sm text-gray-500">{subject.kode_pelajaran}</p>
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
                      onClick={() => handleDelete(subject.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kode:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {subject.kode_pelajaran}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dibuat:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(subject.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>


                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Clock className="h-4 w-4 mr-2" />
                    Lihat Jadwal
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Tidak ada mata pelajaran ditemukan</p>
              <p className="text-gray-400 text-sm">Coba ubah filter pencarian Anda</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}