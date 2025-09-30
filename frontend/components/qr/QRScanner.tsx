'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, X } from 'lucide-react'
import Button from '../ui/Button'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  onClose?: () => void
  isOpen: boolean
}

export default function QRScanner({ onScan, onError, onClose, isOpen }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [isOpen])

  const initializeScanner = () => {
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 5,
        },
        false
      )

      scanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText)
          onScan(decodedText)
          stopScanning()
        },
        (error) => {
          // Don't log every error to avoid spam
          if (error.includes('No QR code found')) {
            return
          }
          console.warn('QR Scanner error:', error)
          setError(error)
          if (onError) {
            onError(error)
          }
        }
      )

      scannerRef.current = scanner
      setIsScanning(true)
    } catch (err) {
      console.error('Failed to initialize QR scanner:', err)
      setError('Gagal menginisialisasi scanner QR')
      if (onError) {
        onError('Gagal menginisialisasi scanner QR')
      }
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Scan Barcode
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Arahkan kamera ke barcode untuk melakukan scan
            </p>
          </div>

          <div id="qr-reader" className="w-full"></div>

          <div className="mt-4 flex justify-center space-x-2">
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
          </div>
        </div>
      </div>
    </div>
  )
}