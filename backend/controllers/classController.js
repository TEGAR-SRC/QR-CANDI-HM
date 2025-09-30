const { pool } = require('../config/database');

// Get semua kelas
const getAllClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tingkat } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE k.nama_kelas LIKE ?';
      params.push(`%${search}%`);
    }

    if (tingkat) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'k.tingkat = ?';
      params.push(tingkat);
    }

    const query = `
      SELECT 
        k.id,
        k.nama_kelas,
        k.tingkat,
        k.created_at,
        u.full_name as wali_kelas,
        u.phone as phone_wali_kelas,
        COUNT(s.id) as jumlah_siswa
      FROM kelas k
      LEFT JOIN users u ON k.wali_kelas_id = u.id
      LEFT JOIN siswa s ON k.id = s.kelas_id
      ${whereClause}
      GROUP BY k.id, k.nama_kelas, k.tingkat, k.created_at, u.full_name, u.phone
      ORDER BY k.tingkat, k.nama_kelas
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM kelas k
      ${whereClause}
    `;

    const [classes] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        classes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get kelas by ID
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const [classes] = await pool.execute(
      `SELECT 
        k.*,
        u.full_name as wali_kelas,
        u.phone as phone_wali_kelas,
        u.email as email_wali_kelas
      FROM kelas k
      LEFT JOIN users u ON k.wali_kelas_id = u.id
      WHERE k.id = ?`,
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }

    // Get daftar siswa di kelas ini
    const [students] = await pool.execute(
      `SELECT 
        s.id,
        s.nis,
        s.nisn,
        s.barcode_id,
        u.full_name,
        u.email,
        u.phone,
        u.is_active
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE s.kelas_id = ?
      ORDER BY u.full_name`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...classes[0],
        students
      }
    });

  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create kelas baru
const createClass = async (req, res) => {
  try {
    const { nama_kelas, tingkat, wali_kelas_id } = req.body;

    if (!nama_kelas || !tingkat) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas dan tingkat harus diisi'
      });
    }

    // Cek apakah nama kelas sudah ada
    const [existingClasses] = await pool.execute(
      'SELECT id FROM kelas WHERE nama_kelas = ? AND tingkat = ?',
      [nama_kelas, tingkat]
    );

    if (existingClasses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelas dengan nama dan tingkat yang sama sudah ada'
      });
    }

    // Jika ada wali kelas, cek apakah user tersebut adalah guru
    if (wali_kelas_id) {
      const [waliKelas] = await pool.execute(
        'SELECT u.role FROM users u WHERE u.id = ?',
        [wali_kelas_id]
      );

      if (waliKelas.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wali kelas tidak ditemukan'
        });
      }

      if (waliKelas[0].role !== 'guru') {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas harus memiliki role guru'
        });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO kelas (nama_kelas, tingkat, wali_kelas_id) VALUES (?, ?, ?)',
      [nama_kelas, tingkat, wali_kelas_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Kelas berhasil dibuat',
      data: {
        id: result.insertId,
        nama_kelas,
        tingkat,
        wali_kelas_id
      }
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update kelas
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, tingkat, wali_kelas_id } = req.body;

    // Cek apakah kelas ada
    const [classes] = await pool.execute(
      'SELECT * FROM kelas WHERE id = ?',
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }

    // Cek apakah nama kelas dan tingkat sudah ada (kecuali kelas yang sama)
    if (nama_kelas && tingkat) {
      const [existingClasses] = await pool.execute(
        'SELECT id FROM kelas WHERE nama_kelas = ? AND tingkat = ? AND id != ?',
        [nama_kelas, tingkat, id]
      );

      if (existingClasses.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kelas dengan nama dan tingkat yang sama sudah ada'
        });
      }
    }

    // Jika ada wali kelas, cek apakah user tersebut adalah guru
    if (wali_kelas_id) {
      const [waliKelas] = await pool.execute(
        'SELECT u.role FROM users u WHERE u.id = ?',
        [wali_kelas_id]
      );

      if (waliKelas.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wali kelas tidak ditemukan'
        });
      }

      if (waliKelas[0].role !== 'guru') {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas harus memiliki role guru'
        });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (nama_kelas) {
      updateFields.push('nama_kelas = ?');
      updateValues.push(nama_kelas);
    }

    if (tingkat) {
      updateFields.push('tingkat = ?');
      updateValues.push(tingkat);
    }

    if (wali_kelas_id !== undefined) {
      updateFields.push('wali_kelas_id = ?');
      updateValues.push(wali_kelas_id || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE kelas SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Kelas berhasil diupdate'
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete kelas
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah kelas ada
    const [classes] = await pool.execute(
      'SELECT * FROM kelas WHERE id = ?',
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }

    // Cek apakah ada siswa di kelas ini
    const [students] = await pool.execute(
      'SELECT COUNT(*) as count FROM siswa WHERE kelas_id = ?',
      [id]
    );

    if (students[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus kelas yang masih memiliki siswa'
      });
    }

    // Cek apakah ada jadwal pelajaran di kelas ini
    const [schedules] = await pool.execute(
      'SELECT COUNT(*) as count FROM jadwal_pelajaran WHERE kelas_id = ?',
      [id]
    );

    if (schedules[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus kelas yang masih memiliki jadwal pelajaran'
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
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get jadwal pelajaran kelas
const getClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const [schedules] = await pool.execute(
      `SELECT 
        jp.id,
        jp.hari,
        jp.jam_mulai,
        jp.jam_selesai,
        mp.nama_pelajaran,
        mp.kode_pelajaran,
        u.full_name as nama_guru,
        g.nip
      FROM jadwal_pelajaran jp
      JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
      JOIN guru g ON jp.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE jp.kelas_id = ?
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
      data: schedules
    });

  } catch (error) {
    console.error('Get class schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassSchedule
};