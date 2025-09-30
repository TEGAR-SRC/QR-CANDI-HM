# Candi QR Backend

Backend API untuk sistem absensi sekolah digital dengan barcode menggunakan Express.js dan MySQL.

## Fitur

- 🔐 **Autentikasi JWT** dengan role-based access control
- 👥 **Multi-role System**: Admin, Guru, Siswa, Operator, Orang Tua
- 📱 **Scan Barcode** untuk absensi sekolah dan kelas
- 📊 **Dashboard** berbeda untuk setiap role
- 📈 **Laporan & Export** ke Excel
- 📱 **Integrasi WhatsApp** untuk notifikasi
- 🔧 **Pengaturan Sekolah** yang dapat dikustomisasi
- 👨‍👩‍👧‍👦 **Bulk User Creation** untuk import data massal

## Teknologi

- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client untuk WhatsApp API
- **XLSX** - Excel export
- **Moment.js** - Date manipulation

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Konfigurasi environment variables di `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=candi_qr_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# WhatsApp API Configuration
WHATSAPP_API_URL=https://api.waha.com
WHATSAPP_API_TOKEN=your_whatsapp_token_here

# School Configuration
SCHOOL_NAME=Sekolah Candi QR
SCHOOL_LOGO_URL=/logo.png
PRIMARY_COLOR=#3B82F6
```

4. Setup database MySQL:
```bash
mysql -u root -p < database/schema.sql
```

5. Jalankan server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Attendance
- `POST /api/attendance/scan` - Scan barcode untuk absensi
- `GET /api/attendance/history` - Get riwayat absensi
- `GET /api/attendance/report` - Get rekap absensi

### Students
- `GET /api/students` - Get semua siswa
- `GET /api/students/:id` - Get siswa by ID
- `POST /api/students` - Create siswa (admin only)
- `PUT /api/students/:id` - Update siswa (admin only)
- `DELETE /api/students/:id` - Delete siswa (admin only)

### Teachers
- `GET /api/teachers` - Get semua guru
- `GET /api/teachers/:id` - Get guru by ID
- `POST /api/teachers` - Create guru (admin only)
- `PUT /api/teachers/:id` - Update guru (admin only)
- `DELETE /api/teachers/:id` - Delete guru (admin only)

### Classes
- `GET /api/classes` - Get semua kelas
- `GET /api/classes/:id` - Get kelas by ID
- `POST /api/classes` - Create kelas (admin only)
- `PUT /api/classes/:id` - Update kelas (admin only)
- `DELETE /api/classes/:id` - Delete kelas (admin only)

### Subjects
- `GET /api/subjects` - Get semua mata pelajaran
- `GET /api/subjects/:id` - Get mata pelajaran by ID
- `POST /api/subjects` - Create mata pelajaran (admin only)
- `PUT /api/subjects/:id` - Update mata pelajaran (admin only)
- `DELETE /api/subjects/:id` - Delete mata pelajaran (admin only)

### Schedules
- `GET /api/schedules` - Get semua jadwal pelajaran
- `GET /api/schedules/:id` - Get jadwal by ID
- `POST /api/schedules` - Create jadwal (admin only)
- `PUT /api/schedules/:id` - Update jadwal (admin only)
- `DELETE /api/schedules/:id` - Delete jadwal (admin only)

### Reports
- `GET /api/reports/export` - Export laporan ke Excel
- `GET /api/reports/stats` - Get statistik absensi
- `GET /api/reports/dashboard` - Get data dashboard

### Parents
- `GET /api/parents/children` - Get data anak-anak
- `GET /api/parents/children/:id/attendance` - Get riwayat absensi anak
- `GET /api/parents/children/:id/stats` - Get statistik absensi anak

### Operators
- `GET /api/operators/school-data` - Get data sekolah
- `GET /api/operators/config` - Get konfigurasi sekolah
- `PUT /api/operators/config` - Update konfigurasi sekolah
- `POST /api/operators/bulk-create-users` - Bulk create users
- `GET /api/operators/users` - Get semua users

