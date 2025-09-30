const { pool } = require('../config/database');

// Get semua jadwal pelajaran
const getAllSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, kelas_id, guru_id, hari } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (mp.nama_pelajaran LIKE ? OR k.nama_kelas LIKE ? OR u.full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (kelas_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'jp.kelas_id = ?';
      params.push(kelas_id);
    }

    if (guru_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'jp.guru_id = ?';
      params.push(guru_id);
    }

    if (hari) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'jp.hari = ?';
      params.push(hari);
    }

    const query = `
      SELECT 
        jp.id,
        jp.hari,
        jp.jam_mulai,
        jp.jam_selesai,
        k.nama_kelas,
        k.tingkat,
        mp.nama_pelajaran,
        mp.kode_pelajaran,
        u.full_name as nama_guru,
        g.nip
      FROM jadwal_pelajaran jp
      JOIN kelas k ON jp.kelas_id = k.id
      JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
      JOIN guru g ON jp.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      ${whereClause}
      ORDER BY 
        CASE jp.hari 
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
        END,
        jp.jam_mulai
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM jadwal_pelajaran jp
      JOIN kelas k ON jp.kelas_id = k.id
      JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
      JOIN guru g ON jp.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      ${whereClause}
    `;

    const [schedules] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        schedules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get jadwal pelajaran by ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [schedules] = await pool.execute(
      `SELECT 
        jp.*,
        k.nama_kelas,
        k.tingkat,
        mp.nama_pelajaran,
        mp.kode_pelajaran,
        u.full_name as nama_guru,
        g.nip
      FROM jadwal_pelajaran jp
      JOIN kelas k ON jp.kelas_id = k.id
      JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
      JOIN guru g ON jp.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE jp.id = ?`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: schedules[0]
    });

  } catch (error) {
    console.error('Get schedule by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create jadwal pelajaran baru
const createSchedule = async (req, res) => {
  try {
    const { kelas_id, mata_pelajaran_id, guru_id, hari, jam_mulai, jam_selesai } = req.body;

    if (!kelas_id || !mata_pelajaran_id || !guru_id || !hari || !jam_mulai || !jam_selesai) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }

    // Validasi jam
    if (jam_mulai >= jam_selesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai'
      });
    }

    // Cek apakah kelas ada
    const [kelas] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [kelas_id]);
    if (kelas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }

    // Cek apakah mata pelajaran ada
    const [mataPelajaran] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [mata_pelajaran_id]);
    if (mataPelajaran.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    // Cek apakah guru ada
    const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
    if (guru.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }

    // Cek konflik jadwal untuk kelas yang sama
    const [conflictKelas] = await pool.execute(
      'SELECT id FROM jadwal_pelajaran WHERE kelas_id = ? AND hari = ? AND ((jam_mulai <= ? AND jam_selesai > ?) OR (jam_mulai < ? AND jam_selesai >= ?) OR (jam_mulai >= ? AND jam_selesai <= ?))',
      [kelas_id, hari, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]
    );

    if (conflictKelas.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal bertabrakan dengan jadwal lain di kelas yang sama'
      });
    }

    // Cek konflik jadwal untuk guru yang sama
    const [conflictGuru] = await pool.execute(
      'SELECT id FROM jadwal_pelajaran WHERE guru_id = ? AND hari = ? AND ((jam_mulai <= ? AND jam_selesai > ?) OR (jam_mulai < ? AND jam_selesai >= ?) OR (jam_mulai >= ? AND jam_selesai <= ?))',
      [guru_id, hari, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]
    );

    if (conflictGuru.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal bertabrakan dengan jadwal mengajar guru yang sama'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO jadwal_pelajaran (kelas_id, mata_pelajaran_id, guru_id, hari, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?, ?, ?)',
      [kelas_id, mata_pelajaran_id, guru_id, hari, jam_mulai, jam_selesai]
    );

    res.status(201).json({
      success: true,
      message: 'Jadwal pelajaran berhasil dibuat',
      data: {
        id: result.insertId,
        kelas_id,
        mata_pelajaran_id,
        guru_id,
        hari,
        jam_mulai,
        jam_selesai
      }
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update jadwal pelajaran
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { kelas_id, mata_pelajaran_id, guru_id, hari, jam_mulai, jam_selesai } = req.body;

    // Cek apakah jadwal ada
    const [schedules] = await pool.execute(
      'SELECT * FROM jadwal_pelajaran WHERE id = ?',
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan'
      });
    }

    // Validasi jam
    if (jam_mulai && jam_selesai && jam_mulai >= jam_selesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai'
      });
    }

    // Cek apakah kelas ada
    if (kelas_id) {
      const [kelas] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [kelas_id]);
      if (kelas.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }
    }

    // Cek apakah mata pelajaran ada
    if (mata_pelajaran_id) {
      const [mataPelajaran] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [mata_pelajaran_id]);
      if (mataPelajaran.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }
    }

    // Cek apakah guru ada
    if (guru_id) {
      const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
      if (guru.id === 0) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }
    }

    // Cek konflik jadwal (jika ada perubahan yang mempengaruhi konflik)
    if (kelas_id || hari || jam_mulai || jam_selesai || guru_id) {
      const finalKelasId = kelas_id || schedules[0].kelas_id;
      const finalHari = hari || schedules[0].hari;
      const finalJamMulai = jam_mulai || schedules[0].jam_mulai;
      const finalJamSelesai = jam_selesai || schedules[0].jam_selesai;
      const finalGuruId = guru_id || schedules[0].guru_id;

      // Cek konflik jadwal untuk kelas yang sama
      const [conflictKelas] = await pool.execute(
        'SELECT id FROM jadwal_pelajaran WHERE kelas_id = ? AND hari = ? AND id != ? AND ((jam_mulai <= ? AND jam_selesai > ?) OR (jam_mulai < ? AND jam_selesai >= ?) OR (jam_mulai >= ? AND jam_selesai <= ?))',
        [finalKelasId, finalHari, id, finalJamMulai, finalJamMulai, finalJamSelesai, finalJamSelesai, finalJamMulai, finalJamSelesai]
      );

      if (conflictKelas.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Jadwal bertabrakan dengan jadwal lain di kelas yang sama'
        });
      }

      // Cek konflik jadwal untuk guru yang sama
      const [conflictGuru] = await pool.execute(
        'SELECT id FROM jadwal_pelajaran WHERE guru_id = ? AND hari = ? AND id != ? AND ((jam_mulai <= ? AND jam_selesai > ?) OR (jam_mulai < ? AND jam_selesai >= ?) OR (jam_mulai >= ? AND jam_selesai <= ?))',
        [finalGuruId, finalHari, id, finalJamMulai, finalJamMulai, finalJamSelesai, finalJamSelesai, finalJamMulai, finalJamSelesai]
      );

      if (conflictGuru.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Jadwal bertabrakan dengan jadwal mengajar guru yang sama'
        });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (kelas_id) {
      updateFields.push('kelas_id = ?');
      updateValues.push(kelas_id);
    }

    if (mata_pelajaran_id) {
      updateFields.push('mata_pelajaran_id = ?');
      updateValues.push(mata_pelajaran_id);
    }

    if (guru_id) {
      updateFields.push('guru_id = ?');
      updateValues.push(guru_id);
    }

    if (hari) {
      updateFields.push('hari = ?');
      updateValues.push(hari);
    }

    if (jam_mulai) {
      updateFields.push('jam_mulai = ?');
      updateValues.push(jam_mulai);
    }

    if (jam_selesai) {
      updateFields.push('jam_selesai = ?');
      updateValues.push(jam_selesai);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE jadwal_pelajaran SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Jadwal pelajaran berhasil diupdate'
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete jadwal pelajaran
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah jadwal ada
    const [schedules] = await pool.execute(
      'SELECT * FROM jadwal_pelajaran WHERE id = ?',
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan'
      });
    }

    // Cek apakah ada absensi kelas untuk jadwal ini
    const [absensi] = await pool.execute(
      'SELECT COUNT(*) as count FROM absensi_kelas WHERE jadwal_pelajaran_id = ?',
      [id]
    );

    if (absensi[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus jadwal yang sudah memiliki data absensi'
      });
    }

    await pool.execute('DELETE FROM jadwal_pelajaran WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Jadwal pelajaran berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};