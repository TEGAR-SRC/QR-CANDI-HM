const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Super Admin Dashboard - Fitur dewa
router.get('/dashboard', authenticateToken, requireAdmin, superAdminController.getSuperDashboard);

// Kelola lokasi absensi
router.post('/locations', authenticateToken, requireAdmin, superAdminController.manageAttendanceLocations);

// Kelola jadwal absensi
router.post('/schedules', authenticateToken, requireAdmin, superAdminController.manageAttendanceSchedules);

// Kelola level users
router.post('/user-levels', authenticateToken, requireAdmin, superAdminController.manageUserLevels);

// Kelola status absensi
router.post('/attendance-statuses', authenticateToken, requireAdmin, superAdminController.manageAttendanceStatuses);

// Import Excel data
router.post('/import-excel', authenticateToken, requireAdmin, superAdminController.importExcelData);

// Export data ke Excel
router.get('/export-excel', authenticateToken, requireAdmin, superAdminController.exportDataToExcel);

module.exports = router;