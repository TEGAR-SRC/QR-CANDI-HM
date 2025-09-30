const { pool } = require('../config/database');

// Get semua data sekolah untuk operator
const getSchoolData = async (req, res) => {
  try {
    const [totalSiswa] = await pool.execute('SELECT COUNT(*) as count FROM siswa');
    const [totalGuru] = await pool.execute('SELECT COUNT(*) as count FROM guru');
    const [totalKelas] = await pool.execute('SELECT COUNT(*) as count FROM kelas');
    const [totalOrangTua] = await pool.execute('SELECT COUNT(*) as count FROM orang_tua');

    const [absensiHariIni] = await pool.execute(
      'SELECT COUNT(*) as count FROM absensi_sekolah WHERE tanggal = CURDATE()'
    );

    const [absensiBulanIni] = await pool.execute(
      'SELECT COUNT(*) as count FROM absensi_sekolah WHERE MONTH(tanggal) = MONTH(CURDATE()) AND YEAR(tanggal) = YEAR(CURDATE())'
    );

    res.json({
      success: true,
      data: {
        total_siswa: totalSiswa[0].count,
        total_guru: totalGuru[0].count,
        total_kelas: totalKelas[0].count,
        total_orang_tua: totalOrangTua[0].count,
        absensi_hari_ini: absensiHariIni[0].count,
        absensi_bulan_ini: absensiBulanIni[0].count
      }
    });

  } catch (error) {
    console.error('Get school data error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get konfigurasi sekolah
const getSchoolConfig = async (req, res) => {
  try {
    const [configs] = await pool.execute(
      'SELECT config_key, config_value, description FROM system_config ORDER BY config_key'
    );

    const config = {};
    configs.forEach(item => {
      config[item.config_key] = {
        value: item.config_value,
        description: item.description
      };
    });

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get school config error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update konfigurasi sekolah
const updateSchoolConfig = async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Data konfigurasi tidak valid'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(configs)) {
        await connection.execute(
          'UPDATE system_config SET config_value = ? WHERE config_key = ?',
          [value, key]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Konfigurasi sekolah berhasil diupdate'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update school config error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Bulk create users
const bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data users tidak valid'
      });
    }

    const bcrypt = require('bcryptjs');
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const results = [];
      const errors = [];

      for (const userData of users) {
        try {
          const { username, email, password, role, full_name, phone, additional_data } = userData;

          if (!username || !email || !password || !role || !full_name) {
            errors.push({
              username: username || 'N/A',
              error: 'Field wajib tidak lengkap'
            });
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert user
          const [userResult] = await connection.execute(
            'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, full_name, phone || null]
          );

          const userId = userResult.insertId;

          // Insert additional data based on role
          if (role === 'siswa' && additional_data) {
            const { nis, nisn, kelas_id, barcode_id, tanggal_lahir, alamat, nama_ortu, phone_ortu } = additional_data;
            
            await connection.execute(
              'INSERT INTO siswa (user_id, nis, nisn, kelas_id, barcode_id, tanggal_lahir, alamat, nama_ortu, phone_ortu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userId, nis, nisn || null, kelas_id, barcode_id, tanggal_lahir || null, alamat || null, nama_ortu || null, phone_ortu || null]
            );
          } else if (role === 'guru' && additional_data) {
            const { nip, mata_pelajaran_id } = additional_data;
            
            await connection.execute(
              'INSERT INTO guru (user_id, nip, mata_pelajaran_id) VALUES (?, ?, ?)',
              [userId, nip, mata_pelajaran_id || null]
            );
          } else if (role === 'orang_tua' && additional_data) {
            const { siswa_id, hubungan, pekerjaan, alamat } = additional_data;
            
            await connection.execute(
              'INSERT INTO orang_tua (user_id, siswa_id, hubungan, pekerjaan, alamat) VALUES (?, ?, ?, ?, ?)',
              [userId, siswa_id, hubungan, pekerjaan || null, alamat || null]
            );
          }

          results.push({
            username,
            full_name,
            role,
            user_id: userId
          });

        } catch (userError) {
          errors.push({
            username: userData.username || 'N/A',
            error: userError.message
          });
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `Berhasil membuat ${results.length} user`,
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
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get all users for management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'u.role = ?';
      params.push(role);
    }

    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.role,
        u.is_active,
        u.created_at,
        CASE 
          WHEN u.role = 'siswa' THEN s.nis
          WHEN u.role = 'guru' THEN g.nip
          ELSE NULL
        END as identifier
      FROM users u
      LEFT JOIN siswa s ON u.id = s.user_id
      LEFT JOIN guru g ON u.id = g.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const [users] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getSchoolData,
  getSchoolConfig,
  updateSchoolConfig,
  bulkCreateUsers,
  getAllUsers
};