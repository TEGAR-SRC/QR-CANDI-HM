const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireSiswa, requireGuru } = require('../middleware/auth');

// Scan barcode untuk absensi
router.post('/scan', authenticateToken, attendanceController.scanBarcode);

// Get riwayat absensi
router.get('/history', authenticateToken, attendanceController.getAttendanceHistory);

// Get semua data absensi (untuk admin)
router.get('/', authenticateToken, attendanceController.getAllAttendances);

// Get rekap absensi
router.get('/report', authenticateToken, attendanceController.getAttendanceReport);

module.exports = router;