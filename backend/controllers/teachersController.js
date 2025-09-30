const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        g.id,
        g.nip,
        g.mata_pelajaran_id,
        g.created_at,
        u.full_name,
        u.email,
        u.phone,
        mp.nama_pelajaran as mata_pelajaran
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
    `;
    
    const params = [];
    
    if (search) {
      query += ' WHERE (u.full_name LIKE ? OR g.nip LIKE ? OR u.email LIKE ? OR mp.nama_pelajaran LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY u.full_name ASC';
    
    const [teachers] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data guru'
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [teachers] = await pool.execute(`
      SELECT 
        g.*,
        u.full_name,
        u.email,
        u.phone,
        u.username
      FROM guru g
      JOIN users u ON g.user_id = u.id
      WHERE g.id = ?
    `, [id]);
    
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: teachers[0]
    });
  } catch (error) {
    console.error('Get teacher by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data guru'
    });
  }
};

// Create new teacher
const createTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      full_name,
      email,
      phone,
      username,
      password,
      nip,
      mata_pelajaran,
      jenis_kelamin,
      alamat,
      tanggal_lahir
    } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user first
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, full_name, phone, 'guru']
    );
    
    const userId = userResult.insertId;
    
    // Create teacher
    await connection.execute(
      'INSERT INTO guru (user_id, nip, mata_pelajaran, jenis_kelamin, alamat, tanggal_lahir) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, nip, mata_pelajaran, jenis_kelamin, alamat, tanggal_lahir]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Guru berhasil dibuat'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create teacher error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username, email, atau NIP sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat guru'
    });
  } finally {
    connection.release();
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      username,
      password,
      nip,
      mata_pelajaran,
      jenis_kelamin,
      alamat,
      tanggal_lahir
    } = req.body;
    
    // Get teacher's user_id
    const [teachers] = await connection.execute('SELECT user_id FROM guru WHERE id = ?', [id]);
    
    if (teachers.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }
    
    const userId = teachers[0].user_id;
    
    // Update user
    let updateUserQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, phone = ? WHERE id = ?';
    let updateUserParams = [username, email, full_name, phone, userId];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUserQuery = 'UPDATE users SET username = ?, password = ?, email = ?, full_name = ?, phone = ? WHERE id = ?';
      updateUserParams = [username, hashedPassword, email, full_name, phone, userId];
    }
    
    await connection.execute(updateUserQuery, updateUserParams);
    
    // Update teacher
    await connection.execute(
      'UPDATE guru SET nip = ?, mata_pelajaran = ?, jenis_kelamin = ?, alamat = ?, tanggal_lahir = ? WHERE id = ?',
      [nip, mata_pelajaran, jenis_kelamin, alamat, tanggal_lahir, id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Guru berhasil diperbarui'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update teacher error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username, email, atau NIP sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui guru'
    });
  } finally {
    connection.release();
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get teacher's user_id
    const [teachers] = await connection.execute('SELECT user_id FROM guru WHERE id = ?', [id]);
    
    if (teachers.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }
    
    const userId = teachers[0].user_id;
    
    // Delete teacher
    await connection.execute('DELETE FROM guru WHERE id = ?', [id]);
    
    // Delete user
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Guru berhasil dihapus'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus guru'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};