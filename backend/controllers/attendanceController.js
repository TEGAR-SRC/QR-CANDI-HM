const { pool } = require('../config/database');
const moment = require('moment');
const axios = require('axios');

// Scan barcode untuk absensi
const scanBarcode = async (req, res) => {
  try {
    const { barcode_id, attendance_type, jadwal_id } = req.body;
    const userId = req.user.id;

    if (!barcode_id) {
      return res.status(400).json({
        success: false,
        message: 'Barcode ID diperlukan'
      });
    }

    // Cari siswa berdasarkan barcode_id
    const [siswaData] = await pool.execute(
      'SELECT s.*, u.full_name, k.nama_kelas FROM siswa s JOIN users u ON s.user_id = u.id JOIN kelas k ON s.kelas_id = k.id WHERE s.barcode_id = ?',
      [barcode_id]
    );

    if (siswaData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    const siswa = siswaData[0];
    const today = moment().format('YYYY-MM-DD');
    const now = moment().format('HH:mm:ss');

    if (attendance_type === 'sekolah') {
      // Absensi sekolah (masuk/pulang)
      const [existingAbsensi] = await pool.execute(
        'SELECT * FROM absensi_sekolah WHERE siswa_id = ? AND tanggal = ?',
        [siswa.id, today]
      );

      if (existingAbsensi.length === 0) {
        // Absensi masuk
        const statusMasuk = moment().hour() > 7 ? 'terlambat' : 'hadir';
        
        await pool.execute(
          'INSERT INTO absensi_sekolah (siswa_id, tanggal, jam_masuk, status_masuk) VALUES (?, ?, ?, ?)',
          [siswa.id, today, now, statusMasuk]
        );

        // Kirim notifikasi WhatsApp
        await sendWhatsAppNotification(siswa, 'masuk', statusMasuk);

        res.json({
          success: true,
          message: `Absensi masuk berhasil. Status: ${statusMasuk}`,
          data: {
            siswa: {
              nama: siswa.full_name,
              kelas: siswa.nama_kelas,
              nis: siswa.nis
            },
            absensi: {
              tanggal: today,
              jam_masuk: now,
              status: statusMasuk
            }
          }
        });

      } else {
        // Absensi pulang
        const absensi = existingAbsensi[0];
        
        if (absensi.jam_pulang) {
          return res.status(400).json({
            success: false,
            message: 'Siswa sudah melakukan absensi pulang hari ini'
          });
        }

        await pool.execute(
          'UPDATE absensi_sekolah SET jam_pulang = ?, status_pulang = ? WHERE id = ?',
          [now, 'hadir', absensi.id]
        );

        // Kirim notifikasi WhatsApp
        await sendWhatsAppNotification(siswa, 'pulang', 'hadir');

        res.json({
          success: true,
          message: 'Absensi pulang berhasil',
          data: {
            siswa: {
              nama: siswa.full_name,
              kelas: siswa.nama_kelas,
              nis: siswa.nis
            },
            absensi: {
              tanggal: today,
              jam_masuk: absensi.jam_masuk,
              jam_pulang: now,
              status_masuk: absensi.status_masuk,
              status_pulang: 'hadir'
            }
          }
        });
      }

    } else if (attendance_type === 'kelas') {
      // Absensi kelas
      if (!jadwal_id) {
        return res.status(400).json({
          success: false,
          message: 'Jadwal pelajaran diperlukan untuk absensi kelas'
        });
      }

      // Cek apakah jadwal pelajaran valid
      const [jadwalData] = await pool.execute(
        'SELECT jp.*, mp.nama_pelajaran, g.nip, u.full_name as nama_guru FROM jadwal_pelajaran jp JOIN mata_pelajaran mp ON jp.mata_pelajaran_id = mp.id JOIN guru g ON jp.guru_id = g.id JOIN users u ON g.user_id = u.id WHERE jp.id = ?',
        [jadwal_id]
      );

      if (jadwalData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal pelajaran tidak ditemukan'
        });
      }

      const jadwal = jadwalData[0];

      // Cek apakah siswa sudah absen di pelajaran ini hari ini
      const [existingAbsensiKelas] = await pool.execute(
        'SELECT * FROM absensi_kelas WHERE siswa_id = ? AND jadwal_pelajaran_id = ? AND tanggal = ?',
        [siswa.id, jadwal_id, today]
      );

      if (existingAbsensiKelabs.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Siswa sudah melakukan absensi untuk pelajaran ini hari ini'
        });
      }

      // Tentukan status absensi
      const jamMulai = moment(jadwal.jam_mulai, 'HH:mm:ss');
      const jamSekarang = moment(now, 'HH:mm:ss');
      const selisihMenit = jamSekarang.diff(jamMulai, 'minutes');
      
      let status = 'hadir';
      if (selisihMenit > 15) {
        status = 'terlambat';
      }

      await pool.execute(
        'INSERT INTO absensi_kelas (siswa_id, jadwal_pelajaran_id, tanggal, jam_absensi, status) VALUES (?, ?, ?, ?, ?)',
        [siswa.id, jadwal_id, today, now, status]
      );

      res.json({
        success: true,
        message: `Absensi kelas berhasil. Status: ${status}`,
        data: {
          siswa: {
            nama: siswa.full_name,
            kelas: siswa.nama_kelas,
            nis: siswa.nis
          },
          pelajaran: {
            nama: jadwal.nama_pelajaran,
            guru: jadwal.nama_guru,
            jam: `${jadwal.jam_mulai} - ${jadwal.jam_selesai}`
          },
          absensi: {
            tanggal: today,
            jam_absensi: now,
            status: status
          }
        }
      });
    }

  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Kirim notifikasi WhatsApp
