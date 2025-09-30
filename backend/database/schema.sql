-- Database schema untuk sistem absensi sekolah Candi QR
CREATE DATABASE IF NOT EXISTS candi_qr_db;
USE candi_qr_db;

-- Tabel untuk menyimpan data pengguna (admin, guru, siswa, operator, orang_tua)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'guru', 'siswa', 'operator', 'orang_tua') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk data kelas
CREATE TABLE kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kelas VARCHAR(50) NOT NULL,
    tingkat VARCHAR(20) NOT NULL,
    wali_kelas_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wali_kelas_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabel untuk data mata pelajaran
CREATE TABLE mata_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_pelajaran VARCHAR(100) NOT NULL,
    kode_pelajaran VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk data siswa
CREATE TABLE siswa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    kelas_id INT NOT NULL,
    barcode_id VARCHAR(100) UNIQUE NOT NULL,
    tanggal_lahir DATE,
    alamat TEXT,
    nama_ortu VARCHAR(100),
    phone_ortu VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

-- Tabel untuk data guru
CREATE TABLE guru (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nip VARCHAR(20) UNIQUE NOT NULL,
    mata_pelajaran_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE SET NULL
);

-- Tabel untuk data orang tua
CREATE TABLE orang_tua (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    siswa_id INT NOT NULL,
    hubungan ENUM('ayah', 'ibu', 'wali') NOT NULL,
    pekerjaan VARCHAR(100),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
);

-- Tabel untuk jadwal pelajaran
CREATE TABLE jadwal_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kelas_id INT NOT NULL,
    mata_pelajaran_id INT NOT NULL,
    guru_id INT NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
);

-- Tabel untuk absensi sekolah (masuk/pulang)
CREATE TABLE absensi_sekolah (
    id INT PRIMARY KEY AUTO_INCREMENT,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk TIME,
    jam_pulang TIME,
    status_masuk ENUM('hadir', 'terlambat', 'tidak_hadir') DEFAULT 'tidak_hadir',
    status_pulang ENUM('hadir', 'tidak_hadir') DEFAULT 'tidak_hadir',
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY unique_absensi_sekolah (siswa_id, tanggal)
);

-- Tabel untuk absensi kelas (per pelajaran)
CREATE TABLE absensi_kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    siswa_id INT NOT NULL,
    jadwal_pelajaran_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_absensi TIME NOT NULL,
    status ENUM('hadir', 'terlambat', 'tidak_hadir', 'izin', 'sakit') NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (jadwal_pelajaran_id) REFERENCES jadwal_pelajaran(id) ON DELETE CASCADE
);

-- Tabel untuk notifikasi WhatsApp
CREATE TABLE whatsapp_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    siswa_id INT NOT NULL,
    absensi_id INT NOT NULL,
    absensi_type ENUM('sekolah', 'kelas') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
);

-- Tabel untuk konfigurasi sistem
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk lokasi absensi
CREATE TABLE attendance_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT NOT NULL DEFAULT 100, -- radius dalam meter
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk jadwal absensi
CREATE TABLE attendance_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    attendance_type ENUM('sekolah', 'kelas') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    late_threshold INT DEFAULT 15, -- menit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk level/grade users
CREATE TABLE user_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    level_number INT NOT NULL,
    description TEXT,
    permissions JSON, -- permissions dalam format JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk status absensi
CREATE TABLE attendance_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- hex color
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default users
INSERT INTO users (username, email, password, role, full_name, phone) VALUES 
('admin', 'admin@candiqr.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrator', '081234567890'),
('operator', 'operator@candiqr.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator', 'Operator Sekolah', '081234567891');

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES 
('school_name', 'Sekolah Candi QR', 'Nama sekolah'),
('school_logo', '/logo.png', 'URL logo sekolah'),
('primary_color', '#3B82F6', 'Warna utama sistem'),
('whatsapp_enabled', 'true', 'Status notifikasi WhatsApp'),
('attendance_timeout', '15', 'Timeout absensi dalam menit'),
('yolo_enabled', 'true', 'Status YOLO absensi dengan geolocation'),
('max_attendance_hour', '18', 'Jam maksimal absensi (24 jam format)'),
('min_attendance_hour', '05', 'Jam minimal absensi (24 jam format)');

