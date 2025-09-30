# Candi QR - Sistem Absensi Sekolah Digital

Sistem absensi sekolah digital yang modern dan terintegrasi dengan fitur QR Code scanning, geolocation, dan notifikasi WhatsApp.

## 🚀 Fitur Utama

### 👥 Multi-Role System
- **Admin**: Kelola semua data sekolah, laporan, dan pengaturan
- **Guru**: Scan QR Code, kelola absensi kelas, lihat laporan
- **Siswa**: Scan QR Code untuk absensi, lihat riwayat absensi
- **Orang Tua**: Monitor absensi anak, terima notifikasi
- **Operator**: Kelola data sekolah, bulk create users

### 📱 YOLO Absensi
- **Geolocation**: Absensi hanya bisa dilakukan di lokasi yang ditentukan
- **Time-based**: Batasan waktu maksimal untuk absensi
- **QR Code Scanning**: Scan barcode/QR Code untuk absensi
- **Real-time**: Data absensi real-time dan sinkronisasi

### 📊 Laporan & Analytics
- **Dashboard Real-time**: Statistik kehadiran, keterlambatan, dll
- **Export Excel**: Download laporan dalam format Excel
- **Filter Advanced**: Filter berdasarkan tanggal, kelas, status
- **Charts & Graphs**: Visualisasi data yang interaktif

### 🔔 Notifikasi
- **WhatsApp Integration**: Notifikasi otomatis ke orang tua
- **Real-time Updates**: Update status absensi real-time
- **Custom Messages**: Pesan notifikasi yang dapat dikustomisasi

## 🛠️ Teknologi

### Backend
- **Node.js** (LTS)
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File upload
- **Axios** - HTTP client
- **Moment.js** - Date handling
- **XLSX** - Excel export
- **Joi** - Validation
- **Helmet** - Security
- **Express Rate Limit** - Rate limiting

### Frontend
- **Next.js** (LTS) - React framework
- **React** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **HTML5 QR Code** - QR scanning
- **Date-fns** - Date utilities
- **Recharts** - Charts
- **React Table** - Data tables
- **React Select** - Select components
- **React DatePicker** - Date picker
- **XLSX** - Excel import/export

## 📦 Instalasi

### Prerequisites
- Node.js (LTS)
- MySQL
- Git

### 1. Clone Repository
```bash
git clone https://github.com/TEGAR-SRC/QR-CANDI-HM.git
cd QR-CANDI-HM
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npm run setup-db
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local dengan URL backend
npm run dev
```

### 4. Database Setup
```bash
# Jalankan script setup database
cd backend
node run-schema.js
```

## 🔧 Konfigurasi

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=absencandi1harijadi
JWT_SECRET=your_jwt_secret
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_API_KEY=your_whatsapp_api_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📱 Penggunaan

### 1. Login
- Akses `http://localhost:3000/login`
- Login dengan kredensial admin default:
  - Username: `admin`
  - Password: `admin123`

### 2. Dashboard Admin
- Kelola data siswa, guru, kelas
- Lihat statistik absensi real-time
- Generate laporan dan export Excel
- Konfigurasi pengaturan sistem

### 3. Absensi
- **Siswa**: Scan QR Code untuk absensi masuk/pulang
- **Guru**: Scan QR Code untuk absensi kelas
- **YOLO Mode**: Absensi dengan geolocation dan time-based

### 4. Laporan
- Dashboard dengan statistik real-time
- Filter berdasarkan tanggal, kelas, status
- Export laporan dalam format Excel
- Visualisasi data dengan charts

## 🗂️ Struktur Project

```
candi-qr/
├── backend/
│   ├── controllers/     # API controllers
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication & validation
│   ├── config/         # Database configuration
│   ├── database/       # Database schema & migrations
│   └── server.js       # Main server file
├── frontend/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/            # Utilities & API client
│   ├── contexts/       # React contexts
│   └── public/         # Static assets
└── README.md
```

## 🔐 Keamanan

- **JWT Authentication**: Token-based authentication
- **Password Hashing**: bcrypt untuk enkripsi password
- **Rate Limiting**: Proteksi dari spam requests
- **Input Validation**: Validasi input dengan Joi
- **SQL Injection Protection**: Prepared statements
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers

## 📊 Database Schema

### Tables
- `users` - Data pengguna
- `siswa` - Data siswa
- `guru` - Data guru
- `kelas` - Data kelas
- `mata_pelajaran` - Data mata pelajaran
- `jadwal_pelajaran` - Jadwal pelajaran
- `absensi_sekolah` - Absensi masuk/pulang
- `absensi_kelas` - Absensi per kelas
- `orang_tua` - Data orang tua
- `operator` - Data operator sekolah
- `user_levels` - Level pengguna
- `attendance_locations` - Lokasi absensi
- `attendance_schedules` - Jadwal absensi
- `attendance_statuses` - Status absensi
- `footer_settings` - Pengaturan footer
- `system_config` - Konfigurasi sistem

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database
- Set up reverse proxy (nginx)
- Configure SSL certificates
- Set up monitoring and logging

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**TEGAR-SRC**
- GitHub: [@TEGAR-SRC](https://github.com/TEGAR-SRC)
- Repository: [QR-CANDI-HM](https://github.com/TEGAR-SRC/QR-CANDI-HM)

## 🙏 Acknowledgments

- Next.js team untuk framework yang luar biasa
- Express.js team untuk backend framework
- TailwindCSS team untuk utility-first CSS
- MySQL team untuk database yang reliable
- Semua open source contributors

---

**© 2024 Candi QR. Sistem Absensi Sekolah Digital.**