const sendWhatsAppNotification = async (siswa, type, status) => {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
      console.log('WhatsApp API tidak dikonfigurasi');
      return;
    }

    if (!siswa.phone_ortu) {
      console.log('Nomor telepon orang tua tidak tersedia');
      return;
    }

    let message = '';
    const waktu = moment().format('DD/MM/YYYY HH:mm');

    if (type === 'masuk') {
      message = `📚 *Notifikasi Absensi Sekolah*\n\n` +
                `👤 *Siswa:* ${siswa.full_name}\n` +
                `🏫 *Kelas:* ${siswa.nama_kelas}\n` +
                `📅 *Tanggal:* ${waktu}\n` +
                `✅ *Status:* ${status === 'hadir' ? 'Hadir tepat waktu' : 'Terlambat'}\n\n` +
                `Terima kasih.`;
    } else if (type === 'pulang') {
      message = `📚 *Notifikasi Absensi Sekolah*\n\n` +
                `👤 *Siswa:* ${siswa.full_name}\n` +
                `🏫 *Kelas:* ${siswa.nama_kelas}\n` +
                `📅 *Tanggal:* ${waktu}\n` +
                `✅ *Status:* Pulang sekolah\n\n` +
                `Terima kasih.`;
    }

    // Simpan notifikasi ke database
    await pool.execute(
      'INSERT INTO whatsapp_notifications (siswa_id, absensi_id, absensi_type, phone_number, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [siswa.id, 0, 'sekolah', siswa.phone_ortu, message, 'pending']
    );

    // Kirim via API WhatsApp
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/sendMessage`,
      {
        phone: siswa.phone_ortu,
        message: message
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      // Update status notifikasi
      await pool.execute(
        'UPDATE whatsapp_notifications SET status = ?, sent_at = NOW() WHERE siswa_id = ? AND phone_number = ? ORDER BY created_at DESC LIMIT 1',
        ['sent', siswa.id, siswa.phone_ortu]
      );
    }

  } catch (error) {
    console.error('WhatsApp notification error:', error);
    
    // Update status notifikasi ke failed
    try {
      await pool.execute(
        'UPDATE whatsapp_notifications SET status = ? WHERE siswa_id = ? AND phone_number = ? ORDER BY created_at DESC LIMIT 1',
        ['failed', siswa.id, siswa.phone_ortu]
      );
    } catch (updateError) {
      console.error('Update notification status error:', updateError);
    }
  }
};

// Get riwayat absensi siswa
const getAttendanceHistory = async (req, res) => {
  try {
    const { siswa_id, start_date, end_date, type } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    let whereClause = '';
    let params = [];

    // Jika bukan admin, hanya bisa lihat data sendiri
    if (role === 'siswa') {
      const [siswaData] = await pool.execute(
        'SELECT id FROM siswa WHERE user_id = ?',
        [userId]
      );
      
      if (siswaData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data siswa tidak ditemukan'
        });
      }

      whereClause = 'WHERE s.id = ?';
      params.push(siswaData[0].id);
    } else if (siswa_id) {
      whereClause = 'WHERE s.id = ?';
      params.push(siswa_id);
    }

    if (start_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(a.tanggal) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(a.tanggal) <= ?';
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
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
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
        ${whereClause}
        ORDER BY ak.tanggal DESC, ak.jam_absensi DESC
      `;
    } else {
      query = `
        SELECT 
          abs.id,
          abs.tanggal,
          abs.jam_masuk,
          abs.jam_pulang,
          abs.status_masuk,
          abs.status_pulang,
          abs.keterangan,
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas
        FROM absensi_sekolah as
        JOIN siswa s ON abs.siswa_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        ${whereClause}
        ORDER BY abs.tanggal DESC
      `;
    }

    const [results] = await pool.execute(query, params);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get rekap absensi
