'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { api } from '@/lib/api'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Navigation,
  Map
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Location {
  id: number
  name: string
  latitude: number
  longitude: number
  radius: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 50,
    is_active: true
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await api.post('/super-admin/locations', { action: 'list' })
      if (response.data.success) {
        setLocations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.error('Gagal memuat data lokasi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        action: editingLocation ? 'update' : 'create',
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius.toString())
      }

      if (editingLocation) {
        payload.id = editingLocation.id
      }

      const response = await api.post('/super-admin/locations', payload)
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchLocations()
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error saving location:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan lokasi')
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius,
      is_active: location.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) {
      return
    }

    try {
      const response = await api.post('/super-admin/locations', { 
        action: 'delete', 
        id 
      })
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchLocations()
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      console.error('Error deleting location:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus lokasi')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      radius: 50,
      is_active: true
    })
    setEditingLocation(null)
    setShowForm(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser ini')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }))
        toast.success('Lokasi GPS berhasil didapatkan')
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Gagal mendapatkan lokasi GPS')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
              <MapPin className="h-8 w-8 mr-2 text-primary-600" />
              Kelola Lokasi Absensi
            </h1>
            <p className="text-gray-600">Atur titik-titik lokasi untuk YOLO absensi</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Lokasi
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
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
                  label="Nama Lokasi"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Gerbang Utama"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="-6.2088"
                    required
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="106.8456"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="flex items-center"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    GPS Sekarang
                  </Button>
                </div>

                <Input
                  label="Radius (meter)"
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                  placeholder="50"
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
                    Lokasi aktif
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {editingLocation ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length > 0 ? (
            locations.map((location) => (
              <Card key={location.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">
                        Radius: {location.radius}m
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Latitude:</span>
                    <span className="font-mono">{location.latitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Longitude:</span>
                    <span className="font-mono">{location.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      location.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {location.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                  >
                    <Map className="h-4 w-4 mr-1" />
                    Lihat di Google Maps
                  </a>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada lokasi</h3>
              <p className="text-gray-500 mb-4">Tambahkan lokasi pertama untuk YOLO absensi</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Lokasi
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}