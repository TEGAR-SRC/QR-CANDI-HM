# Troubleshooting Guide - Candi QR

Panduan untuk mengatasi masalah umum dalam sistem Candi QR.

## 🚨 Error 500 Internal Server Error

### Masalah: "Table 'candi_qr_db.users' doesn't exist"

**Penyebab:**
Database belum dibuat atau tabel belum diinisialisasi.

**Solusi:**
1. Pastikan MySQL server berjalan
2. Jalankan setup database:
```bash
cd backend
npm run setup-db
```

3. Pastikan file `.env` sudah dibuat:
```bash
cd backend
cp .env.example .env
```

4. Edit file `.env` sesuai konfigurasi database Anda:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=absencandi1harijadi
```

### Masalah: "Cannot connect to database"

**Penyebab:**
- MySQL server tidak berjalan
- Konfigurasi database salah
- Password database salah

**Solusi:**
1. Pastikan MySQL server berjalan
2. Periksa konfigurasi di `.env`
3. Test koneksi database:
```bash
mysql -u root -p
```

## 🔧 Setup Database

### 1. **Setup Otomatis (Recommended)**
```bash
cd backend
npm run setup-db
```

### 2. **Setup Manual**
```bash
# 1. Buat database
mysql -u root -p
CREATE DATABASE absencandi1harijadi;
USE absencandi1harijadi;

# 2. Import schema
source backend/database/schema.sql;
```

## 🚀 Menjalankan Aplikasi

### 1. **Backend**
```bash
cd backend
npm install
npm run setup-db  # Setup database
npm run dev       # Jalankan server
```

### 2. **Frontend**
```bash
cd frontend
npm install
npm run dev       # Jalankan frontend
```

### 3. **Akses Aplikasi**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🔐 Login Default

Setelah database setup, gunakan akun default:

### Admin
- Username: `admin`
- Password: `password`

### Operator
- Username: `operator`
- Password: `password`

## 📊 Verifikasi Database

### 1. **Cek Tabel**
```sql
USE absencandi1harijadi;
SHOW TABLES;
```

### 2. **Cek Data Users**
```sql
SELECT username, role, full_name FROM users;
```

### 3. **Cek Konfigurasi**
```sql
SELECT * FROM system_config;
SELECT * FROM footer_settings;
```

## 🐛 Common Issues

### 1. **Port Already in Use**
```bash
# Cek port yang digunakan
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### 2. **Module Not Found**
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install
```

### 3. **CORS Error**
Pastikan backend berjalan di port 5000 dan frontend di port 3000.

### 4. **Database Connection Timeout**
Periksa konfigurasi MySQL dan pastikan server berjalan.

## 🔍 Debug Mode

### 1. **Backend Debug**
```bash
cd backend
DEBUG=* npm run dev
```

### 2. **Frontend Debug**
```bash
cd frontend
npm run dev -- --verbose
```

### 3. **Database Debug**
Tambahkan di `.env`:
```env
DEBUG=mysql:*
```

## 📝 Log Files

### 1. **Backend Logs**
Logs ditampilkan di terminal saat menjalankan `npm run dev`

### 2. **Database Logs**
Cek MySQL error log:
```bash
# Windows
C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err

# Linux/Mac
/var/log/mysql/error.log
```

## 🆘 Support

Jika masih mengalami masalah:

1. **Cek Logs**: Periksa error message di terminal
2. **Restart Services**: Restart MySQL dan aplikasi
3. **Clean Install**: Hapus node_modules dan install ulang
4. **Database Reset**: Hapus database dan setup ulang

### Clean Install
```bash
# Backend
cd backend
rm -rf node_modules
npm install
npm run setup-db

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### Database Reset
```bash
mysql -u root -p
DROP DATABASE absencandi1harijadi;
CREATE DATABASE absencandi1harijadi;
exit

cd backend
npm run setup-db
```

## ✅ Checklist Troubleshooting

- [ ] MySQL server berjalan
- [ ] Database `absencandi1harijadi` ada
- [ ] Tabel `users` ada dan berisi data
- [ ] File `.env` ada dan benar
- [ ] Backend berjalan di port 5000
- [ ] Frontend berjalan di port 3000
- [ ] Tidak ada error di terminal
- [ ] API health check berhasil

---

**Troubleshooting Guide** - Panduan lengkap untuk mengatasi masalah! 🔧✨