## Database Schema

### Users
- `id` - Primary key
- `username` - Username unik
- `email` - Email unik
- `password` - Password ter-hash
- `role` - Role user (admin, guru, siswa, operator, orang_tua)
- `full_name` - Nama lengkap
- `phone` - Nomor telepon
- `is_active` - Status aktif

### Siswa
- `id` - Primary key
- `user_id` - Foreign key ke users
- `nis` - Nomor Induk Siswa
- `nisn` - Nomor Induk Siswa Nasional
- `kelas_id` - Foreign key ke kelas
- `barcode_id` - ID barcode unik
- `tanggal_lahir` - Tanggal lahir
- `alamat` - Alamat
- `nama_ortu` - Nama orang tua
- `phone_ortu` - Nomor telepon orang tua

### Guru
- `id` - Primary key
- `user_id` - Foreign key ke users
- `nip` - Nomor Induk Pegawai
- `mata_pelajaran_id` - Foreign key ke mata_pelajaran

### Orang Tua
- `id` - Primary key
- `user_id` - Foreign key ke users
- `siswa_id` - Foreign key ke siswa
- `hubungan` - Hubungan (ayah, ibu, wali)
- `pekerjaan` - Pekerjaan
- `alamat` - Alamat

### Absensi Sekolah
- `id` - Primary key
- `siswa_id` - Foreign key ke siswa
- `tanggal` - Tanggal absensi
- `jam_masuk` - Jam masuk
- `jam_pulang` - Jam pulang
- `status_masuk` - Status masuk (hadir, terlambat, tidak_hadir)
- `status_pulang` - Status pulang (hadir, tidak_hadir)

### Absensi Kelas
- `id` - Primary key
- `siswa_id` - Foreign key ke siswa
- `jadwal_pelajaran_id` - Foreign key ke jadwal_pelajaran
- `tanggal` - Tanggal absensi
- `jam_absensi` - Jam absensi
- `status` - Status (hadir, terlambat, tidak_hadir, izin, sakit)

## Role & Permission

### Admin
- Akses penuh ke semua fitur
- Kelola semua data (siswa, guru, kelas, dll)
- Generate laporan dan export
- Kelola konfigurasi sistem

### Operator
- Kelola data sekolah
- Bulk create users
- Pengaturan konfigurasi sekolah
- Lihat statistik sekolah

### Guru
- Scan barcode untuk absensi
- Lihat jadwal mengajar
- Kelola absensi kelas
- Generate laporan kelas

### Siswa
- Scan barcode untuk absensi
- Lihat riwayat absensi pribadi
- Lihat statistik kehadiran

### Orang Tua
- Lihat data anak-anak
- Monitor riwayat absensi anak
- Lihat statistik kehadiran anak

## WhatsApp Integration

Sistem terintegrasi dengan WhatsApp API untuk mengirim notifikasi otomatis:

- Notifikasi absensi masuk sekolah
- Notifikasi absensi pulang sekolah
- Status notifikasi (pending, sent, failed)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `` |
| `DB_NAME` | Database name | `candi_qr_db` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `WHATSAPP_API_URL` | WhatsApp API URL | Required |
| `WHATSAPP_API_TOKEN` | WhatsApp API token | Required |

## Testing

```bash
# Test database connection
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Troubleshooting

### Database Connection Error
- Pastikan MySQL server berjalan
- Cek konfigurasi database di `.env`
- Pastikan database `candi_qr_db` sudah dibuat

### JWT Token Error
- Pastikan `JWT_SECRET` sudah diset di `.env`
- Cek format token di header Authorization

### WhatsApp API Error
- Pastikan `WHATSAPP_API_URL` dan `WHATSAPP_API_TOKEN` sudah benar
- Cek status API WhatsApp

## Lisensi

MIT License - Candi QR Team