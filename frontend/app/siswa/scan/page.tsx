'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import QRScanner from '@/components/qr/QRScanner'
import { api } from '@/lib/api'
import { QrCode, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttendanceResult {
  success: boolean
  message: string
  data?: {
    siswa: {
      nama: string
      kelas: string
      nis: string
    }
    absensi: {
      tanggal: string
      jam_masuk?: string
      jam_pulang?: string
      status: string
    }
  }
}

export default function ScanPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [attendanceType, setAttendanceType] = useState<'sekolah' | 'kelas'>('sekolah')
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<AttendanceResult | null>(null)

  const handleScan = async (barcodeId: string) => {
    setLoading(true)
    try {
      const response = await api.post('/attendance/scan', {
        barcode_id: barcodeId,
        attendance_type: attendanceType
      })

      if (response.data.success) {
        setLastResult(response.data)
        toast.success(response.data.message)
        setIsScannerOpen(false)
      } else {
        toast.error(response.data.message || 'Gagal melakukan absensi')
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      toast.error(error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleScannerError = (error: string) => {
    console.error('Scanner error:', error)
    toast.error('Gagal memulai scanner')
  }

  const openScanner = () => {
    setIsScannerOpen(true)
  }

  const closeScanner = () => {
    setIsScannerOpen(false)
  }

  return (
    <Layout allowedRoles={['siswa']}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Scan Barcode</h1>
          <p className="text-gray-600">Scan barcode kartu pelajar untuk melakukan absensi</p>
        </div>

        {/* Attendance Type Selection */}
        <Card title="Jenis Absensi">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAttendanceType('sekolah')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  attendanceType === 'sekolah'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-900">Absensi Sekolah</h3>
                    <p className="text-sm text-gray-500">Masuk/Pulang sekolah</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAttendanceType('kelas')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  attendanceType === 'kelas'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <QrCode className="h-5 w-5 text-primary-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-900">Absensi Kelas</h3>
                    <p className="text-sm text-gray-500">Per mata pelajaran</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Scan Button */}
        <Card>
          <div className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <QrCode className="h-12 w-12 text-primary-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {attendanceType === 'sekolah' ? 'Absensi Sekolah' : 'Absensi Kelas'}
              </h3>
              <p className="text-gray-600 mb-4">
                {attendanceType === 'sekolah' 
                  ? 'Scan barcode untuk melakukan absensi masuk atau pulang sekolah'
                  : 'Scan barcode untuk melakukan absensi kelas (pastikan guru sudah mengaktifkan absensi)'
                }
              </p>
            </div>

            <Button
              onClick={openScanner}
              loading={loading}
              size="lg"
              className="w-full"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Mulai Scan
            </Button>
          </div>
        </Card>

        {/* Last Result */}
        {lastResult && (
          <Card title="Hasil Absensi Terakhir">
            <div className="space-y-4">
              {lastResult.success ? (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">{lastResult.message}</p>
                    {lastResult.data && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nama:</span>
                          <span className="font-medium">{lastResult.data.siswa.nama}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kelas:</span>
                          <span className="font-medium">{lastResult.data.siswa.kelas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">NIS:</span>
                          <span className="font-medium">{lastResult.data.siswa.nis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tanggal:</span>
                          <span className="font-medium">{lastResult.data.absensi.tanggal}</span>
                        </div>
                        {lastResult.data.absensi.jam_masuk && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jam Masuk:</span>
                            <span className="font-medium">{lastResult.data.absensi.jam_masuk}</span>
                          </div>
                        )}
                        {lastResult.data.absensi.jam_pulang && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jam Pulang:</span>
                            <span className="font-medium">{lastResult.data.absensi.jam_pulang}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${
                            lastResult.data.absensi.status === 'hadir' ? 'text-green-600' :
                            lastResult.data.absensi.status === 'terlambat' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {lastResult.data.absensi.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">{lastResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={isScannerOpen}
          onScan={handleScan}
          onError={handleScannerError}
          onClose={closeScanner}
        />
      </div>
    </Layout>
  )
}