-- Insert default attendance locations
INSERT INTO attendance_locations (name, latitude, longitude, radius) VALUES 
('Gerbang Utama', -6.2088, 106.8456, 50),
('Gerbang Selatan', -6.2090, 106.8458, 50),
('Lapangan Sekolah', -6.2089, 106.8457, 100);

-- Insert default attendance schedules
INSERT INTO attendance_schedules (name, attendance_type, start_time, end_time, late_threshold) VALUES 
('Absensi Masuk Sekolah', 'sekolah', '06:30:00', '08:00:00', 15),
('Absensi Pulang Sekolah', 'sekolah', '14:00:00', '16:00:00', 0),
('Absensi Kelas Pagi', 'kelas', '07:00:00', '12:00:00', 10),
('Absensi Kelas Siang', 'kelas', '12:30:00', '16:00:00', 10);

-- Insert default user levels
INSERT INTO user_levels (name, level_number, description, permissions) VALUES 
('Super Admin', 10, 'Akses penuh ke semua fitur sistem', '["all"]'),
('Admin', 9, 'Admin dengan akses terbatas', '["users", "attendance", "reports", "settings"]'),
('Operator', 8, 'Operator sekolah', '["bulk_create", "school_settings", "users_view"]'),
('Guru Senior', 7, 'Guru dengan akses penuh', '["scan", "attendance_manage", "reports_class"]'),
('Guru', 6, 'Guru biasa', '["scan", "attendance_view"]'),
('Siswa Senior', 5, 'Siswa dengan akses tambahan', '["scan", "history", "stats"]'),
('Siswa', 4, 'Siswa biasa', '["scan", "history"]'),
('Orang Tua VIP', 3, 'Orang tua dengan akses penuh', '["children_full", "notifications"]'),
('Orang Tua', 2, 'Orang tua biasa', '["children_view", "attendance_view"]'),
('Guest', 1, 'Pengunjung', '["view_only"]');

-- Insert default attendance statuses
INSERT INTO attendance_statuses (code, name, description, color) VALUES 
('H', 'Hadir', 'Hadir tepat waktu', '#22C55E'),
('T', 'Terlambat', 'Hadir tapi terlambat', '#F59E0B'),
('A', 'Tidak Hadir', 'Tidak hadir tanpa keterangan', '#EF4444'),
('I', 'Izin', 'Tidak hadir dengan izin', '#8B5CF6'),
('S', 'Sakit', 'Tidak hadir karena sakit', '#F97316'),
('C', 'Cuti', 'Tidak hadir karena cuti', '#06B6D4'),
('D', 'Dinas', 'Tidak hadir karena dinas', '#84CC16'),
('L', 'Libur', 'Hari libur', '#6B7280');

-- Table untuk pengaturan footer
CREATE TABLE footer_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default footer settings
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

-- Insert sample data untuk testing
INSERT INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES 
('Matematika', 'MTK'),
('Bahasa Indonesia', 'BIN'),
('Bahasa Inggris', 'BIG'),
('IPA', 'IPA'),
('IPS', 'IPS'),
('Pendidikan Agama', 'PAI'),
('PJOK', 'PJOK'),
('Seni Budaya', 'SBK');

INSERT INTO kelas (nama_kelas, tingkat) VALUES 
('X IPA 1', 'X'),
('X IPA 2', 'X'),
('X IPS 1', 'X'),
('XI IPA 1', 'XI'),
('XI IPA 2', 'XI'),
('XI IPS 1', 'XI'),
('XII IPA 1', 'XII'),
('XII IPA 2', 'XII'),
('XII IPS 1', 'XII');