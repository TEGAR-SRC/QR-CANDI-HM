'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import YOLOScanner from '@/components/yolo/YOLOScanner'
import { QrCode, UserCheck, Clock, MapPin, Zap, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface JadwalPelajaran {
  id: number
  nama_pelajaran: string
  nama_guru: string
  jam_mulai: string
  jam_selesai: string
  hari: string
}

export default function GuruScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalPelajaran[]>([])
  const [selectedJadwal, setSelectedJadwal] = useState<number | null>(null)

  useEffect(() => {
    fetchJadwalHariIni()
  }, [])

  const fetchJadwalHariIni = async () => {
    try {
      const response = await api.get('/schedules/today')
      if (response.data.success) {
        setJadwalHariIni(response.data.data)
        if (response.data.data.length > 0) {
          setSelectedJadwal(response.data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching jadwal:', error)
    }
  }

  const handleScan = async (result: any) => {
    setScanResult(result)
    setIsScanning(false)
  }

  const handleError = (error: string) => {
    console.error('Scanner error:', error)
    toast.error('Gagal memulai YOLO scanner')
  }

  const startYOLOScan = () => {
    if (!selectedJadwal) {
      toast.error('Pilih jadwal pelajaran terlebih dahulu')
      return
    }
    setIsScanning(true)
  }

  return (
    <Layout allowedRoles={['guru']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="h-8 w-8 mr-2 text-yellow-600" />
              YOLO Absensi Scanner
            </h1>
            <p className="text-gray-600">Scan barcode siswa dengan geolocation untuk absensi kelas</p>
          </div>
        </div>

        {/* YOLO Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-900">GPS Location</h3>
            </div>
            <p className="text-sm text-yellow-700">Validasi lokasi GPS untuk keamanan</p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Time Validation</h3>
            </div>
            <p className="text-sm text-blue-700">Validasi jam absensi otomatis</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-900">Status Options</h3>
            </div>
            <p className="text-sm text-green-700">Pilih status absensi (Hadir, Izin, Sakit, dll)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jadwal Hari Ini */}
          <Card title="Jadwal Pelajaran Hari Ini">
            {jadwalHariIni.length > 0 ? (
              <div className="space-y-3">
                {jadwalHariIni.map((jadwal) => (
                  <div
                    key={jadwal.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedJadwal === jadwal.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedJadwal(jadwal.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{jadwal.nama_pelajaran}</h4>
                        <p className="text-sm text-gray-600">{jadwal.nama_guru}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {jadwal.jam_mulai} - {jadwal.jam_selesai}
                        </p>
                        <p className="text-xs text-gray-500">{jadwal.hari}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada jadwal pelajaran hari ini</p>
              </div>
            )}
          </Card>

          {/* YOLO Scanner */}
          <Card title="YOLO Scanner">
            <div className="text-center">
              {!isScanning ? (
                <div className="py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">YOLO Absensi</h3>
                  <p className="text-gray-500 mb-6">
                    Scan barcode dengan validasi GPS dan waktu
                  </p>
                  <Button 
                    onClick={startYOLOScan}
                    disabled={!selectedJadwal}
                    className="w-full"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Mulai YOLO Scan
                  </Button>
                  {!selectedJadwal && (
                    <p className="text-sm text-red-500 mt-2">
                      Pilih jadwal pelajaran terlebih dahulu
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>YOLO Mode:</strong> Pastikan GPS aktif dan Anda berada dalam radius yang diizinkan
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsScanning(false)}
                    className="w-full"
                  >
                    Stop YOLO Scan
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Hasil Scan */}
        {scanResult && (
          <Card title="Hasil YOLO Absensi">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">YOLO Absensi Berhasil!</h3>
                  <p className="text-sm text-green-700">
                    {scanResult.data?.siswa?.nama} - {scanResult.data?.siswa?.kelas}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Data Siswa</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">NIS:</span>
                      <span className="font-medium">{scanResult.data?.siswa?.nis}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nama:</span>
                      <span className="font-medium">{scanResult.data?.siswa?.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kelas:</span>
                      <span className="font-medium">{scanResult.data?.siswa?.kelas}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Data Absensi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Waktu:</span>
                      <span className="font-medium">{scanResult.data?.absensi?.jam_absensi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {scanResult.data?.absensi?.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lokasi:</span>
                      <span className="font-medium">{scanResult.data?.absensi?.lokasi}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => setScanResult(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Scan Lagi
                </Button>
                <Button 
                  onClick={() => {
                    setScanResult(null)
                    setIsScanning(true)
                  }}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  YOLO Scan Lagi
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Instruksi YOLO */}
        <Card title="Instruksi YOLO Absensi">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Pilih Jadwal</h3>
              <p className="text-sm text-gray-600">Pilih jadwal pelajaran yang akan diabsensi</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Aktifkan GPS</h3>
              <p className="text-sm text-gray-600">Pastikan GPS aktif dan izinkan akses lokasi</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Scan Barcode</h3>
              <p className="text-sm text-gray-600">Arahkan kamera ke barcode siswa</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold">4</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Validasi Otomatis</h3>
              <p className="text-sm text-gray-600">Sistem validasi GPS dan waktu otomatis</p>
            </div>
          </div>
        </Card>

        {/* YOLO Scanner Modal */}
        <YOLOScanner
          isOpen={isScanning}
          onScan={handleScan}
          onError={handleError}
          onClose={() => setIsScanning(false)}
          attendanceType="kelas"
          jadwalId={selectedJadwal || undefined}
        />
      </div>
    </Layout>
  )
}