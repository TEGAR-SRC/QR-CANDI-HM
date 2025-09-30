const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Cari user berdasarkan username atau email
    const [users] = await pool.execute(
      'SELECT id, username, email, password, role, full_name, phone, is_active FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const user = users[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Ambil data tambahan berdasarkan role
    let additionalData = {};
    
    if (user.role === 'siswa') {
      const [siswaData] = await pool.execute(
        'SELECT s.*, k.nama_kelas, k.tingkat FROM siswa s JOIN kelas k ON s.kelas_id = k.id WHERE s.user_id = ?',
        [user.id]
      );
      if (siswaData.length > 0) {
        additionalData = siswaData[0];
      }
    } else if (user.role === 'guru') {
      const [guruData] = await pool.execute(
        'SELECT g.*, mp.nama_pelajaran FROM guru g LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id WHERE g.user_id = ?',
        [user.id]
      );
      if (guruData.length > 0) {
        additionalData = guruData[0];
      }
    }

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone,
          ...additionalData
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Register user (hanya admin yang bisa)
const register = async (req, res) => {
  try {
    const { username, email, password, role, full_name, phone } = req.body;

    if (!username || !email || !password || !role || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, full_name, phone || null]
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: {
        id: result.insertId,
        username,
        email,
        role,
        full_name
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get profile user yang sedang login
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let profileData = { ...req.user };

    // Ambil data tambahan berdasarkan role
    if (role === 'siswa') {
      const [siswaData] = await pool.execute(
        'SELECT s.*, k.nama_kelas, k.tingkat FROM siswa s JOIN kelas k ON s.kelas_id = k.id WHERE s.user_id = ?',
        [userId]
      );
      if (siswaData.length > 0) {
        profileData = { ...profileData, ...siswaData[0] };
      }
    } else if (role === 'guru') {
      const [guruData] = await pool.execute(
        'SELECT g.*, mp.nama_pelajaran FROM guru g LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id WHERE g.user_id = ?',
        [userId]
      );
      if (guruData.length > 0) {
        profileData = { ...profileData, ...guruData[0] };
      }
    }

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update profile user
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, email } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }

    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (email) {
      // Cek apakah email sudah digunakan user lain
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Profile berhasil diupdate'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile
};