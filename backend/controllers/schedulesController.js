const { pool } = require('../config/database');

// Get all schedules
const getSchedules = async (req, res) => {
  try {
    const { hari, kelas_id, mata_pelajaran_id, search } = req.query;
    
    let query = `
      SELECT 
        j.id,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.created_at,
        mp.nama_pelajaran as mata_pelajaran,
        k.nama_kelas as kelas,
        u.full_name as guru
      FROM jadwal_pelajaran j
      JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
      JOIN kelas k ON j.kelas_id = k.id
      JOIN guru g ON j.guru_id = g.id
      JOIN users u ON g.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (hari) {
      conditions.push('j.hari = ?');
      params.push(hari);
    }
    
    if (kelas_id) {
      conditions.push('j.kelas_id = ?');
      params.push(kelas_id);
    }
    
    if (mata_pelajaran_id) {
      conditions.push('j.mata_pelajaran_id = ?');
      params.push(mata_pelajaran_id);
    }
    
    if (search) {
      conditions.push('(mp.nama_mata_pelajaran LIKE ? OR k.nama_kelas LIKE ? OR u.full_name LIKE ? OR j.ruang LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY FIELD(j.hari, "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"), j.jam_mulai ASC';
    
    const [schedules] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jadwal'
    });
  }
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [schedules] = await pool.execute(`
      SELECT 
        j.*,
        mp.nama_mata_pelajaran,
        k.nama_kelas,
        u.full_name as guru_nama
      FROM jadwal j
      JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
      JOIN kelas k ON j.kelas_id = k.id
      JOIN guru g ON j.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE j.id = ?
    `, [id]);
    
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
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
      message: 'Gagal mengambil data jadwal'
    });
  }
};

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const {
      mata_pelajaran_id,
      kelas_id,
      guru_id,
      hari,
      jam_mulai,
      jam_selesai,
      ruang,
      semester,
      tahun_ajaran
    } = req.body;
    
    // Validate foreign keys
    const [mataPelajaran] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [mata_pelajaran_id]);
    if (mataPelajaran.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }
    
    const [kelas] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [kelas_id]);
    if (kelas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }
    
    const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
    if (guru.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }
    
    // Check for schedule conflicts
    const [conflicts] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM jadwal 
      WHERE (kelas_id = ? OR guru_id = ?) 
      AND hari = ? 
      AND (
        (jam_mulai <= ? AND jam_selesai > ?) OR
        (jam_mulai < ? AND jam_selesai >= ?) OR
        (jam_mulai >= ? AND jam_selesai <= ?)
      )
    `, [kelas_id, guru_id, hari, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]);
    
    if (conflicts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Terdapat konflik jadwal dengan kelas atau guru yang sama pada waktu tersebut'
      });
    }
    
    await pool.execute(
      'INSERT INTO jadwal (mata_pelajaran_id, kelas_id, guru_id, hari, jam_mulai, jam_selesai, ruang, semester, tahun_ajaran) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [mata_pelajaran_id, kelas_id, guru_id, hari, jam_mulai, jam_selesai, ruang, semester, tahun_ajaran]
    );
    
    res.status(201).json({
      success: true,
      message: 'Jadwal berhasil dibuat'
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat jadwal'
    });
  }
};

// Update schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mata_pelajaran_id,
      kelas_id,
      guru_id,
      hari,
      jam_mulai,
      jam_selesai,
      ruang,
      semester,
      tahun_ajaran
    } = req.body;
    
    // Check if schedule exists
    const [existingSchedule] = await pool.execute('SELECT id FROM jadwal WHERE id = ?', [id]);
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }
    
    // Validate foreign keys
    const [mataPelajaran] = await pool.execute('SELECT id FROM mata_pelajaran WHERE id = ?', [mata_pelajaran_id]);
    if (mataPelajaran.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }
    
    const [kelas] = await pool.execute('SELECT id FROM kelas WHERE id = ?', [kelas_id]);
    if (kelas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }
    
    const [guru] = await pool.execute('SELECT id FROM guru WHERE id = ?', [guru_id]);
    if (guru.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guru tidak ditemukan'
      });
    }
    
    // Check for schedule conflicts (excluding current schedule)
    const [conflicts] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM jadwal 
      WHERE id != ? 
      AND (kelas_id = ? OR guru_id = ?) 
      AND hari = ? 
      AND (
        (jam_mulai <= ? AND jam_selesai > ?) OR
        (jam_mulai < ? AND jam_selesai >= ?) OR
        (jam_mulai >= ? AND jam_selesai <= ?)
      )
    `, [id, kelas_id, guru_id, hari, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]);
    
    if (conflicts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Terdapat konflik jadwal dengan kelas atau guru yang sama pada waktu tersebut'
      });
    }
    
    await pool.execute(
      'UPDATE jadwal SET mata_pelajaran_id = ?, kelas_id = ?, guru_id = ?, hari = ?, jam_mulai = ?, jam_selesai = ?, ruang = ?, semester = ?, tahun_ajaran = ? WHERE id = ?',
      [mata_pelajaran_id, kelas_id, guru_id, hari, jam_mulai, jam_selesai, ruang, semester, tahun_ajaran, id]
    );
    
    res.json({
      success: true,
      message: 'Jadwal berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui jadwal'
    });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if schedule exists
    const [existingSchedule] = await pool.execute('SELECT id FROM jadwal WHERE id = ?', [id]);
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }
    
    await pool.execute('DELETE FROM jadwal WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Jadwal berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus jadwal'
    });
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};