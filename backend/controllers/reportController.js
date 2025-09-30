const { pool } = require('../config/database');
const XLSX = require('xlsx');
const moment = require('moment');

// Export laporan absensi ke Excel
const exportAttendanceReport = async (req, res) => {
  try {
    const { start_date, end_date, kelas_id } = req.query;
    const type = req.params.type || req.query.type || 'sekolah';

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal mulai dan tanggal akhir harus diisi'
      });
    }

    let whereClause = 'WHERE DATE(a.tanggal) BETWEEN ? AND ?';
    let params = [start_date, end_date];

    if (kelas_id) {
      whereClause += ' AND s.kelas_id = ?';
      params.push(kelas_id);
    }

    let query = '';
    let filename = '';
    let sheetName = '';

    if (type === 'kelas') {
      query = `
        SELECT 
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
          k.tingkat,
          ak.tanggal,
          ak.jam_absensi,
          ak.status,
          ak.keterangan,
          mp.nama_pelajaran,
          guru.full_name as nama_guru
        FROM absensi_kelas ak
        JOIN siswa s ON ak.siswa_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        JOIN jadwal_pelajaran jp ON ak.jadwal_pelajaran_id = jp.id
        JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
        JOIN guru g ON jp.guru_id = g.id
        JOIN users guru ON g.user_id = guru.id
        ${whereClause.replace('a.', 'ak.')}
        ORDER BY k.nama_kelas, u.full_name, ak.tanggal, ak.jam_absensi
      `;
      filename = `laporan_absensi_kelas_${start_date}_${end_date}.xlsx`;
      sheetName = 'Absensi Kelas';
    } else {
      query = `
        SELECT 
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
          k.tingkat,
          abs.tanggal,
          abs.jam_masuk,
          abs.jam_pulang,
          abs.status_masuk,
          abs.status_pulang,
          abs.keterangan
        FROM absensi_sekolah abs
        JOIN siswa s ON abs.siswa_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        ${whereClause.replace('a.', 'abs.')}
        ORDER BY k.nama_kelas, u.full_name, abs.tanggal
      `;
      filename = `laporan_absensi_sekolah_${start_date}_${end_date}.xlsx`;
      sheetName = 'Absensi Sekolah';
    }

    const [results] = await pool.execute(query, params);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data absensi untuk periode yang dipilih'
      });
    }

    // Format data untuk Excel
    const excelData = results.map((row, index) => {
      if (type === 'kelas') {
        return {
          'No': index + 1,
          'NIS': row.nis,
          'Nama Siswa': row.nama_siswa,
          'Kelas': row.nama_kelas,
          'Tingkat': row.tingkat,
          'Tanggal': moment(row.tanggal).format('DD/MM/YYYY'),
          'Jam Absensi': row.jam_absensi,
          'Status': row.status,
          'Mata Pelajaran': row.nama_pelajaran,
          'Guru': row.nama_guru,
          'Keterangan': row.keterangan || '-'
        };
      } else {
        return {
          'No': index + 1,
          'NIS': row.nis,
          'Nama Siswa': row.nama_siswa,
          'Kelas': row.nama_kelas,
          'Tingkat': row.tingkat,
          'Tanggal': moment(row.tanggal).format('DD/MM/YYYY'),
          'Jam Masuk': row.jam_masuk || '-',
          'Jam Pulang': row.jam_pulang || '-',
          'Status Masuk': row.status_masuk,
          'Status Pulang': row.status_pulang,
          'Keterangan': row.keterangan || '-'
        };
      }
    });

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = type === 'kelas' ? 
      [
        { wch: 5 },   // No
        { wch: 15 },  // NIS
        { wch: 25 },  // Nama Siswa
        { wch: 15 },  // Kelas
        { wch: 10 },  // Tingkat
        { wch: 12 },  // Tanggal
        { wch: 12 },  // Jam Absensi
        { wch: 15 },  // Status
        { wch: 20 },  // Mata Pelajaran
        { wch: 20 },  // Guru
        { wch: 30 }   // Keterangan
      ] : [
        { wch: 5 },   // No
        { wch: 15 },  // NIS
        { wch: 25 },  // Nama Siswa
        { wch: 15 },  // Kelas
        { wch: 10 },  // Tingkat
        { wch: 12 },  // Tanggal
        { wch: 12 },  // Jam Masuk
        { wch: 12 },  // Jam Pulang
        { wch: 15 },  // Status Masuk
        { wch: 15 },  // Status Pulang
        { wch: 30 }   // Keterangan
      ];

    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers untuk download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('Export attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get statistik absensi
const getAttendanceStats = async (req, res) => {
  try {
    const { start_date, end_date, kelas_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal mulai dan tanggal akhir harus diisi'
      });
    }

    let whereClause = 'WHERE DATE(a.tanggal) BETWEEN ? AND ?';
    let params = [start_date, end_date];

    if (kelas_id) {
      whereClause += ' AND s.kelas_id = ?';
      params.push(kelas_id);
    }

    // Statistik absensi sekolah
    const sekolahQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_siswa,
        COUNT(abs.id) as total_absensi,
        SUM(CASE WHEN abs.status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir_masuk,
        SUM(CASE WHEN abs.status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat_masuk,
        SUM(CASE WHEN abs.status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir_masuk,
        SUM(CASE WHEN abs.status_pulang = 'hadir' THEN 1 ELSE 0 END) as hadir_pulang
      FROM siswa s
      LEFT JOIN absensi_sekolah abs ON s.id = abs.siswa_id ${whereClause.replace('a.', 'abs.')}
      ${kelas_id ? 'WHERE s.kelas_id = ?' : ''}
    `;

    // Statistik absensi kelas
    const kelasQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_siswa,
        COUNT(ak.id) as total_absensi,
        SUM(CASE WHEN ak.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN ak.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
        SUM(CASE WHEN ak.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN ak.status = 'izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN ak.status = 'sakit' THEN 1 ELSE 0 END) as sakit
      FROM siswa s
      LEFT JOIN absensi_kelas ak ON s.id = ak.siswa_id ${whereClause.replace('a.', 'ak.')}
      ${kelas_id ? 'WHERE s.kelas_id = ?' : ''}
    `;

    const [sekolahStats] = await pool.execute(sekolahQuery, kelas_id ? [kelas_id, ...params] : params);
    const [kelasStats] = await pool.execute(kelasQuery, kelas_id ? [kelas_id, ...params] : params);

    // Statistik per kelas
    const perKelasQuery = `
      SELECT 
        k.nama_kelas,
        k.tingkat,
        COUNT(DISTINCT s.id) as jumlah_siswa,
        COUNT(abs.id) as total_absensi_sekolah,
        SUM(CASE WHEN abs.status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir_masuk,
        SUM(CASE WHEN abs.status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat_masuk,
        SUM(CASE WHEN abs.status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir_masuk
      FROM kelas k
      LEFT JOIN siswa s ON k.id = s.kelas_id
      LEFT JOIN absensi_sekolah abs ON s.id = abs.siswa_id ${whereClause.replace('a.', 'abs.')}
      ${kelas_id ? 'WHERE k.id = ?' : ''}
      GROUP BY k.id, k.nama_kelas, k.tingkat
      ORDER BY k.tingkat, k.nama_kelas
    `;

    const [perKelasStats] = await pool.execute(perKelasQuery, kelas_id ? [kelas_id, ...params] : params);

    // Statistik per hari
    const perHariQuery = `
      SELECT 
        DATE(abs.tanggal) as tanggal,
        COUNT(DISTINCT s.id) as jumlah_siswa,
        COUNT(abs.id) as total_absensi,
        SUM(CASE WHEN abs.status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN abs.status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
        SUM(CASE WHEN abs.status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir
      FROM absensi_sekolah abs
      JOIN siswa s ON abs.siswa_id = s.id
      ${whereClause.replace('a.', 'abs.')}
      GROUP BY DATE(abs.tanggal)
      ORDER BY DATE(abs.tanggal)
    `;

    const [perHariStats] = await pool.execute(perHariQuery, params);

    res.json({
      success: true,
      data: {
        periode: {
          start_date,
          end_date
        },
        sekolah: sekolahStats[0],
        kelas: kelasStats[0],
        per_kelas: perKelasStats,
        per_hari: perHariStats
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');
    const thisYear = moment().format('YYYY');

    let dashboardData = {};

    if (role === 'admin') {
      // Data untuk admin
      const [totalSiswa] = await pool.execute('SELECT COUNT(*) as count FROM siswa');
      const [totalGuru] = await pool.execute('SELECT COUNT(*) as count FROM guru');
      const [totalKelas] = await pool.execute('SELECT COUNT(*) as count FROM kelas');

      const [absensiHariIni] = await pool.execute(
        'SELECT COUNT(*) as count FROM absensi_sekolah WHERE tanggal = ?',
        [today]
      );

      const [absensiBulanIni] = await pool.execute(
        'SELECT COUNT(*) as count FROM absensi_sekolah WHERE DATE_FORMAT(tanggal, "%Y-%m") = ?',
        [thisMonth]
      );

      const [siswaTerlambat] = await pool.execute(
        'SELECT COUNT(*) as count FROM absensi_sekolah WHERE tanggal = ? AND status_masuk = "terlambat"',
        [today]
      );

      const [kelasPopuler] = await pool.execute(
        `SELECT 
          k.nama_kelas,
          COUNT(abs.id) as total_absensi
        FROM kelas k
        LEFT JOIN siswa s ON k.id = s.kelas_id
        LEFT JOIN absensi_sekolah abs ON s.id = abs.siswa_id AND abs.tanggal = ?
        GROUP BY k.id, k.nama_kelas
        ORDER BY total_absensi DESC
        LIMIT 5`,
        [today]
      );

      dashboardData = {
        total_siswa: totalSiswa[0].count,
        total_guru: totalGuru[0].count,
        total_kelas: totalKelas[0].count,
        absensi_hari_ini: absensiHariIni[0].count,
        absensi_bulan_ini: absensiBulanIni[0].count,
        siswa_terlambat: siswaTerlambat[0].count,
        kelas_populer: kelasPopuler
      };

    } else if (role === 'guru') {
      // Data untuk guru
      const [guruData] = await pool.execute(
        'SELECT g.id FROM guru g WHERE g.user_id = ?',
        [userId]
      );

      if (guruData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data guru tidak ditemukan'
        });
      }

      const guruId = guruData[0].id;

      const [jadwalHariIni] = await pool.execute(
        `SELECT 
          jp.id,
          jp.hari,
          jp.jam_mulai,
          jp.jam_selesai,
          k.nama_kelas,
          mp.nama_pelajaran
        FROM jadwal_pelajaran jp
        JOIN kelas k ON jp.kelas_id = k.id
        JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id
        WHERE jp.guru_id = ? AND jp.hari = ?
        ORDER BY jp.jam_mulai`,
        [guruId, moment().format('dddd')]
      );

      const [absensiKelasHariIni] = await pool.execute(
        `SELECT 
          COUNT(ak.id) as total_absensi,
          SUM(CASE WHEN ak.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
          SUM(CASE WHEN ak.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
          SUM(CASE WHEN ak.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir
        FROM absensi_kelas ak
        JOIN jadwal_pelajaran jp ON ak.jadwal_pelajaran_id = jp.id
        WHERE jp.guru_id = ? AND ak.tanggal = ?`,
        [guruId, today]
      );

      dashboardData = {
        jadwal_hari_ini: jadwalHariIni,
        absensi_kelas_hari_ini: absensiKelasHariIni[0]
      };

    } else if (role === 'siswa') {
      // Data untuk siswa
      const [siswaData] = await pool.execute(
        'SELECT s.id FROM siswa s WHERE s.user_id = ?',
        [userId]
      );

      if (siswaData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data siswa tidak ditemukan'
        });
      }

      const siswaId = siswaData[0].id;

      const [absensiHariIni] = await pool.execute(
        'SELECT * FROM absensi_sekolah WHERE siswa_id = ? AND tanggal = ?',
        [siswaId, today]
      );

      const [riwayatAbsensi] = await pool.execute(
        `SELECT 
          tanggal,
          jam_masuk,
          jam_pulang,
          status_masuk,
          status_pulang
        FROM absensi_sekolah 
        WHERE siswa_id = ? 
        ORDER BY tanggal DESC 
        LIMIT 10`,
        [siswaId]
      );

      const [statistikBulanIni] = await pool.execute(
        `SELECT 
          COUNT(*) as total_hari,
          SUM(CASE WHEN status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir,
          SUM(CASE WHEN status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
          SUM(CASE WHEN status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir
        FROM absensi_sekolah 
        WHERE siswa_id = ? AND DATE_FORMAT(tanggal, "%Y-%m") = ?`,
        [siswaId, thisMonth]
      );

      dashboardData = {
        absensi_hari_ini: absensiHariIni[0] || null,
        riwayat_absensi: riwayatAbsensi,
        statistik_bulan_ini: statistikBulanIni[0]
      };
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  exportAttendanceReport,
  getAttendanceStats,
  getDashboardData
};