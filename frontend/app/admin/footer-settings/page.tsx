'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Settings, 
  Save, 
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface FooterSettings {
  company_name: string
  system_name: string
  system_description: string
  copyright_text: string
  show_year: string
  footer_links: Array<{
    title: string
    url: string
    external?: boolean
  }>
  contact_email: string
  contact_phone: string
  address: string
  social_media: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
}

export default function FooterSettingsPage() {
  const [settings, setSettings] = useState<FooterSettings>({
    company_name: 'EduPus.id',
    system_name: 'Candi QR',
    system_description: 'Sistem Absensi Sekolah Digital',
    copyright_text: '© 2024 EduPus.id. Sistem Absensi Sekolah Digital.',
    show_year: 'true',
    footer_links: [],
    contact_email: 'support@edupus.id',
    contact_phone: '+62 123 456 7890',
    address: 'Jl. Pendidikan No. 123, Jakarta',
    social_media: {}
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFooterSettings()
  }, [])

  const fetchFooterSettings = async () => {
    try {
      const response = await api.get('/footer/admin/settings')
      if (response.data.success) {
        // Convert array to object
        const settingsObj: any = {}
        response.data.data.forEach((setting: any) => {
          let value = setting.setting_value
          if (setting.setting_key === 'footer_links' || setting.setting_key === 'social_media') {
            try {
              value = JSON.parse(value)
            } catch (e) {
              value = setting.setting_key === 'footer_links' ? [] : {}
            }
          }
          settingsObj[setting.setting_key] = value
        })
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error)
      toast.error('Gagal memuat pengaturan footer')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/footer/admin/settings', { settings })
      
      if (response.data.success) {
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error saving footer settings:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset pengaturan ke default?')) {
      return
    }

    try {
      const response = await api.post('/footer/admin/reset')
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchFooterSettings()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error resetting footer settings:', error)
      toast.error(error.response?.data?.message || 'Gagal mereset pengaturan')
    }
  }

  const addFooterLink = () => {
    setSettings(prev => ({
      ...prev,
      footer_links: [...prev.footer_links, { title: '', url: '', external: false }]
    }))
  }

  const removeFooterLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      footer_links: prev.footer_links.filter((_, i) => i !== index)
    }))
  }

  const updateFooterLink = (index: number, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      footer_links: prev.footer_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
              <Settings className="h-8 w-8 mr-2 text-primary-600" />
              Pengaturan Footer
            </h1>
            <p className="text-gray-600">Kelola informasi dan kontak yang ditampilkan di footer</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Default
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <Card title="Informasi Perusahaan">
            <div className="space-y-4">
              <Input
                label="Nama Perusahaan"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="EduPus.id"
              />
              
              <Input
                label="Nama Sistem"
                value={settings.system_name}
                onChange={(e) => setSettings(prev => ({ ...prev, system_name: e.target.value }))}
                placeholder="Candi QR"
              />
              
              <Input
                label="Deskripsi Sistem"
                value={settings.system_description}
                onChange={(e) => setSettings(prev => ({ ...prev, system_description: e.target.value }))}
                placeholder="Sistem Absensi Sekolah Digital"
              />
              
              <Input
                label="Teks Copyright"
                value={settings.copyright_text}
                onChange={(e) => setSettings(prev => ({ ...prev, copyright_text: e.target.value }))}
                placeholder="© 2024 EduPus.id. Sistem Absensi Sekolah Digital."
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_year"
                  checked={settings.show_year === 'true'}
                  onChange={(e) => setSettings(prev => ({ ...prev, show_year: e.target.checked ? 'true' : 'false' }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="show_year" className="text-sm text-gray-700">
                  Tampilkan tahun otomatis
                </label>
              </div>
            </div>
          </Card>

          {/* Contact Info */}
          <Card title="Informasi Kontak">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <Input
                  label="Email Kontak"
                  value={settings.contact_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="support@edupus.id"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <Input
                  label="Nomor Telepon"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+62 123 456 7890"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <Input
                  label="Alamat"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Jl. Pendidikan No. 123, Jakarta"
                />
              </div>
            </div>
          </Card>

          {/* Footer Links */}
          <Card title="Link Footer">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Quick Links</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFooterLink}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Link
                </Button>
              </div>
              
              {settings.footer_links.map((link, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Judul Link"
                      value={link.title}
                      onChange={(e) => updateFooterLink(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`external_${index}`}
                        checked={link.external}
                        onChange={(e) => updateFooterLink(index, 'external', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor={`external_${index}`} className="text-sm text-gray-700">
                        Link eksternal
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFooterLink(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {settings.footer_links.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Belum ada link footer
                </p>
              )}
            </div>
          </Card>

          {/* Social Media */}
          <Card title="Social Media">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <Input
                    label="Facebook"
                    value={settings.social_media.facebook || ''}
                    onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                    placeholder="https://facebook.com/edupus"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <Input
                    label="Twitter"
                    value={settings.social_media.twitter || ''}
                    onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                    placeholder="https://twitter.com/edupus"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <Input
                    label="Instagram"
                    value={settings.social_media.instagram || ''}
                    onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                    placeholder="https://instagram.com/edupus"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <Input
                    label="LinkedIn"
                    value={settings.social_media.linkedin || ''}
                    onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/edupus"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <Input
                    label="YouTube"
                    value={settings.social_media.youtube || ''}
                    onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                    placeholder="https://youtube.com/c/edupus"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <Card title="Preview Footer">
          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {settings.company_name}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {settings.system_description}
                  </p>
                </div>
              </div>

              {settings.footer_links.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                  <ul className="space-y-2">
                    {settings.footer_links.map((link, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                        >
                          <span>{link.title || 'Link ' + (index + 1)}</span>
                          {link.external && <ExternalLink className="h-3 w-3" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Kontak</h3>
                <div className="space-y-3">
                  {settings.contact_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{settings.contact_email}</span>
                    </div>
                  )}
                  {settings.contact_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{settings.contact_phone}</span>
                    </div>
                  )}
                  {settings.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-300 text-sm">{settings.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Sistem</h3>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">{settings.system_name}</span>
                  </p>
                  <p className="text-gray-300 text-sm">
                    {settings.system_description}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-gray-400 text-sm text-center md:text-left">
                  {settings.show_year === 'true' 
                    ? settings.copyright_text.replace(/\d{4}/, new Date().getFullYear().toString())
                    : settings.copyright_text
                  }
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Powered by {settings.company_name}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}