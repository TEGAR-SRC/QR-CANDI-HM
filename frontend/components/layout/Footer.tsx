'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Mail, Phone, MapPin, ExternalLink, Heart, ArrowUp, Shield, Zap, Users, Award } from 'lucide-react'

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

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFooterSettings()
  }, [])

  const fetchFooterSettings = async () => {
    try {
      const response = await api.get('/footer/settings')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error)
      // Fallback settings
      setSettings({
        company_name: 'EduPus.id',
        system_name: 'Candi QR',
        system_description: 'Sistem Absensi Sekolah Digital',
        copyright_text: `© ${new Date().getFullYear()} EduPus.id. Sistem Absensi Sekolah Digital.`,
        show_year: 'true',
        footer_links: [],
        contact_email: 'support@edupus.id',
        contact_phone: '+62 123 456 7890',
        address: 'Jl. Pendidikan No. 123, Jakarta',
        social_media: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
      </footer>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {settings.company_name}
                  </h3>
                  <p className="text-blue-200 text-sm font-medium">
                    {settings.system_name}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {settings.system_description}
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Real-time Monitoring</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Users className="h-4 w-4 text-green-400" />
                <span>Multi-role System</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Award className="h-4 w-4 text-purple-400" />
                <span>Advanced Analytics</span>
              </div>
            </div>
            
            {/* Social Media */}
            {Object.keys(settings.social_media).length > 0 && (
              <div className="flex space-x-3">
                {settings.social_media.facebook && (
                  <a
                    href={settings.social_media.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {settings.social_media.twitter && (
                  <a
                    href={settings.social_media.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
                {settings.social_media.instagram && (
                  <a
                    href={settings.social_media.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
                    </svg>
                  </a>
                )}
                {settings.social_media.linkedin && (
                  <a
                    href={settings.social_media.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {settings.social_media.youtube && (
                  <a
                    href={settings.social_media.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-red-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <span className="sr-only">YouTube</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {settings.footer_links && settings.footer_links.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white relative">
                Quick Links
                <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
              </h3>
              <ul className="space-y-3">
                {settings.footer_links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : ""}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center space-x-2 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{link.title}</span>
                      {link.external && <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform duration-300" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white relative">
              Kontak
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
            </h3>
            <div className="space-y-4">
              {settings.contact_email && (
                <div className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white/10 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-300">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="text-gray-300 hover:text-white transition-all duration-300 group-hover:translate-x-1"
                  >
                    {settings.contact_email}
                  </a>
                </div>
              )}
              {settings.contact_phone && (
                <div className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white/10 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-all duration-300">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="text-gray-300 hover:text-white transition-all duration-300 group-hover:translate-x-1"
                  >
                    {settings.contact_phone}
                  </a>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start space-x-3 group">
                  <div className="w-8 h-8 bg-white/10 group-hover:bg-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                    {settings.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white relative">
              Sistem
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white text-sm font-medium mb-1">
                  {settings.system_name}
                </p>
                <p className="text-gray-300 text-sm">
                  {settings.system_description}
                </p>
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <Heart className="h-4 w-4 text-red-400 animate-pulse" />
              <span>Made with</span>
              <span className="text-white font-medium">{settings.company_name}</span>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-right">
              {settings.copyright_text}
            </p>
          </div>
          
          {/* Back to Top Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={scrollToTop}
              className="group flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowUp className="h-4 w-4 group-hover:-translate-y-1 transition-transform duration-300" />
              <span className="text-sm">Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}