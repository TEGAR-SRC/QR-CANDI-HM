const { pool } = require('../config/database');
const moment = require('moment');

// YOLO Absensi dengan geolocation dan time validation
const yoloAttendance = async (req, res) => {
  try {
    const { 
      barcode_id, 
      attendance_type, 
      jadwal_id,
      latitude, 
      longitude,
      status_code = 'H' // default hadir
    } = req.body;

    if (!barcode_id) {
      return res.status(400).json({
        success: false,
        message: 'Barcode ID diperlukan'
      });
    }

    // Validasi geolocation jika YOLO enabled
    const [yoloConfig] = await pool.execute(
      'SELECT config_value FROM system_config WHERE config_key = "yolo_enabled"'
    );

    if (yoloConfig.length > 0 && yoloConfig[0].config_value === 'true') {
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Lokasi GPS diperlukan untuk YOLO absensi'
        });
      }

      // Cek apakah dalam radius lokasi yang diizinkan
      const [locations] = await pool.execute(
        'SELECT * FROM attendance_locations WHERE is_active = 1'
      );

      let isInLocation = false;
      for (const location of locations) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          location.latitude, 
          location.longitude
        );
        
        if (distance <= location.radius) {
          isInLocation = true;
          break;
        }
      }

      if (!isInLocation) {
        return res.status(400).json({
          success: false,
          message: 'Anda tidak berada dalam radius lokasi yang diizinkan untuk absensi'
        });
      }
    }

    // Validasi jam absensi
    const [timeConfig] = await pool.execute(
      'SELECT config_value FROM system_config WHERE config_key IN ("min_attendance_hour", "max_attendance_hour")'
    );

    const minHour = timeConfig.find(c => c.config_key === 'min_attendance_hour')?.config_value || '05';
    const maxHour = timeConfig.find(c => c.config_key === 'max_attendance_hour')?.config_value || '18';
    
    const currentHour = moment().format('HH');
    if (currentHour < minHour || currentHour > maxHour) {
      return res.status(400).json({
        success: false,
        message: `Absensi hanya bisa dilakukan antara jam ${minHour}:00 - ${maxHour}:00`
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

    // Cek status absensi yang valid
    const [statusData] = await pool.execute(
      'SELECT * FROM attendance_statuses WHERE code = ? AND is_active = 1',
      [status_code]
    );

    if (statusData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Status absensi tidak valid'
      });
    }

    const status = statusData[0];

    if (attendance_type === 'sekolah') {
      // Absensi sekolah (masuk/pulang)
      const [existingAbsensi] = await pool.execute(
        'SELECT * FROM absensi_sekolah WHERE siswa_id = ? AND tanggal = ?',
        [siswa.id, today]
      );

      if (existingAbsensi.length === 0) {
        // Absensi masuk
        await pool.execute(
          'INSERT INTO absensi_sekolah (siswa_id, tanggal, jam_masuk, status_masuk, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
          [siswa.id, today, now, status.name, latitude || null, longitude || null]
        );

        res.json({
          success: true,
          message: `YOLO Absensi masuk berhasil. Status: ${status.name}`,
          data: {
            siswa: {
              nama: siswa.full_name,
              kelas: siswa.nama_kelas,
              nis: siswa.nis
            },
            absensi: {
              tanggal: today,
              jam_masuk: now,
              status: status.name,
              lokasi: latitude && longitude ? 'Valid' : 'Tidak ada'
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
          'UPDATE absensi_sekolah SET jam_pulang = ?, status_pulang = ?, latitude_pulang = ?, longitude_pulang = ? WHERE id = ?',
          [now, status.name, latitude || null, longitude || null, absensi.id]
        );

        res.json({
          success: true,
          message: `YOLO Absensi pulang berhasil. Status: ${status.name}`,
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
              status_pulang: status.name,
              lokasi: latitude && longitude ? 'Valid' : 'Tidak ada'
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

      if (existingAbsensiKelas.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Siswa sudah melakukan absensi untuk pelajaran ini hari ini'
        });
      }

      await pool.execute(
        'INSERT INTO absensi_kelas (siswa_id, jadwal_pelajaran_id, tanggal, jam_absensi, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [siswa.id, jadwal_id, today, now, status.name, latitude || null, longitude || null]
      );

      res.json({
        success: true,
        message: `YOLO Absensi kelas berhasil. Status: ${status.name}`,
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
            status: status.name,
            lokasi: latitude && longitude ? 'Valid' : 'Tidak ada'
          }
        }
      });
    }

  } catch (error) {
    console.error('YOLO attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Hitung jarak antara dua koordinat (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Get lokasi absensi yang aktif
const getAttendanceLocations = async (req, res) => {
  try {
    const [locations] = await pool.execute(
      'SELECT * FROM attendance_locations WHERE is_active = 1 ORDER BY name'
    );

    res.json({
      success: true,
      data: locations
    });

  } catch (error) {
    console.error('Get attendance locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get status absensi yang tersedia
const getAttendanceStatuses = async (req, res) => {
  try {
    const [statuses] = await pool.execute(
      'SELECT * FROM attendance_statuses WHERE is_active = 1 ORDER BY name'
    );

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Get attendance statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  yoloAttendance,
  getAttendanceLocations,
  getAttendanceStatuses
};