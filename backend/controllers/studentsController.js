const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all students
const getStudents = async (req, res) => {
  try {
    const { kelas_id, search } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.nis,
        s.nisn,
        s.alamat,
        s.tanggal_lahir,
        s.nama_ortu,
        s.phone_ortu,
        s.barcode_id,
        s.created_at,
        u.full_name,
        u.email,
        u.phone,
        k.nama_kelas,
        s.kelas_id
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (kelas_id) {
      conditions.push('s.kelas_id = ?');
      params.push(kelas_id);
    }
    
    if (search) {
      conditions.push('(u.full_name LIKE ? OR s.nis LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY u.full_name ASC';
    
    const [students] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data siswa'
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [students] = await pool.execute(`
      SELECT 
        s.*,
        u.full_name,
        u.email,
        u.phone,
        u.username,
        k.nama_kelas
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      WHERE s.id = ?
    `, [id]);
    
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
      message: 'Gagal mengambil data siswa'
    });
  }
};

// Create new student
const createStudent = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      full_name,
      email,
      phone,
      username,
      password,
      nis,
      kelas_id,
      jenis_kelamin,
      alamat,
      tanggal_lahir
    } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user first
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, full_name, phone, 'siswa']
    );
    
    const userId = userResult.insertId;
    
    // Create student
    await connection.execute(
      'INSERT INTO siswa (user_id, nis, kelas_id, jenis_kelamin, alamat, tanggal_lahir) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, nis, kelas_id, jenis_kelamin, alamat, tanggal_lahir]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Siswa berhasil dibuat'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create student error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username, email, atau NIS sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat siswa'
    });
  } finally {
    connection.release();
  }
};

// Update student
const updateStudent = async (req, res) => {
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
      nis,
      kelas_id,
      jenis_kelamin,
      alamat,
      tanggal_lahir
    } = req.body;
    
    // Get student's user_id
    const [students] = await connection.execute('SELECT user_id FROM siswa WHERE id = ?', [id]);
    
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }
    
    const userId = students[0].user_id;
    
    // Update user
    let updateUserQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, phone = ? WHERE id = ?';
    let updateUserParams = [username, email, full_name, phone, userId];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUserQuery = 'UPDATE users SET username = ?, password = ?, email = ?, full_name = ?, phone = ? WHERE id = ?';
      updateUserParams = [username, hashedPassword, email, full_name, phone, userId];
    }
    
    await connection.execute(updateUserQuery, updateUserParams);
    
    // Update student
    await connection.execute(
      'UPDATE siswa SET nis = ?, kelas_id = ?, jenis_kelamin = ?, alamat = ?, tanggal_lahir = ? WHERE id = ?',
      [nis, kelas_id, jenis_kelamin, alamat, tanggal_lahir, id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Siswa berhasil diperbarui'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update student error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username, email, atau NIS sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui siswa'
    });
  } finally {
    connection.release();
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get student's user_id
    const [students] = await connection.execute('SELECT user_id FROM siswa WHERE id = ?', [id]);
    
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }
    
    const userId = students[0].user_id;
    
    // Delete student (this will cascade delete attendance records if foreign key is set)
    await connection.execute('DELETE FROM siswa WHERE id = ?', [id]);
    
    // Delete user
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Siswa berhasil dihapus'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus siswa'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};