const getAttendanceReport = async (req, res) => {
  try {
    const { start_date, end_date, kelas_id, type } = req.query;

    let whereClause = '';
    let params = [];

    if (start_date) {
      whereClause += 'WHERE DATE(a.tanggal) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(a.tanggal) <= ?';
      params.push(end_date);
    }

    if (kelas_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 's.kelas_id = ?';
      params.push(kelas_id);
    }

    let query = '';
    if (type === 'kelas') {
      query = `
        SELECT 
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
          COUNT(ak.id) as total_absensi,
          SUM(CASE WHEN ak.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
          SUM(CASE WHEN ak.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
          SUM(CASE WHEN ak.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
          SUM(CASE WHEN ak.status = 'izin' THEN 1 ELSE 0 END) as izin,
          SUM(CASE WHEN ak.status = 'sakit' THEN 1 ELSE 0 END) as sakit
        FROM siswa s
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        LEFT JOIN absensi_kelas ak ON s.id = ak.siswa_id ${whereClause.replace('a.', 'ak.')}
        GROUP BY s.id, s.nis, u.full_name, k.nama_kelas
        ORDER BY k.nama_kelas, u.full_name
      `;
    } else {
      query = `
        SELECT 
          s.nis,
          u.full_name as nama_siswa,
          k.nama_kelas,
          COUNT(abs.id) as total_hari,
          SUM(CASE WHEN abs.status_masuk = 'hadir' THEN 1 ELSE 0 END) as hadir_masuk,
          SUM(CASE WHEN abs.status_masuk = 'terlambat' THEN 1 ELSE 0 END) as terlambat_masuk,
          SUM(CASE WHEN abs.status_masuk = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir_masuk,
          SUM(CASE WHEN abs.status_pulang = 'hadir' THEN 1 ELSE 0 END) as hadir_pulang
        FROM siswa s
        JOIN users u ON s.user_id = u.id
        JOIN kelas k ON s.kelas_id = k.id
        LEFT JOIN absensi_sekolah abs ON s.id = abs.siswa_id ${whereClause.replace('a.', 'abs.')}
        GROUP BY s.id, s.nis, u.full_name, k.nama_kelas
        ORDER BY k.nama_kelas, u.full_name
      `;
    }

    const [results] = await pool.execute(query, params);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get all attendances (for admin)
const getAllAttendances = async (req, res) => {
  try {
    const { status, kelas, tanggal } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause += 'WHERE abs.status_masuk = ?';
      params.push(status);
    }
    
    if (kelas) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 's.kelas_id = ?';
      params.push(kelas);
    }
    
    if (tanggal) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(abs.tanggal) = ?';
      params.push(tanggal);
    }
    
    const query = `
      SELECT 
        abs.id,
        abs.tanggal,
        abs.jam_masuk,
        abs.jam_pulang,
        abs.status_masuk,
        abs.status_pulang,
        abs.keterangan,
        s.nis as siswa_nis,
        u.full_name as siswa_nama,
        k.nama_kelas as kelas
      FROM absensi_sekolah abs
      JOIN siswa s ON abs.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      ${whereClause}
      ORDER BY abs.tanggal DESC, abs.jam_masuk DESC
    `;
    
    const [attendances] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: attendances
    });
    
  } catch (error) {
    console.error('Get all attendances error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi'
    });
  }
};

module.exports = {
  scanBarcode,
  getAttendanceHistory,
  getAttendanceReport,
  getAllAttendances
};