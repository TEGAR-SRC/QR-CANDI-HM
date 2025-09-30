const { pool } = require('../config/database');

// Get all classes
const getClasses = async (req, res) => {
  try {
    const { tingkat, search } = req.query;
    
    let query = `
      SELECT 
        k.id,
        k.nama_kelas,
        k.tingkat,
        k.wali_kelas_id,
        k.created_at,
        u.full_name as wali_kelas_nama,
        COUNT(s.id) as jumlah_siswa
      FROM kelas k
      LEFT JOIN users u ON k.wali_kelas_id = u.id
      LEFT JOIN siswa s ON k.id = s.kelas_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (tingkat) {
      conditions.push('k.tingkat = ?');
      params.push(tingkat);
    }
    
    if (search) {
      conditions.push('(k.nama_kelas LIKE ? OR u.full_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY k.id, k.nama_kelas, k.tingkat, k.wali_kelas_id, k.created_at, u.full_name';
    query += ' ORDER BY k.tingkat ASC, k.nama_kelas ASC';
    
    const [classes] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kelas'
    });
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [classes] = await pool.execute(`
      SELECT 
        k.*,
        u.full_name as wali_kelas_nama,
        COUNT(s.id) as jumlah_siswa
      FROM kelas k
      LEFT JOIN guru g ON k.wali_kelas_id = g.id
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN siswa s ON k.id = s.kelas_id
      WHERE k.id = ?
      GROUP BY k.id, k.nama_kelas, k.tingkat, k.jurusan, k.tahun_ajaran, k.wali_kelas_id, k.created_at, u.full_name
    `, [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: classes[0]
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kelas'
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const {
      nama_kelas,
      tingkat,
      jurusan,
      tahun_ajaran,
      wali_kelas_id
    } = req.body;
    
    // Check if wali_kelas exists
    if (wali_kelas_id) {
      const [waliKelas] = await pool.execute('SELECT id FROM guru WHERE id = ?', [wali_kelas_id]);
      if (waliKelas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas tidak ditemukan'
        });
      }
    }
    
    await pool.execute(
      'INSERT INTO kelas (nama_kelas, tingkat, jurusan, tahun_ajaran, wali_kelas_id) VALUES (?, ?, ?, ?, ?)',
      [nama_kelas, tingkat, jurusan, tahun_ajaran, wali_kelas_id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Kelas berhasil dibuat'
    });
  } catch (error) {
    console.error('Create class error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat kelas'
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_kelas,
      tingkat,
      jurusan,
      tahun_ajaran,
      wali_kelas_id
    } = req.body;
    
    // Check if class exists
    const [existingClass] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [id]);
    if (existingClass.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }
    
    // Check if wali_kelas exists
    if (wali_kelas_id) {
      const [waliKelas] = await pool.execute('SELECT id FROM guru WHERE id = ?', [wali_kelas_id]);
      if (waliKelas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas tidak ditemukan'
        });
      }
    }
    
    await pool.execute(
      'UPDATE kelas SET nama_kelas = ?, tingkat = ?, jurusan = ?, tahun_ajaran = ?, wali_kelas_id = ? WHERE id = ?',
      [nama_kelas, tingkat, jurusan, tahun_ajaran, wali_kelas_id, id]
    );
    
    res.json({
      success: true,
      message: 'Kelas berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update class error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kelas'
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if class exists
    const [existingClass] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [id]);
    if (existingClass.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }
    
    // Check if class has students
    const [students] = await pool.execute('SELECT COUNT(*) as count FROM siswa WHERE kelas_id = ?', [id]);
    if (students[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus kelas yang masih memiliki siswa'
      });
    }
    
    await pool.execute('DELETE FROM kelas WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Kelas berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus kelas'
    });
  }
};

// Get students in a class
const getStudentsInClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [students] = await pool.execute(`
      SELECT 
        s.id,
        s.nis,
        u.full_name,
        u.email,
        u.phone,
        s.jenis_kelamin,
        s.created_at
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE s.kelas_id = ?
      ORDER BY u.full_name ASC
    `, [id]);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get students in class error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data siswa dalam kelas'
    });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getStudentsInClass
};