'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import { 
  Settings, 
  Save, 
  School, 
  Clock, 
  MapPin,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Phone,
  Globe
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  school_name: string
  school_logo: string
  school_address: string
  school_phone: string
  school_email: string
  school_website: string
  primary_color: string
  attendance_start_time: string
  attendance_end_time: string
  late_threshold: number
  max_distance: number
  default_location_lat: number
  default_location_lng: number
  whatsapp_notifications: boolean
  email_notifications: boolean
  auto_backup: boolean
  backup_frequency: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    school_name: '',
    school_logo: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_website: '',
    primary_color: '#3B82F6',
    attendance_start_time: '07:00',
    attendance_end_time: '15:00',
    late_threshold: 15,
    max_distance: 100,
    default_location_lat: -6.2088,
    default_location_lng: 106.8456,
    whatsapp_notifications: true,
    email_notifications: true,
    auto_backup: true,
    backup_frequency: 'daily'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      if (response.data.success) {
        setSettings({ ...settings, ...response.data.data })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/settings', settings)
      if (response.data.success) {
        toast.success('Pengaturan berhasil disimpan')
      } else {
        toast.error('Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Layout allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat pengaturan...</p>
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
              <Settings className="h-8 w-8 mr-2 text-primary-600" />
              Pengaturan Sistem
            </h1>
            <p className="text-gray-600">Konfigurasi sistem absensi sekolah</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 mt-4 sm:mt-0"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* School Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <School className="h-5 w-5 mr-2 text-primary-600" />
                Informasi Sekolah
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={settings.school_name}
                    onChange={(e) => handleInputChange('school_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekolah</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    value={settings.school_address}
                    onChange={(e) => handleInputChange('school_address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={settings.school_phone}
                        onChange={(e) => handleInputChange('school_phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={settings.school_email}
                        onChange={(e) => handleInputChange('school_email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="relative">
                    <Globe className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.school_website}
                      onChange={(e) => handleInputChange('school_website', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Attendance Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary-600" />
                Pengaturan Absensi
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai Absensi</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.attendance_start_time}
                      onChange={(e) => handleInputChange('attendance_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai Absensi</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.attendance_end_time}
                      onChange={(e) => handleInputChange('attendance_end_time', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batas Keterlambatan (menit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={settings.late_threshold}
                    onChange={(e) => handleInputChange('late_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Siswa dianggap terlambat jika absen lebih dari waktu ini</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jarak Maksimal (meter)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={settings.max_distance}
                    onChange={(e) => handleInputChange('max_distance', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Jarak maksimal dari lokasi sekolah untuk bisa absen</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Location Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                Lokasi Sekolah
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.default_location_lat}
                      onChange={(e) => handleInputChange('default_location_lat', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.default_location_lng}
                      onChange={(e) => handleInputChange('default_location_lng', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tips:</strong> Anda bisa mendapatkan koordinat lokasi dari Google Maps dengan klik kanan pada lokasi sekolah.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-primary-600" />
                Tampilan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warna Utama</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      value={settings.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: settings.primary_color + '20' }}>
                  <p className="text-sm font-medium" style={{ color: settings.primary_color }}>
                    Preview warna utama sistem
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary-600" />
                Notifikasi
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notifikasi WhatsApp</p>
                    <p className="text-sm text-gray-500">Kirim notifikasi absensi ke orang tua via WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.whatsapp_notifications}
                      onChange={(e) => handleInputChange('whatsapp_notifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notifikasi Email</p>
                    <p className="text-sm text-gray-500">Kirim laporan absensi harian via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.email_notifications}
                      onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Backup Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary-600" />
                Backup & Keamanan
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Auto Backup</p>
                    <p className="text-sm text-gray-500">Backup otomatis database sistem</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.auto_backup}
                      onChange={(e) => handleInputChange('auto_backup', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                {settings.auto_backup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frekuensi Backup</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={settings.backup_frequency}
                      onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                    >
                      <option value="daily">Harian</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                    </select>
                  </div>
                )}
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Peringatan:</strong> Pastikan untuk melakukan backup manual secara berkala untuk keamanan data.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </div>
    </Layout>
  )
}