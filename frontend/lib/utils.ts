import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    return format(dateObj, formatStr, { locale: id })
  } catch (error) {
    return '-'
  }
}

export function formatTime(time: string) {
  if (!time) return '-'
  try {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  } catch (error) {
    return time
  }
}

export function formatDateTime(dateTime: string) {
  try {
    const date = parseISO(dateTime)
    if (!isValid(date)) return '-'
    return format(date, 'dd/MM/yyyy HH:mm', { locale: id })
  } catch (error) {
    return '-'
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'hadir':
      return 'badge-success'
    case 'terlambat':
      return 'badge-warning'
    case 'tidak_hadir':
    case 'tidak hadir':
      return 'badge-error'
    case 'izin':
      return 'badge-secondary'
    case 'sakit':
      return 'badge-warning'
    default:
      return 'badge-secondary'
  }
}

export function getStatusText(status: string) {
  switch (status.toLowerCase()) {
    case 'hadir':
      return 'Hadir'
    case 'terlambat':
      return 'Terlambat'
    case 'tidak_hadir':
    case 'tidak hadir':
      return 'Tidak Hadir'
    case 'izin':
      return 'Izin'
    case 'sakit':
      return 'Sakit'
    default:
      return status
  }
}

export function generateBarcodeId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8)
  return `BC${timestamp}${random}`.toUpperCase()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
  return phoneRegex.test(phone)
}

export function validateNIS(nis: string): boolean {
  const nisRegex = /^[0-9]{8,12}$/
  return nisRegex.test(nis)
}

export function validateNISN(nisn: string): boolean {
  const nisnRegex = /^[0-9]{10}$/
  return nisnRegex.test(nisn)
}

export function validateNIP(nip: string): boolean {
  const nipRegex = /^[0-9]{18}$/
  return nipRegex.test(nip)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function exportToExcel(data: any[], filename: string) {
  // This would typically use a library like xlsx
  // For now, we'll create a simple CSV export
  const csvContent = convertToCSV(data)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${filename}.csv`)
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      return typeof value === 'string' ? `"${value}"` : value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'guru':
      return 'Guru'
    case 'siswa':
      return 'Siswa'
    case 'operator':
      return 'Operator Sekolah'
    case 'orang_tua':
      return 'Orang Tua'
    default:
      return role
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'text-red-600 bg-red-100'
    case 'guru':
      return 'text-blue-600 bg-blue-100'
    case 'siswa':
      return 'text-green-600 bg-green-100'
    case 'operator':
      return 'text-purple-600 bg-purple-100'
    case 'orang_tua':
      return 'text-orange-600 bg-orange-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}