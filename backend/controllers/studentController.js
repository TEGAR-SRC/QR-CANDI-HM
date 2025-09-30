const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get semua siswa
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, kelas_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (u.full_name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (kelas_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 's.kelas_id = ?';
      params.push(kelas_id);
    }

    const query = `
      SELECT 
        s.id,
        s.nis,
        s.nisn,
        s.barcode_id,
        s.tanggal_lahir,
        s.alamat,
        s.nama_ortu,
        s.phone_ortu,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.is_active,
        k.nama_kelas,
        k.tingkat,
        s.created_at
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      ${whereClause}
      ORDER BY k.nama_kelas, u.full_name
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      ${whereClause}
    `;

    const [students] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get siswa by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await pool.execute(
      `SELECT 
        s.*,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.is_active,
        k.nama_kelas,
        k.tingkat
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      WHERE s.id = ?`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: students[0]
    });

  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create siswa baru
const createStudent = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      phone,
      nis,
      nisn,
      kelas_id,
      barcode_id,
      tanggal_lahir,
      alamat,
      nama_ortu,
      phone_ortu
    } = req.body;

    if (!username || !email || !password || !full_name || !nis || !kelas_id || !barcode_id) {
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

    // Cek apakah NIS atau barcode_id sudah ada
    const [existingStudents] = await pool.execute(
      'SELECT id FROM siswa WHERE nis = ? OR barcode_id = ?',
      [nis, barcode_id]
    );

    if (existingStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIS atau Barcode ID sudah digunakan'
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
        [username, email, hashedPassword, 'siswa', full_name, phone || null]
      );

      const userId = userResult.insertId;

      // Insert siswa
      await connection.execute(
        'INSERT INTO siswa (user_id, nis, nisn, kelas_id, barcode_id, tanggal_lahir, alamat, nama_ortu, phone_ortu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, nis, nisn || null, kelas_id, barcode_id, tanggal_lahir || null, alamat || null, nama_ortu || null, phone_ortu || null]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Siswa berhasil didaftarkan',
        data: {
          user_id: userId,
          nis,
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
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update siswa
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      email,
      nis,
      nisn,
      kelas_id,
      barcode_id,
      tanggal_lahir,
      alamat,
      nama_ortu,
      phone_ortu,
      is_active
    } = req.body;

    // Cek apakah siswa ada
    const [students] = await pool.execute(
      'SELECT s.*, u.id as user_id FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    const siswa = students[0];

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
          [email, siswa.user_id]
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
        userUpdateValues.push(siswa.user_id);
        await connection.execute(
          `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = ?`,
          userUpdateValues
        );
      }

      // Update siswa data
      const siswaUpdateFields = [];
      const siswaUpdateValues = [];

      if (nis) {
        // Cek apakah NIS sudah digunakan siswa lain
        const [existingStudents] = await connection.execute(
          'SELECT id FROM siswa WHERE nis = ? AND id != ?',
          [nis, id]
        );

        if (existingStudents.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'NIS sudah digunakan'
          });
        }

        siswaUpdateFields.push('nis = ?');
        siswaUpdateValues.push(nis);
      }

      if (nisn) {
        siswaUpdateFields.push('nisn = ?');
        siswaUpdateValues.push(nisn);
      }

      if (kelas_id) {
        siswaUpdateFields.push('kelas_id = ?');
        siswaUpdateValues.push(kelas_id);
      }

      if (barcode_id) {
        // Cek apakah barcode_id sudah digunakan siswa lain
        const [existingStudents] = await connection.execute(
          'SELECT id FROM siswa WHERE barcode_id = ? AND id != ?',
          [barcode_id, id]
        );

        if (existingStudents.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Barcode ID sudah digunakan'
          });
        }

        siswaUpdateFields.push('barcode_id = ?');
        siswaUpdateValues.push(barcode_id);
      }

      if (tanggal_lahir) {
        siswaUpdateFields.push('tanggal_lahir = ?');
        siswaUpdateValues.push(tanggal_lahir);
      }

      if (alamat) {
        siswaUpdateFields.push('alamat = ?');
        siswaUpdateValues.push(alamat);
      }

      if (nama_ortu) {
        siswaUpdateFields.push('nama_ortu = ?');
        siswaUpdateValues.push(nama_ortu);
      }

      if (phone_ortu) {
        siswaUpdateFields.push('phone_ortu = ?');
        siswaUpdateValues.push(phone_ortu);
      }

      if (siswaUpdateFields.length > 0) {
        siswaUpdateValues.push(id);
        await connection.execute(
          `UPDATE siswa SET ${siswaUpdateFields.join(', ')} WHERE id = ?`,
          siswaUpdateValues
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Data siswa berhasil diupdate'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete siswa
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah siswa ada
    const [students] = await pool.execute(
      'SELECT s.*, u.id as user_id FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    const siswa = students[0];

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete absensi terkait
      await connection.execute('DELETE FROM absensi_sekolah WHERE siswa_id = ?', [id]);
      await connection.execute('DELETE FROM absensi_kelas WHERE siswa_id = ?', [id]);
      await connection.execute('DELETE FROM whatsapp_notifications WHERE siswa_id = ?', [id]);

      // Delete siswa
      await connection.execute('DELETE FROM siswa WHERE id = ?', [id]);

      // Delete user
      await connection.execute('DELETE FROM users WHERE id = ?', [siswa.user_id]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Siswa berhasil dihapus'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};