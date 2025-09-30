const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { authenticateToken, requireOrangTua } = require('../middleware/auth');

// Get data anak-anak
router.get('/children', authenticateToken, requireOrangTua, parentController.getChildren);

// Get riwayat absensi anak
router.get('/children/:siswa_id/attendance', authenticateToken, requireOrangTua, parentController.getChildAttendance);

// Get statistik absensi anak
router.get('/children/:siswa_id/stats', authenticateToken, requireOrangTua, parentController.getChildStats);

module.exports = router;