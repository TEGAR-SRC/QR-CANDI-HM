const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get semua guru
const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, mata_pelajaran_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (u.full_name LIKE ? OR g.nip LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (mata_pelajaran_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'g.mata_pelajaran_id = ?';
      params.push(mata_pelajaran_id);
    }

    const query = `
      SELECT 
        g.id,
        g.nip,
        g.created_at,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.is_active,
        mp.nama_pelajaran,
        mp.kode_pelajaran,
        COUNT(DISTINCT jp.kelas_id) as jumlah_kelas
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
      LEFT JOIN jadwal_pelajaran jp ON g.id = jp.guru_id
      ${whereClause}
      GROUP BY g.id, g.nip, g.created_at, u.username, u.email, u.full_name, u.phone, u.is_active, mp.nama_pelajaran, mp.kode_pelajaran
      ORDER BY u.full_name
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM guru g
      JOIN users u ON g.user_id = u.id
      ${whereClause}
    `;

    const [teachers] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        teachers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get guru by ID
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const [teachers] = await pool.execute(
      `SELECT 
        g.*,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.is_active,
        mp.nama_pelajaran,
        mp.kode_pelajaran
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
      WHERE g.id = ?`,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }

    // Get jadwal mengajar guru
    const [schedules] = await pool.execute(
      `SELECT 
        jp.id,
        jp.hari,
        jp.jam_mulai,
        jp.jam_selesai,
        k.nama_kelas,
        k.tingkat,
        mp.nama_pelajaran
      FROM jadwal_pelajaran jp
      JOIN kelas k ON jp.kelas_id = k.id
      JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
      WHERE jp.guru_id = ?
      ORDER BY 
        CASE jp.hari 
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
        END,
        jp.jam_mulai`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...teachers[0],
        schedules
      }
    });

  } catch (error) {
    console.error('Get teacher by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create guru baru
const createTeacher = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      phone,
      nip,
      mata_pelajaran_id
    } = req.body;

    if (!username || !email || !password || !full_name || !nip) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib harus diisi'
      });
    }

    // Cek apakah username atau email sudah ada
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah digunakan'
      });
    }

    // Cek apakah NIP sudah ada
    const [existingTeachers] = await pool.execute(
      'SELECT id FROM guru WHERE nip = ?',
      [nip]
    );

    if (existingTeachers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIP sudah digunakan'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, 'guru', full_name, phone || null]
      );

      const userId = userResult.insertId;

      // Insert guru
      await connection.execute(
        'INSERT INTO guru (user_id, nip, mata_pelajaran_id) VALUES (?, ?, ?)',
        [userId, nip, mata_pelajaran_id || null]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Guru berhasil didaftarkan',
        data: {
          user_id: userId,
          nip,
          full_name
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update guru
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      email,
      nip,
      mata_pelajaran_id,
      is_active
    } = req.body;

    // Cek apakah guru ada
    const [teachers] = await pool.execute(
      'SELECT g.*, u.id as user_id FROM guru g JOIN users u ON g.user_id = u.id WHERE g.id = ?',
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }

    const guru = teachers[0];

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user data
      const userUpdateFields = [];
      const userUpdateValues = [];

      if (full_name) {
        userUpdateFields.push('full_name = ?');
        userUpdateValues.push(full_name);
      }

      if (phone) {
        userUpdateFields.push('phone = ?');
        userUpdateValues.push(phone);
      }

      if (email) {
        // Cek apakah email sudah digunakan user lain
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, guru.user_id]
        );

        if (existingUsers.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Email sudah digunakan'
          });
        }

        userUpdateFields.push('email = ?');
        userUpdateValues.push(email);
      }

      if (is_active !== undefined) {
        userUpdateFields.push('is_active = ?');
        userUpdateValues.push(is_active);
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(guru.user_id);
        await connection.execute(
          `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = ?`,
          userUpdateValues
        );
      }

      // Update guru data
      const guruUpdateFields = [];
      const guruUpdateValues = [];

      if (nip) {
        // Cek apakah NIP sudah digunakan guru lain
        const [existingTeachers] = await connection.execute(
          'SELECT id FROM guru WHERE nip = ? AND id != ?',
          [nip, id]
        );

        if (existingTeachers.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'NIP sudah digunakan'
          });
        }

        guruUpdateFields.push('nip = ?');
        guruUpdateValues.push(nip);
      }

      if (mata_pelajaran_id !== undefined) {
        guruUpdateFields.push('mata_pelajaran_id = ?');
        guruUpdateValues.push(mata_pelajaran_id || null);
      }

      if (guruUpdateFields.length > 0) {
        guruUpdateValues.push(id);
        await connection.execute(
          `UPDATE guru SET ${guruUpdateFields.join(', ')} WHERE id = ?`,
          guruUpdateValues
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Data guru berhasil diupdate'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete guru
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah guru ada
    const [teachers] = await pool.execute(
      'SELECT g.*, u.id as user_id FROM guru g JOIN users u ON g.user_id = u.id WHERE g.id = ?',
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }

    const guru = teachers[0];

    // Cek apakah guru masih memiliki jadwal mengajar
    const [schedules] = await pool.execute(
      'SELECT COUNT(*) as count FROM jadwal_pelajaran WHERE guru_id = ?',
      [id]
    );

    if (schedules[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus guru yang masih memiliki jadwal mengajar'
      });
    }

    // Cek apakah guru adalah wali kelas
    const [waliKelas] = await pool.execute(
      'SELECT COUNT(*) as count FROM kelas WHERE wali_kelas_id = ?',
      [guru.user_id]
    );

    if (waliKelas[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus guru yang masih menjadi wali kelas'
      });
    }

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete guru
      await connection.execute('DELETE FROM guru WHERE id = ?', [id]);

      // Delete user
      await connection.execute('DELETE FROM users WHERE id = ?', [guru.user_id]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Guru berhasil dihapus'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};