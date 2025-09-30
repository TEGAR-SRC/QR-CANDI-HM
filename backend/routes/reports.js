const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Export laporan absensi ke Excel
router.get('/export', authenticateToken, reportController.exportAttendanceReport);
router.get('/export/:type', authenticateToken, reportController.exportAttendanceReport);

// Get statistik absensi
router.get('/stats', authenticateToken, reportController.getAttendanceStats);

// Get attendance report data
router.get('/attendance', authenticateToken, reportController.getAttendanceStats);

// Get dashboard data
router.get('/dashboard', authenticateToken, reportController.getDashboardData);

module.exports = router;