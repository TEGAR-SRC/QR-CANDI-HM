# Candi QR Frontend

Frontend untuk sistem absensi sekolah digital dengan barcode menggunakan Next.js 14 dan TailwindCSS.

## Fitur

- 🎯 **Dashboard Berbeda**: Admin, Guru, dan Siswa memiliki dashboard yang disesuaikan
- 📱 **Responsive Design**: UI yang optimal di desktop dan mobile
- 🔐 **Autentikasi JWT**: Sistem login yang aman dengan role-based access
- 📊 **Scan Barcode**: Integrasi kamera untuk scan barcode kartu pelajar
- 📈 **Laporan Real-time**: Dashboard dengan statistik kehadiran
- 🎨 **Modern UI**: Desain mengikuti referensi sumopod.com

## Teknologi

- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **HTML5 QR Code** - Barcode scanning
- **Lucide React** - Icons

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.local.example .env.local
```

3. Konfigurasi environment variables di `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SCHOOL_NAME=Sekolah Candi QR
NEXT_PUBLIC_SCHOOL_LOGO=/logo.png
NEXT_PUBLIC_PRIMARY_COLOR=#3B82F6
```

4. Jalankan development server:
```bash
npm run dev
```

5. Buka [http://localhost:3000](http://localhost:3000) di browser

## Struktur Project

```
frontend/
├── app/                    # Next.js App Router
│   ├── admin/             # Halaman admin
│   ├── guru/              # Halaman guru
│   ├── siswa/             # Halaman siswa
│   ├── login/             # Halaman login
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── qr/               # QR scanner components
├── contexts/             # React contexts
├── lib/                  # Utilities dan API
└── public/               # Static assets
```

## Role dan Akses

### Admin
- Dashboard dengan statistik lengkap
- Kelola data siswa, guru, kelas
- Kelola mata pelajaran dan jadwal
- Lihat semua absensi
- Generate laporan dan export Excel

### Guru
- Dashboard dengan jadwal mengajar
- Lihat absensi kelas yang diajar
- Generate laporan kelas

### Siswa
- Dashboard dengan riwayat absensi
- Scan barcode untuk absensi
- Lihat statistik kehadiran pribadi

## Komponen Utama

### QRScanner
Komponen untuk scan barcode menggunakan kamera:
```tsx
<QRScanner
  isOpen={isOpen}
  onScan={(result) => console.log(result)}
  onError={(error) => console.error(error)}
  onClose={() => setIsOpen(false)}
/>
```

### Layout
Layout wrapper dengan sidebar dan header:
```tsx
<Layout allowedRoles={['admin', 'guru']}>
  <YourContent />
</Layout>
```

## API Integration

Frontend berkomunikasi dengan backend melalui:
- `lib/api.ts` - Axios instance dengan interceptors
- `contexts/AuthContext.tsx` - State management untuk autentikasi

## Styling

Menggunakan TailwindCSS dengan custom theme:
- Primary colors: Blue (#3B82F6)
- Component classes di `globals.css`
- Responsive design dengan mobile-first approach

## Build dan Deploy

1. Build untuk production:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_SCHOOL_NAME` | Nama sekolah | `Sekolah Candi QR` |
| `NEXT_PUBLIC_SCHOOL_LOGO` | URL logo sekolah | `/logo.png` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Warna utama | `#3B82F6` |

## Troubleshooting

### QR Scanner tidak berfungsi
- Pastikan browser mendukung getUserMedia API
- Gunakan HTTPS untuk akses kamera
- Cek permission kamera di browser

### API Connection Error
- Pastikan backend server berjalan di port 5000
- Cek CORS configuration di backend
- Verifikasi API URL di environment variables

## Lisensi

MIT License - Candi QR Team