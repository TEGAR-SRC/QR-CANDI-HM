const { pool } = require('../config/database');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

// Super Admin Dashboard - Fitur dewa yang tidak ada di role lain
const getSuperDashboard = async (req, res) => {
  try {
    // Statistik sistem real-time
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [totalSiswa] = await pool.execute('SELECT COUNT(*) as count FROM siswa');
    const [totalGuru] = await pool.execute('SELECT COUNT(*) as count FROM guru');
    const [totalOrangTua] = await pool.execute('SELECT COUNT(*) as count FROM orang_tua');
    const [totalKelas] = await pool.execute('SELECT COUNT(*) as count FROM kelas');
    const [totalAbsensiHariIni] = await pool.execute('SELECT COUNT(*) as count FROM absensi_sekolah WHERE tanggal = CURDATE()');
    const [totalAbsensiBulanIni] = await pool.execute('SELECT COUNT(*) as count FROM absensi_sekolah WHERE MONTH(tanggal) = MONTH(CURDATE()) AND YEAR(tanggal) = YEAR(CURDATE())');
    
    // Statistik kehadiran real-time
    const [kehadiranHariIni] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN status_masuk = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN status_masuk = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
        SUM(CASE WHEN status_masuk = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir
      FROM absensi_sekolah 
      WHERE tanggal = CURDATE()
    `);

    // Top kelas dengan kehadiran terbaik
    const [topKelas] = await pool.execute(`
      SELECT 
        k.nama_kelas,
        COUNT(abs.id) as total_absensi,
        SUM(CASE WHEN abs.status_masuk = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        ROUND((SUM(CASE WHEN abs.status_masuk = 'Hadir' THEN 1 ELSE 0 END) / COUNT(abs.id)) * 100, 2) as persentase_hadir
      FROM kelas k
      LEFT JOIN siswa s ON k.id = s.kelas_id
      LEFT JOIN absensi_sekolah abs ON s.id = abs.siswa_id AND abs.tanggal = CURDATE()
      GROUP BY k.id, k.nama_kelas
      HAVING total_absensi > 0
      ORDER BY persentase_hadir DESC
      LIMIT 5
    `);

    // Aktivitas sistem terbaru
    const [aktivitasTerbaru] = await pool.execute(`
      SELECT 
        'Absensi' as tipe,
        CONCAT(s.nis, ' - ', u.full_name) as detail,
        abs.tanggal as waktu,
        abs.status_masuk as status
      FROM absensi_sekolah abs
      JOIN siswa s ON abs.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE abs.tanggal = CURDATE()
      ORDER BY abs.jam_masuk DESC
      LIMIT 10
    `);

    // Statistik per jam
    const [statistikPerJam] = await pool.execute(`
      SELECT 
        HOUR(jam_masuk) as jam,
        COUNT(*) as jumlah_absensi
      FROM absensi_sekolah 
      WHERE tanggal = CURDATE()
      GROUP BY HOUR(jam_masuk)
      ORDER BY jam
    `);

    res.json({
      success: true,
      data: {
        statistik: {
          total_users: totalUsers[0].count,
          total_siswa: totalSiswa[0].count,
          total_guru: totalGuru[0].count,
          total_orang_tua: totalOrangTua[0].count,
          total_kelas: totalKelas[0].count,
          absensi_hari_ini: totalAbsensiHariIni[0].count,
          absensi_bulan_ini: totalAbsensiBulanIni[0].count
        },
        kehadiran_hari_ini: kehadiranHariIni[0],
        top_kelas: topKelas,
        aktivitas_terbaru: aktivitasTerbaru,
        statistik_per_jam: statistikPerJam
      }
    });

  } catch (error) {
    console.error('Super dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Kelola lokasi absensi
const manageAttendanceLocations = async (req, res) => {
  try {
    const { action, id, name, latitude, longitude, radius, is_active } = req.body;

    if (action === 'create') {
      const [result] = await pool.execute(
        'INSERT INTO attendance_locations (name, latitude, longitude, radius, is_active) VALUES (?, ?, ?, ?, ?)',
        [name, latitude, longitude, radius, is_active !== false]
      );

      res.json({
        success: true,
        message: 'Lokasi absensi berhasil dibuat',
        data: { id: result.insertId }
      });

    } else if (action === 'update') {
      await pool.execute(
        'UPDATE attendance_locations SET name = ?, latitude = ?, longitude = ?, radius = ?, is_active = ? WHERE id = ?',
        [name, latitude, longitude, radius, is_active !== false, id]
      );

      res.json({
        success: true,
        message: 'Lokasi absensi berhasil diupdate'
      });

    } else if (action === 'delete') {
      await pool.execute('DELETE FROM attendance_locations WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Lokasi absensi berhasil dihapus'
      });

    } else if (action === 'list') {
      const [locations] = await pool.execute(
        'SELECT * FROM attendance_locations ORDER BY name'
      );

      res.json({
        success: true,
        data: locations
      });
    }

  } catch (error) {
    console.error('Manage attendance locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Kelola jadwal absensi
const manageAttendanceSchedules = async (req, res) => {
  try {
    const { action, id, name, attendance_type, start_time, end_time, late_threshold, is_active } = req.body;

    if (action === 'create') {
      const [result] = await pool.execute(
        'INSERT INTO attendance_schedules (name, attendance_type, start_time, end_time, late_threshold, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [name, attendance_type, start_time, end_time, late_threshold, is_active !== false]
      );

      res.json({
        success: true,
        message: 'Jadwal absensi berhasil dibuat',
        data: { id: result.insertId }
      });

    } else if (action === 'update') {
      await pool.execute(
        'UPDATE attendance_schedules SET name = ?, attendance_type = ?, start_time = ?, end_time = ?, late_threshold = ?, is_active = ? WHERE id = ?',
        [name, attendance_type, start_time, end_time, late_threshold, is_active !== false, id]
      );

      res.json({
        success: true,
        message: 'Jadwal absensi berhasil diupdate'
      });

    } else if (action === 'delete') {
      await pool.execute('DELETE FROM attendance_schedules WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Jadwal absensi berhasil dihapus'
      });

    } else if (action === 'list') {
      const [schedules] = await pool.execute(
        'SELECT * FROM attendance_schedules ORDER BY attendance_type, start_time'
      );

      res.json({
        success: true,
        data: schedules
      });
    }

  } catch (error) {
    console.error('Manage attendance schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Kelola level users
const manageUserLevels = async (req, res) => {
  try {
    const { action, id, name, level_number, description, permissions, is_active } = req.body;

    if (action === 'create') {
      const [result] = await pool.execute(
        'INSERT INTO user_levels (name, level_number, description, permissions) VALUES (?, ?, ?, ?)',
        [name, level_number, description, JSON.stringify(permissions)]
      );

      res.json({
        success: true,
        message: 'Level user berhasil dibuat',
        data: { id: result.insertId }
      });

    } else if (action === 'update') {
      await pool.execute(
        'UPDATE user_levels SET name = ?, level_number = ?, description = ?, permissions = ? WHERE id = ?',
        [name, level_number, description, JSON.stringify(permissions), id]
      );

      res.json({
        success: true,
        message: 'Level user berhasil diupdate'
      });

    } else if (action === 'delete') {
      await pool.execute('DELETE FROM user_levels WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Level user berhasil dihapus'
      });

    } else if (action === 'list') {
      const [levels] = await pool.execute(
        'SELECT * FROM user_levels ORDER BY level_number DESC'
      );

      // Parse permissions with error handling (supports JSON array, comma-separated string, or "all")
      const levelsWithParsedPermissions = levels.map(level => {
        let permissions = [];
        try {
          const permStr = String(level.permissions || '');
          
          if (permStr === 'all') {
            // Handle special case for "all" permissions
            permissions = ['all'];
          } else if (permStr.startsWith('[') && permStr.endsWith(']')) {
            // Handle JSON array format
            permissions = JSON.parse(permStr);
          } else if (permStr.includes(',')) {
            // Handle comma-separated string format
            permissions = permStr.split(',').map(p => p.trim()).filter(p => p);
          } else if (permStr) {
            // Handle single permission string
            permissions = [permStr.trim()];
          } else {
            // Empty permissions
            permissions = [];
          }
        } catch (error) {
          console.error('Error parsing permissions for level', level.id, ':', error);
          permissions = [];
        }
        return {
          ...level,
          permissions
        };
      });

      res.json({
        success: true,
        data: levelsWithParsedPermissions
      });
    }

  } catch (error) {
    console.error('Manage user levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Kelola status absensi
const manageAttendanceStatuses = async (req, res) => {
  try {
    const { action, id, code, name, description, color, is_active } = req.body;

    if (action === 'create') {
      const [result] = await pool.execute(
        'INSERT INTO attendance_statuses (code, name, description, color, is_active) VALUES (?, ?, ?, ?, ?)',
        [code, name, description, color, is_active !== false]
      );

      res.json({
        success: true,
        message: 'Status absensi berhasil dibuat',
        data: { id: result.insertId }
      });

    } else if (action === 'update') {
      await pool.execute(
        'UPDATE attendance_statuses SET code = ?, name = ?, description = ?, color = ?, is_active = ? WHERE id = ?',
        [code, name, description, color, is_active !== false, id]
      );

      res.json({
        success: true,
        message: 'Status absensi berhasil diupdate'
      });

    } else if (action === 'delete') {
      await pool.execute('DELETE FROM attendance_statuses WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Status absensi berhasil dihapus'
      });

    } else if (action === 'list') {
      const [statuses] = await pool.execute(
        'SELECT * FROM attendance_statuses ORDER BY name'
      );

      res.json({
        success: true,
        data: statuses
      });
    }

  } catch (error) {
    console.error('Manage attendance statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Import Excel untuk data massal
const importExcelData = async (req, res) => {
  try {
    const { file_data, data_type } = req.body;

    if (!file_data || !data_type) {
      return res.status(400).json({
        success: false,
        message: 'File data dan tipe data diperlukan'
      });
    }

    // Parse Excel data
    const workbook = XLSX.read(file_data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File Excel kosong atau tidak valid'
      });
    }

    const results = [];
    const errors = [];

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        try {
          if (data_type === 'siswa') {
            // Import data siswa
            const hashedPassword = await bcrypt.hash(row.password || 'password123', 10);
            
            // Insert user
            const [userResult] = await connection.execute(
              'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
              [row.username, row.email, hashedPassword, 'siswa', row.full_name, row.phone || null]
            );

            // Insert siswa
            await connection.execute(
              'INSERT INTO siswa (user_id, nis, nisn, kelas_id, barcode_id, tanggal_lahir, alamat, nama_ortu, phone_ortu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userResult.insertId, row.nis, row.nisn || null, row.kelas_id, row.barcode_id, row.tanggal_lahir || null, row.alamat || null, row.nama_ortu || null, row.phone_ortu || null]
            );

            results.push({
              row: i + 1,
              username: row.username,
              nama: row.full_name,
              nis: row.nis
            });

          } else if (data_type === 'guru') {
            // Import data guru
            const hashedPassword = await bcrypt.hash(row.password || 'password123', 10);
            
            // Insert user
            const [userResult] = await connection.execute(
              'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
              [row.username, row.email, hashedPassword, 'guru', row.full_name, row.phone || null]
            );

            // Insert guru
            await connection.execute(
              'INSERT INTO guru (user_id, nip, mata_pelajaran_id) VALUES (?, ?, ?)',
              [userResult.insertId, row.nip, row.mata_pelajaran_id || null]
            );

            results.push({
              row: i + 1,
              username: row.username,
              nama: row.full_name,
              nip: row.nip
            });

          } else if (data_type === 'kelas') {
            // Import data kelas
            const [result] = await connection.execute(
              'INSERT INTO kelas (nama_kelas, tingkat, wali_kelas_id) VALUES (?, ?, ?)',
              [row.nama_kelas, row.tingkat, row.wali_kelas_id || null]
            );

            results.push({
              row: i + 1,
              nama_kelas: row.nama_kelas,
              tingkat: row.tingkat
            });
          }

        } catch (rowError) {
          errors.push({
            row: i + 1,
            error: rowError.message,
            data: row
          });
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `Berhasil mengimport ${results.length} data ${data_type}`,
        data: {
          success: results,
          errors: errors
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Import Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Export data ke Excel
const exportDataToExcel = async (req, res) => {
  try {
    const { data_type, start_date, end_date } = req.query;

    let query = '';
    let filename = '';
    let sheetName = '';

    if (data_type === 'siswa') {
      query = `
        SELECT 
          s.nis,
          s.nisn,
          s.barcode_id,
          u.full_name,
          u.email,
          u.phone,
          k.nama_kelas,
          k.tingkat,
          s.tanggal_lahir,
          s.alamat,
          s.nama_ortu,
          s.phone_ortu,
          u.is_active,
          u.created_at
        FROM siswa s
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        ORDER BY k.nama_kelas, u.full_name
      `;
      filename = 'data_siswa.xlsx';
      sheetName = 'Data Siswa';

    } else if (data_type === 'guru') {
      query = `
        SELECT 
          g.nip,
          u.full_name,
          u.email,
          u.phone,
          mp.nama_pelajaran,
          u.is_active,
          u.created_at
        FROM guru g
        JOIN users u ON g.user_id = u.id
        LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
        ORDER BY u.full_name
      `;
      filename = 'data_guru.xlsx';
      sheetName = 'Data Guru';

    } else if (data_type === 'absensi') {
      query = `
        SELECT 
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
          abs.tanggal,
          abs.jam_masuk,
          abs.jam_pulang,
          abs.status_masuk,
          abs.status_pulang,
          abs.latitude,
          abs.longitude
        FROM absensi_sekolah abs
        JOIN siswa s ON abs.siswa_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        ${start_date && end_date ? 'WHERE abs.tanggal BETWEEN ? AND ?' : ''}
        ORDER BY abs.tanggal DESC, u.full_name
      `;
      filename = `absensi_${start_date || 'all'}_${end_date || 'data'}.xlsx`;
      sheetName = 'Data Absensi';
    }

    const params = [];
    if (start_date && end_date) {
      params.push(start_date, end_date);
    }

    const [results] = await pool.execute(query, params);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data untuk diexport'
      });
    }

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers untuk download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getSuperDashboard,
  manageAttendanceLocations,
  manageAttendanceSchedules,
  manageUserLevels,
  manageAttendanceStatuses,
  importExcelData,
  exportDataToExcel
};