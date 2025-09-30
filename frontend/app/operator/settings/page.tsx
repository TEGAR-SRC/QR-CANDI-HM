'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { api } from '@/lib/api'
import { Save, School, Palette, MessageSquare, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

interface SchoolConfig {
  school_name: { value: string; description: string }
  school_logo: { value: string; description: string }
  primary_color: { value: string; description: string }
  whatsapp_enabled: { value: string; description: string }
  attendance_timeout: { value: string; description: string }
}

export default function OperatorSettingsPage() {
  const [config, setConfig] = useState<SchoolConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    school_name: '',
    school_logo: '',
    primary_color: '#3B82F6',
    whatsapp_enabled: 'true',
    attendance_timeout: '15'
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await api.get('/operators/config')
      if (response.data.success) {
        setConfig(response.data.data)
        setFormData({
          school_name: response.data.data.school_name?.value || '',
          school_logo: response.data.data.school_logo?.value || '',
          primary_color: response.data.data.primary_color?.value || '#3B82F6',
          whatsapp_enabled: response.data.data.whatsapp_enabled?.value || 'true',
          attendance_timeout: response.data.data.attendance_timeout?.value || '15'
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await api.put('/operators/config', {
        configs: formData
      })

      if (response.data.success) {
        toast.success('Konfigurasi berhasil disimpan')
        fetchConfig() // Reload config
      } else {
        toast.error(response.data.message || 'Gagal menyimpan konfigurasi')
      }
    } catch (error: any) {
      console.error('Save config error:', error)
      toast.error(error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout allowedRoles={['operator']}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sekolah</h1>
          <p className="text-gray-600">Kelola konfigurasi sistem dan identitas sekolah</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School Identity */}
          <Card title="Identitas Sekolah">
            <div className="space-y-6">
              <div>
                <Input
                  label="Nama Sekolah"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama sekolah"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config?.school_name?.description}
                </p>
              </div>

              <div>
                <Input
                  label="URL Logo Sekolah"
                  name="school_logo"
                  value={formData.school_logo}
                  onChange={handleInputChange}
                  placeholder="/logo.png atau https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config?.school_logo?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Utama
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleInputChange}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleInputChange}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {config?.primary_color?.description}
                </p>
              </div>
            </div>
          </Card>

          {/* System Settings */}
          <Card title="Pengaturan Sistem">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notifikasi WhatsApp
                </label>
                <select
                  name="whatsapp_enabled"
                  value={formData.whatsapp_enabled}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Tidak Aktif</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {config?.whatsapp_enabled?.description}
                </p>
              </div>

              <div>
                <Input
                  label="Timeout Absensi (menit)"
                  name="attendance_timeout"
                  type="number"
                  value={formData.attendance_timeout}
                  onChange={handleInputChange}
                  placeholder="15"
                  min="1"
                  max="60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config?.attendance_timeout?.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card title="Preview">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <School className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: formData.primary_color }}>
                    {formData.school_name || 'Nama Sekolah'}
                  </h3>
                  <p className="text-sm text-gray-600">Sistem Absensi Digital</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${formData.primary_color}10` }}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: formData.primary_color }}
                  ></div>
                  <span className="text-sm font-medium">Warna Utama: {formData.primary_color}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Konfigurasi
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}