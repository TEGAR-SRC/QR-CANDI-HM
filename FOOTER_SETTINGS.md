# Pengaturan Footer - Candi QR

Sistem pengaturan footer yang dapat dikustomisasi melalui admin panel dan disimpan di database.

## 🎯 Fitur

### 1. **Pengaturan Dinamis**
- Nama perusahaan/organisasi
- Nama sistem
- Deskripsi sistem
- Teks copyright dengan tahun otomatis
- Informasi kontak (email, telepon, alamat)
- Link footer yang dapat dikustomisasi
- Social media links

### 2. **Tahun Otomatis**
- Sistem dapat menampilkan tahun saat ini secara otomatis
- Admin dapat mengaktifkan/menonaktifkan fitur ini
- Format: `© 2024 EduPus.id. Sistem Absensi Sekolah Digital.`

### 3. **Kustomisasi Lengkap**
- Semua teks dapat diubah melalui admin panel
- Preview real-time
- Reset ke pengaturan default
- Validasi input

## 🗄️ Database Schema

### Tabel: `footer_settings`
```sql
CREATE TABLE footer_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Pengaturan Default
```sql
INSERT INTO footer_settings (setting_key, setting_value, description) VALUES 
('company_name', 'EduPus.id', 'Nama perusahaan/organisasi'),
('system_name', 'Candi QR', 'Nama sistem'),
('system_description', 'Sistem Absensi Sekolah Digital', 'Deskripsi sistem'),
('copyright_text', '© 2024 EduPus.id. Sistem Absensi Sekolah Digital.', 'Teks copyright'),
('show_year', 'true', 'Tampilkan tahun otomatis'),
('footer_links', '[]', 'Link-link footer dalam format JSON'),
('contact_email', 'support@edupus.id', 'Email kontak'),
('contact_phone', '+62 123 456 7890', 'Nomor telepon kontak'),
('address', 'Jl. Pendidikan No. 123, Jakarta', 'Alamat'),
('social_media', '{}', 'Social media links dalam format JSON');
```

## 🔧 API Endpoints

### 1. **Get Footer Settings (Public)**
```
GET /api/footer/settings
```
Response:
```json
{
  "success": true,
  "data": {
    "company_name": "EduPus.id",
    "system_name": "Candi QR",
    "system_description": "Sistem Absensi Sekolah Digital",
    "copyright_text": "© 2024 EduPus.id. Sistem Absensi Sekolah Digital.",
    "show_year": "true",
    "footer_links": [
      {
        "title": "Tentang Kami",
        "url": "/about",
        "external": false
      }
    ],
    "contact_email": "support@edupus.id",
    "contact_phone": "+62 123 456 7890",
    "address": "Jl. Pendidikan No. 123, Jakarta",
    "social_media": {
      "facebook": "https://facebook.com/edupus",
      "twitter": "https://twitter.com/edupus",
      "instagram": "https://instagram.com/edupus"
    }
  }
}
```

### 2. **Get Footer Settings (Admin)**
```
GET /api/footer/admin/settings
Authorization: Bearer <token>
```

### 3. **Update Footer Settings**
```
PUT /api/footer/admin/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "company_name": "EduPus.id",
    "system_name": "Candi QR",
    "copyright_text": "© 2024 EduPus.id. Sistem Absensi Sekolah Digital.",
    "show_year": "true",
    "footer_links": [
      {
        "title": "Tentang Kami",
        "url": "/about",
        "external": false
      }
    ],
    "social_media": {
      "facebook": "https://facebook.com/edupus"
    }
  }
}
```

### 4. **Reset to Default**
```
POST /api/footer/admin/reset
Authorization: Bearer <token>
```

## 🎨 Komponen Frontend

### 1. **Footer Component**
```tsx
import Footer from '@/components/layout/Footer'

// Otomatis mengambil data dari API
<Footer />
```

### 2. **Admin Page**
```
/admin/footer-settings
```

## 📱 Penggunaan

### Untuk Admin
1. Login sebagai admin
2. Buka menu "Footer Settings"
3. Edit pengaturan yang diinginkan:
   - **Informasi Perusahaan**: Nama perusahaan, sistem, deskripsi
   - **Informasi Kontak**: Email, telepon, alamat
   - **Link Footer**: Tambah/hapus link dengan opsi eksternal
   - **Social Media**: Facebook, Twitter, Instagram, LinkedIn, YouTube
4. Lihat preview real-time
5. Klik "Simpan" untuk menyimpan perubahan

### Fitur Khusus
- **Tahun Otomatis**: Centang "Tampilkan tahun otomatis" untuk update tahun otomatis
- **Link Eksternal**: Centang "Link eksternal" untuk link yang membuka tab baru
- **Preview**: Lihat hasil perubahan sebelum menyimpan
- **Reset**: Kembalikan ke pengaturan default

## 🔄 Update Otomatis

### Tahun Otomatis
Jika `show_year` = `true`, sistem akan:
1. Mengganti tahun di `copyright_text` dengan tahun saat ini
2. Format: `© 2024` → `© 2025` (otomatis)

### Real-time Update
- Perubahan langsung terlihat di semua halaman
- Tidak perlu restart aplikasi
- Data tersimpan di database

## 🎯 Contoh Penggunaan

### 1. **Mengubah Nama Perusahaan**
```javascript
// Admin mengubah di panel
company_name: "Sekolah ABC"

// Footer akan menampilkan
"© 2024 Sekolah ABC. Sistem Absensi Sekolah Digital."
```

### 2. **Menambah Link Footer**
```javascript
footer_links: [
  {
    "title": "Tentang Kami",
    "url": "/about",
    "external": false
  },
  {
    "title": "Kebijakan Privasi",
    "url": "https://example.com/privacy",
    "external": true
  }
]
```

### 3. **Social Media**
```javascript
social_media: {
  "facebook": "https://facebook.com/sekolahabc",
  "instagram": "https://instagram.com/sekolahabc",
  "youtube": "https://youtube.com/c/sekolahabc"
}
```

## 🚀 Implementasi

### 1. **Backend**
- Controller: `backend/controllers/footerController.js`
- Routes: `backend/routes/footer.js`
- Database: Tabel `footer_settings`

### 2. **Frontend**
- Component: `frontend/components/layout/Footer.tsx`
- Admin Page: `frontend/app/admin/footer-settings/page.tsx`
- Layout: Footer otomatis muncul di semua halaman

### 3. **Database**
- Jalankan migration untuk membuat tabel `footer_settings`
- Data default akan otomatis terisi

## 🔒 Keamanan

- Hanya admin yang dapat mengubah pengaturan
- Validasi input di backend dan frontend
- Sanitasi data sebelum disimpan
- Rate limiting untuk API

## 📊 Monitoring

- Log semua perubahan pengaturan
- Track admin yang melakukan perubahan
- Backup pengaturan secara berkala

---

**Footer Settings** - Sistem pengaturan footer yang fleksibel dan mudah digunakan! 🎨✨