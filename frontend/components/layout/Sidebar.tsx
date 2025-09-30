'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart3,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  UserCheck,
  FileText,
  Crown,
  MapPin,
  FileSpreadsheet,
  Clock,
  Shield
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const adminMenuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Super Dashboard', href: '/admin/super-dashboard', icon: Crown },
  { name: 'Siswa', href: '/admin/students', icon: Users },
  { name: 'Guru', href: '/admin/teachers', icon: GraduationCap },
  { name: 'Kelas', href: '/admin/classes', icon: School },
  { name: 'Mata Pelajaran', href: '/admin/subjects', icon: BookOpen },
  { name: 'Jadwal', href: '/admin/schedules', icon: Calendar },
  { name: 'Lokasi Absensi', href: '/admin/locations', icon: MapPin },
  { name: 'Jadwal Absensi', href: '/admin/attendance-schedules', icon: Clock },
  { name: 'Status Absensi', href: '/admin/attendance-statuses', icon: UserCheck },
  { name: 'Level Users', href: '/admin/user-levels', icon: Shield },
  { name: 'Absensi', href: '/admin/attendance', icon: UserCheck },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Import/Export', href: '/admin/import-export', icon: FileSpreadsheet },
  { name: 'Footer Settings', href: '/admin/footer-settings', icon: Settings },
  { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
]

const guruMenuItems = [
  { name: 'Dashboard', href: '/guru/dashboard', icon: LayoutDashboard },
  { name: 'Scan Barcode', href: '/guru/scan', icon: QrCode },
  { name: 'Jadwal Mengajar', href: '/guru/schedules', icon: Calendar },
  { name: 'Absensi Kelas', href: '/guru/attendance', icon: UserCheck },
  { name: 'Laporan', href: '/guru/reports', icon: BarChart3 },
]

const siswaMenuItems = [
  { name: 'Dashboard', href: '/siswa/dashboard', icon: LayoutDashboard },
  { name: 'Scan Barcode', href: '/siswa/scan', icon: QrCode },
  { name: 'Riwayat Absensi', href: '/siswa/history', icon: FileText },
]

const operatorMenuItems = [
  { name: 'Dashboard', href: '/operator/dashboard', icon: LayoutDashboard },
  { name: 'Kelola User', href: '/operator/users', icon: Users },
  { name: 'Pengaturan Sekolah', href: '/operator/settings', icon: Settings },
  { name: 'Buat User Massal', href: '/operator/bulk-create', icon: UserCheck },
]

const parentMenuItems = [
  { name: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { name: 'Data Anak', href: '/parent/children', icon: Users },
  { name: 'Riwayat Absensi', href: '/parent/attendance', icon: FileText },
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems
      case 'guru':
        return guruMenuItems
      case 'siswa':
        return siswaMenuItems
      case 'operator':
        return operatorMenuItems
      case 'orang_tua':
        return parentMenuItems
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:fixed lg:shadow-md',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Candi QR</h1>
                <p className="text-xs text-gray-500">Sistem Absensi</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 
                   user?.role === 'guru' ? 'Guru' : 
                   user?.role === 'siswa' ? 'Siswa' :
                   user?.role === 'operator' ? 'Operator' : 'Orang Tua'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                      onClick={() => {
                        // Close mobile menu when navigating
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      }}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}