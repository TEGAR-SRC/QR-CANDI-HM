'use client'

import { useState, useRef } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  Users,
  GraduationCap,
  School,
  BarChart3,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface ImportResult {
  success: any[]
  errors: any[]
}

export default function ImportExportPage() {
  const [importData, setImportData] = useState<{
    type: string
    file: File | null
    results: ImportResult | null
  }>({
    type: 'siswa',
    file: null,
    results: null
  })
  const [exportData, setExportData] = useState<{
    type: string
    startDate: string
    endDate: string
    loading: boolean
  }>({
    type: 'siswa',
    startDate: '',
    endDate: '',
    loading: false
  })
  const [showImportResults, setShowImportResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importTypes = [
    { value: 'siswa', label: 'Data Siswa', icon: Users, description: 'Import data siswa dari Excel' },
    { value: 'guru', label: 'Data Guru', icon: GraduationCap, description: 'Import data guru dari Excel' },
    { value: 'kelas', label: 'Data Kelas', icon: School, description: 'Import data kelas dari Excel' }
  ]

  const exportTypes = [
    { value: 'siswa', label: 'Data Siswa', icon: Users, description: 'Export data siswa ke Excel' },
    { value: 'guru', label: 'Data Guru', icon: GraduationCap, description: 'Export data guru ke Excel' },
    { value: 'absensi', label: 'Data Absensi', icon: BarChart3, description: 'Export data absensi ke Excel' }
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportData(prev => ({ ...prev, file, results: null }))
    }
  }

  const handleImport = async () => {
    if (!importData.file) {
      toast.error('Pilih file Excel terlebih dahulu')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', importData.file)
      formData.append('data_type', importData.type)

      const response = await api.post('/super-admin/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setImportData(prev => ({ ...prev, results: response.data.data }))
        setShowImportResults(true)
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.response?.data?.message || 'Gagal mengimport data')
    }
  }

  const handleExport = async () => {
    setExportData(prev => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        data_type: exportData.type
      })

      if (exportData.startDate) {
        params.append('start_date', exportData.startDate)
      }
      if (exportData.endDate) {
        params.append('end_date', exportData.endDate)
      }

      const response = await api.get(`/super-admin/export-excel?${params}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const filename = `${exportData.type}_${new Date().toISOString().split('T')[0]}.xlsx`
      link.setAttribute('download', filename)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Data berhasil diexport')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.response?.data?.message || 'Gagal mengexport data')
    } finally {
      setExportData(prev => ({ ...prev, loading: false }))
    }
  }

  const downloadTemplate = async (type: string) => {
    // Create sample template data
    let templateData = []
    
    if (type === 'siswa') {
      templateData = [
        {
          username: 'siswa001',
          email: 'siswa001@example.com',
          password: 'password123',
          full_name: 'John Doe',
          phone: '081234567890',
          nis: '2024001',
          nisn: '1234567890',
          barcode_id: 'BC001',
          kelas_id: 1,
          tanggal_lahir: '2010-01-01',
          alamat: 'Jl. Contoh No. 1',
          nama_ortu: 'Jane Doe',
          phone_ortu: '081234567891'
        }
      ]
    } else if (type === 'guru') {
      templateData = [
        {
          username: 'guru001',
          email: 'guru001@example.com',
          password: 'password123',
          full_name: 'Dr. Smith',
          phone: '081234567892',
          nip: '196001011234567890',
          mata_pelajaran_id: 1
        }
      ]
    } else if (type === 'kelas') {
      templateData = [
        {
          nama_kelas: 'X IPA 1',
          tingkat: 'X',
          wali_kelas_id: 1
        }
      ]
    }

    // Convert to Excel and download
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `template_${type}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.success('Template berhasil didownload')
  }

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileSpreadsheet className="h-8 w-8 mr-2 text-primary-600" />
            Import & Export Excel
          </h1>
          <p className="text-gray-600">Import data massal dan export laporan ke Excel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card title="Import Data dari Excel">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Data
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {importTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setImportData(prev => ({ ...prev, type: type.value, file: null, results: null }))}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        importData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <type.icon className="h-5 w-5 text-primary-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-500">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Excel
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadTemplate(importData.type)}
                  >
                    Template
                  </Button>
                </div>
                {importData.file && (
                  <p className="text-sm text-gray-600 mt-2">
                    File: {importData.file.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={!importData.file}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </Card>

          {/* Export Section */}
          <Card title="Export Data ke Excel">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Data
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {exportTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setExportData(prev => ({ ...prev, type: type.value }))}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        exportData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <type.icon className="h-5 w-5 text-primary-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-500">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {exportData.type === 'absensi' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tanggal Mulai"
                    type="date"
                    value={exportData.startDate}
                    onChange={(e) => setExportData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    label="Tanggal Akhir"
                    type="date"
                    value={exportData.endDate}
                    onChange={(e) => setExportData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              )}

              <Button
                onClick={handleExport}
                loading={exportData.loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </Card>
        </div>

        {/* Import Results Modal */}
        {showImportResults && importData.results && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Hasil Import</h3>
                <button
                  onClick={() => setShowImportResults(false)}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Success Results */}
                {importData.results.success.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">
                        Berhasil diimport ({importData.results.success.length} data)
                      </h4>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {importData.results.success.map((item, index) => (
                        <div key={index} className="text-sm text-green-800">
                          Row {item.row}: {item.username || item.nama_kelas} - {item.nama || item.nama_kelas}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Results */}
                {importData.results.errors.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">
                        Gagal diimport ({importData.results.errors.length} data)
                      </h4>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {importData.results.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-800">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setShowImportResults(false)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}