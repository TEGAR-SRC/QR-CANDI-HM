const { pool } = require('../config/database');

// Get data anak-anak dari orang tua
const getChildren = async (req, res) => {
  try {
    const userId = req.user.id;

    const [children] = await pool.execute(
      `SELECT 
        ot.id as orang_tua_id,
        ot.hubungan,
        ot.pekerjaan,
        ot.alamat,
        s.id as siswa_id,
        s.nis,
        s.nisn,
        s.barcode_id,
        s.tanggal_lahir,
        u.full_name as nama_siswa,
        u.email as email_siswa,
        k.nama_kelas,
        k.tingkat
      FROM orang_tua ot
      JOIN siswa s ON ot.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      WHERE ot.user_id = ?
      ORDER BY u.full_name`,
      [userId]
    );

    res.json({
      success: true,
      data: children
    });

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get riwayat absensi anak
const getChildAttendance = async (req, res) => {
  try {
    const { siswa_id } = req.params;
    const { start_date, end_date, type = 'sekolah' } = req.query;
    const userId = req.user.id;

    // Cek apakah orang tua memiliki akses ke siswa ini
    const [accessCheck] = await pool.execute(
      'SELECT id FROM orang_tua WHERE user_id = ? AND siswa_id = ?',
      [userId, siswa_id]
    );

    if (accessCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke data siswa ini'
      });
    }

    let whereClause = 'WHERE s.id = ?';
    let params = [siswa_id];

    if (start_date) {
      whereClause += ' AND DATE(a.tanggal) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(a.tanggal) <= ?';
      params.push(end_date);
    }

    let query = '';
    if (type === 'kelas') {
      query = `
        SELECT 
          ak.id,
          ak.tanggal,
          ak.jam_absensi,
          ak.status,
          ak.keterangan,
          mp.nama_pelajaran,
          guru.full_name as nama_guru
        FROM absensi_kelas ak
        JOIN siswa s ON ak.siswa_id = s.id
        JOIN jadwal_pelajaran jp ON ak.jadwal_pelajaran_id = jp.id
        JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
        JOIN guru g ON jp.guru_id = g.id
        JOIN users guru ON g.user_id = guru.id
        ${whereClause.replace('a.', 'ak.')}
        ORDER BY ak.tanggal DESC, ak.jam_absensi DESC
      `;
    } else {
      query = `
        SELECT 
          as.id,
          as.tanggal,
          as.jam_masuk,
          as.jam_pulang,
          as.status_masuk,
          as.status_pulang,
          as.keterangan
        FROM absensi_sekolah as
        JOIN siswa s ON as.siswa_id = s.id
        ${whereClause.replace('a.', 'as.')}
        ORDER BY as.tanggal DESC
      `;
    }

    const [results] = await pool.execute(query, params);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Get child attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get statistik absensi anak
const getChildStats = async (req, res) => {
  try {
    const { siswa_id } = req.params;
    const { start_date, end_date } = req.query;
    const userId = req.user.id;

    // Cek apakah orang tua memiliki akses ke siswa ini
    const [accessCheck] = await pool.execute(
      'SELECT id FROM orang_tua WHERE user_id = ? AND siswa_id = ?',
      [userId, siswa_id]
    );

    if (accessCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke data siswa ini'
      });
    }

    let whereClause = 'WHERE s.id = ?';
    let params = [siswa_id];

    if (start_date) {
      whereClause += ' AND DATE(as.tanggal) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(as.tanggal) <= ?';
      params.push(end_date);
    }

    // Statistik absensi sekolah
    const sekolahQuery = `
      SELECT 
        COUNT(as.id) as total_hari,
        SUM(CASE WHEN as.status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir_masuk,
        SUM(CASE WHEN as.status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat_masuk,
        SUM(CASE WHEN as.status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir_masuk,
        SUM(CASE WHEN as.status_pulang = 'hadir' THEN 1 ELSE 0 END) as hadir_pulang
      FROM absensi_sekolah as
      JOIN siswa s ON as.siswa_id = s.id
      ${whereClause.replace('a.', 'as.')}
    `;

    // Statistik absensi kelas
    const kelasQuery = `
      SELECT 
        COUNT(ak.id) as total_absensi,
        SUM(CASE WHEN ak.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN ak.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
        SUM(CASE WHEN ak.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN ak.status = 'izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN ak.status = 'sakit' THEN 1 ELSE 0 END) as sakit
      FROM absensi_kelas ak
      JOIN siswa s ON ak.siswa_id = s.id
      ${whereClause.replace('a.', 'ak.')}
    `;

    const [sekolahStats] = await pool.execute(sekolahQuery, params);
    const [kelasStats] = await pool.execute(kelasQuery, params);

    res.json({
      success: true,
      data: {
        sekolah: sekolahStats[0],
        kelas: kelasStats[0]
      }
    });

  } catch (error) {
    console.error('Get child stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getChildren,
  getChildAttendance,
  getChildStats
};