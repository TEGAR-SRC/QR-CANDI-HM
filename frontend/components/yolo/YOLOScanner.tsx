'use client'

import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, MapPin, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface YOLOScannerProps {
  onScan: (result: any) => void
  onError?: (error: string) => void
  onClose?: () => void
  isOpen: boolean
  attendanceType: 'sekolah' | 'kelas'
  jadwalId?: number
}

interface Location {
  id: number
  name: string
  latitude: number
  longitude: number
  radius: number
}

interface AttendanceStatus {
  id: number
  code: string
  name: string
  description: string
  color: string
}

export default function YOLOScanner({ 
  onScan, 
  onError, 
  onClose, 
  isOpen, 
  attendanceType,
  jadwalId 
}: YOLOScannerProps) {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [statuses, setStatuses] = useState<AttendanceStatus[]>([])
  const [selectedStatus, setSelectedStatus] = useState('H')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeScanner()
      getLocations()
      getStatuses()
      getCurrentLocation()
    }

    return () => {
      if (scanner) {
        scanner.clear()
        setScanner(null)
      }
    }
  }, [isOpen])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Gagal mendapatkan lokasi GPS')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const getLocations = async () => {
    try {
      const response = await api.get('/yolo/locations')
      if (response.data.success) {
        setLocations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const getStatuses = async () => {
    try {
      const response = await api.get('/yolo/statuses')
      if (response.data.success) {
        setStatuses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
    }
  }

  const initializeScanner = () => {
    try {
      const newScanner = new Html5QrcodeScanner(
        'yolo-qr-reader',
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 5,
        },
        false
      )

      newScanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText)
          handleScan(decodedText)
        },
        (error) => {
          if (error.includes('No QR code found')) {
            return
          }
          console.warn('QR Scanner error:', error)
          setError(error)
        }
      )

      setScanner(newScanner)
      setIsScanning(true)
    } catch (err) {
      console.error('Failed to initialize QR scanner:', err)
      setError('Gagal menginisialisasi scanner QR')
    }
  }

  const handleScan = async (barcodeId: string) => {
    if (!currentLocation) {
      toast.error('Lokasi GPS diperlukan untuk YOLO absensi')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/yolo/attendance', {
        barcode_id: barcodeId,
        attendance_type: attendanceType,
        jadwal_id: jadwalId,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        status_code: selectedStatus
      })

      if (response.data.success) {
        onScan(response.data)
        toast.success(response.data.message)
        stopScanning()
      } else {
        toast.error(response.data.message || 'Gagal melakukan YOLO absensi')
      }
    } catch (error: any) {
      console.error('YOLO scan error:', error)
      toast.error(error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const stopScanning = () => {
    if (scanner) {
      scanner.clear()
      setScanner(null)
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanning()
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            YOLO Absensi Scanner
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Location Status */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Lokasi GPS</p>
              {currentLocation ? (
                <p className="text-xs text-blue-700">
                  Lat: {currentLocation.coords.latitude.toFixed(6)}, 
                  Lng: {currentLocation.coords.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-blue-700">Mendapatkan lokasi...</p>
              )}
            </div>
            {currentLocation ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Absensi
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.code)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedStatus === status.code
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    borderColor: selectedStatus === status.code ? status.color : undefined
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  {status.name}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* QR Scanner */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Arahkan kamera ke barcode untuk melakukan YOLO absensi
            </p>
            <div id="yolo-qr-reader" className="w-full"></div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Tutup
            </Button>
            {isScanning && (
              <Button
                variant="error"
                onClick={stopScanning}
              >
                Stop Scan
              </Button>
            )}
            <Button
              onClick={getCurrentLocation}
              variant="secondary"
              className="flex items-center"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Refresh Lokasi
            </Button>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Memproses YOLO absensi...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}