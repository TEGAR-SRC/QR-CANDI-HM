'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { api } from '@/lib/api'
import { Upload, Download, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkCreateResult {
  success: Array<{
    username: string
    full_name: string
    role: string
    user_id: number
  }>
  errors: Array<{
    username: string
    error: string
  }>
}

export default function BulkCreatePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkCreateResult | null>(null)
  const [formData, setFormData] = useState({
    role: 'siswa',
    data: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.data.trim()) {
      toast.error('Data tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      // Parse JSON data
      let users
      try {
        users = JSON.parse(formData.data)
      } catch (error) {
        toast.error('Format JSON tidak valid')
        setLoading(false)
        return
      }

      if (!Array.isArray(users)) {
        toast.error('Data harus berupa array')
        setLoading(false)
        return
      }

      const response = await api.post('/operators/bulk-create-users', {
        users: users
      })

      if (response.data.success) {
        setResult(response.data.data)
        toast.success(`Berhasil membuat ${response.data.data.success.length} user`)
      } else {
        toast.error(response.data.message || 'Gagal membuat user')
      }
    } catch (error: any) {
      console.error('Bulk create error:', error)
      toast.error(error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const downloadTemplate = () => {
    const template = {
      siswa: [
        {
          username: "siswa001",
          email: "siswa001@example.com",
          password: "password123",
          role: "siswa",
          full_name: "Ahmad Rizki",
          phone: "081234567890",
          additional_data: {
            nis: "2024001",
            nisn: "1234567890",
            kelas_id: 1,
            barcode_id: "BC2024001",
            tanggal_lahir: "2008-01-15",
            alamat: "Jl. Contoh No. 1",
            nama_ortu: "Budi Rizki",
            phone_ortu: "081234567891"
          }
        }
      ],
      guru: [
        {
          username: "guru001",
          email: "guru001@example.com",
          password: "password123",
          role: "guru",
          full_name: "Siti Nurhaliza",
          phone: "081234567892",
          additional_data: {
            nip: "123456789012345678",
            mata_pelajaran_id: 1
          }
        }
      ],
      orang_tua: [
        {
          username: "ortu001",
          email: "ortu001@example.com",
          password: "password123",
          role: "orang_tua",
          full_name: "Budi Rizki",
          phone: "081234567891",
          additional_data: {
            siswa_id: 1,
            hubungan: "ayah",
            pekerjaan: "Wiraswasta",
            alamat: "Jl. Contoh No. 1"
          }
        }
      ]
    }

    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-bulk-create.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Layout allowedRoles={['operator']}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat User Massal</h1>
          <p className="text-gray-600">Import data siswa, guru, dan orang tua secara bersamaan</p>
        </div>

        {/* Instructions */}
        <Card title="Petunjuk Penggunaan">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Download Template</p>
                <p className="text-sm text-gray-600">Download template JSON untuk format data yang benar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Isi Data</p>
                <p className="text-sm text-gray-600">Isi template dengan data user yang akan dibuat</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Upload & Proses</p>
                <p className="text-sm text-gray-600">Paste data JSON dan klik tombol proses</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Template Download */}
        <Card title="Template">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Download template JSON untuk format data yang benar</p>
            </div>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </Card>

        {/* Form */}
        <Card title="Data User">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data JSON
              </label>
              <textarea
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="Paste data JSON di sini..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pastikan format JSON valid dan mengikuti template yang disediakan
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                className="flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Proses Data
              </Button>
            </div>
          </form>
        </Card>

        {/* Results */}
        {result && (
          <Card title="Hasil Proses">
            <div className="space-y-6">
              {/* Success Results */}
              {result.success.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-green-800">
                      Berhasil Dibuat ({result.success.length} user)
                    </h3>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-200">
                            <th className="text-left py-2 font-medium text-green-800">Username</th>
                            <th className="text-left py-2 font-medium text-green-800">Nama</th>
                            <th className="text-left py-2 font-medium text-green-800">Role</th>
                            <th className="text-left py-2 font-medium text-green-800">ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.success.map((user, index) => (
                            <tr key={index} className="border-b border-green-100">
                              <td className="py-2 text-green-700">{user.username}</td>
                              <td className="py-2 text-green-700">{user.full_name}</td>
                              <td className="py-2 text-green-700">{user.role}</td>
                              <td className="py-2 text-green-700">{user.user_id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Results */}
              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-red-800">
                      Gagal Dibuat ({result.errors.length} user)
                    </h3>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="text-red-700 font-medium">{error.username}</span>
                          <span className="text-red-600 text-sm">{error.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}