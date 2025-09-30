const { pool } = require('../config/database');

// Get all subjects
const getSubjects = async (req, res) => {
  try {
    const { tingkat, search } = req.query;
    
    let query = `
      SELECT 
        mp.id,
        mp.nama_pelajaran,
        mp.kode_pelajaran,
        mp.created_at
      FROM mata_pelajaran mp
    `;
    
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push('(mp.nama_pelajaran LIKE ? OR mp.kode_pelajaran LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY mp.nama_pelajaran ASC';
    
    const [subjects] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mata pelajaran'
    });
  }
};

// Get subject by ID
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [subjects] = await pool.execute(`
      SELECT 
        mp.*,
        u.full_name as guru_pengampu
      FROM mata_pelajaran mp
      LEFT JOIN guru g ON mp.guru_id = g.id
      LEFT JOIN users u ON g.user_id = u.id
      WHERE mp.id = ?
    `, [id]);
    
    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: subjects[0]
    });
  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mata pelajaran'
    });
  }
};

// Create new subject
const createSubject = async (req, res) => {
  try {
    const {
      nama_mata_pelajaran,
      kode_mata_pelajaran,
      deskripsi,
      sks,
      tingkat,
      semester,
      guru_id
    } = req.body;
    
    // Check if guru exists
    if (guru_id) {
      const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
      if (guru.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }
    }
    
    await pool.execute(
      'INSERT INTO mata_pelajaran (nama_mata_pelajaran, kode_mata_pelajaran, deskripsi, sks, tingkat, semester, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama_mata_pelajaran, kode_mata_pelajaran, deskripsi, sks, tingkat, semester, guru_id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Mata pelajaran berhasil dibuat'
    });
  } catch (error) {
    console.error('Create subject error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Kode mata pelajaran sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat mata pelajaran'
    });
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_mata_pelajaran,
      kode_mata_pelajaran,
      deskripsi,
      sks,
      tingkat,
      semester,
      guru_id
    } = req.body;
    
    // Check if subject exists
    const [existingSubject] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [id]);
    if (existingSubject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }
    
    // Check if guru exists
    if (guru_id) {
      const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
      if (guru.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }
    }
    
    await pool.execute(
      'UPDATE mata_pelajaran SET nama_mata_pelajaran = ?, kode_mata_pelajaran = ?, deskripsi = ?, sks = ?, tingkat = ?, semester = ?, guru_id = ? WHERE id = ?',
      [nama_mata_pelajaran, kode_mata_pelajaran, deskripsi, sks, tingkat, semester, guru_id, id]
    );
    
    res.json({
      success: true,
      message: 'Mata pelajaran berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update subject error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Kode mata pelajaran sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui mata pelajaran'
    });
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject exists
    const [existingSubject] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [id]);
    if (existingSubject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }
    
    // Check if subject is used in jadwal
    const [jadwal] = await pool.execute('SELECT COUNT(*) as count FROM jadwal WHERE mata_pelajaran_id = ?', [id]);
    if (jadwal[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus mata pelajaran yang masih digunakan dalam jadwal'
      });
    }
    
    await pool.execute('DELETE FROM mata_pelajaran WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Mata pelajaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus mata pelajaran'
    });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};