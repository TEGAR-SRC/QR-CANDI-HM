const { pool } = require('../config/database');

// Get semua mata pelajaran
const getAllSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (nama_pelajaran LIKE ? OR kode_pelajaran LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT 
        mp.*,
        COUNT(DISTINCT g.id) as jumlah_guru,
        COUNT(DISTINCT jp.id) as jumlah_jadwal
      FROM mata_pelajaran mp
      LEFT JOIN guru g ON mp.id = g.mata_pelajaran_id
      LEFT JOIN jadwal_pelajaran jp ON mp.id = jp.mata_pelajaran_id
      ${whereClause}
      GROUP BY mp.id, mp.nama_pelajaran, mp.kode_pelajaran, mp.created_at, mp.updated_at
      ORDER BY mp.nama_pelajaran
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM mata_pelajaran mp
      ${whereClause}
    `;

    const [subjects] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        subjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get mata pelajaran by ID
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [subjects] = await pool.execute(
      'SELECT * FROM mata_pelajaran WHERE id = ?',
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    // Get daftar guru yang mengajar mata pelajaran ini
    const [teachers] = await pool.execute(
      `SELECT 
        g.id,
        g.nip,
        u.full_name,
        u.email,
        u.phone
      FROM guru g
      JOIN users u ON g.user_id = u.id
      WHERE g.mata_pelajaran_id = ?
      ORDER BY u.full_name`,
      [id]
    );

    // Get jadwal pelajaran
    const [schedules] = await pool.execute(
      `SELECT 
        jp.id,
        jp.hari,
        jp.jam_mulai,
        jp.jam_selesai,
        k.nama_kelas,
        k.tingkat,
        u.full_name as nama_guru
      FROM jadwal_pelajaran jp
      JOIN kelas k ON jp.kelas_id = k.id
      JOIN guru g ON jp.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE jp.mata_pelajaran_id = ?
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
        ...subjects[0],
        teachers,
        schedules
      }
    });

  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create mata pelajaran baru
const createSubject = async (req, res) => {
  try {
    const { nama_pelajaran, kode_pelajaran } = req.body;

    if (!nama_pelajaran || !kode_pelajaran) {
      return res.status(400).json({
        success: false,
        message: 'Nama pelajaran dan kode pelajaran harus diisi'
      });
    }

    // Cek apakah kode pelajaran sudah ada
    const [existingSubjects] = await pool.execute(
      'SELECT id FROM mata_pelajaran WHERE kode_pelajaran = ?',
      [kode_pelajaran]
    );

    if (existingSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kode pelajaran sudah digunakan'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES (?, ?)',
      [nama_pelajaran, kode_pelajaran]
    );

    res.status(201).json({
      success: true,
      message: 'Mata pelajaran berhasil dibuat',
      data: {
        id: result.insertId,
        nama_pelajaran,
        kode_pelajaran
      }
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update mata pelajaran
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pelajaran, kode_pelajaran } = req.body;

    // Cek apakah mata pelajaran ada
    const [subjects] = await pool.execute(
      'SELECT * FROM mata_pelajaran WHERE id = ?',
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    // Cek apakah kode pelajaran sudah ada (kecuali mata pelajaran yang sama)
    if (kode_pelajaran) {
      const [existingSubjects] = await pool.execute(
        'SELECT id FROM mata_pelajaran WHERE kode_pelajaran = ? AND id != ?',
        [kode_pelajaran, id]
      );

      if (existingSubjects.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kode pelajaran sudah digunakan'
        });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (nama_pelajaran) {
      updateFields.push('nama_pelajaran = ?');
      updateValues.push(nama_pelajaran);
    }

    if (kode_pelajaran) {
      updateFields.push('kode_pelajaran = ?');
      updateValues.push(kode_pelajaran);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE mata_pelajaran SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Mata pelajaran berhasil diupdate'
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete mata pelajaran
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah mata pelajaran ada
    const [subjects] = await pool.execute(
      'SELECT * FROM mata_pelajaran WHERE id = ?',
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    // Cek apakah ada guru yang mengajar mata pelajaran ini
    const [teachers] = await pool.execute(
      'SELECT COUNT(*) as count FROM guru WHERE mata_pelajaran_id = ?',
      [id]
    );

    if (teachers[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus mata pelajaran yang masih memiliki guru pengajar'
      });
    }

    // Cek apakah ada jadwal pelajaran untuk mata pelajaran ini
    const [schedules] = await pool.execute(
      'SELECT COUNT(*) as count FROM jadwal_pelajaran WHERE mata_pelajaran_id = ?',
      [id]
    );

    if (schedules[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus mata pelajaran yang masih memiliki jadwal pelajaran'
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
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};