const express = require('express');
const router = express.Router();
const yoloController = require('../controllers/yoloController');
const { authenticateToken } = require('../middleware/auth');

// YOLO Absensi dengan geolocation
router.post('/attendance', authenticateToken, yoloController.yoloAttendance);

// Get lokasi absensi yang aktif
router.get('/locations', authenticateToken, yoloController.getAttendanceLocations);

// Get status absensi yang tersedia
router.get('/statuses', authenticateToken, yoloController.getAttendanceStatuses);

module.exports = router;