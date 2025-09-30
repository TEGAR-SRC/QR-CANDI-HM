const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authenticateToken, requireOperator } = require('../middleware/auth');

// Get data sekolah
router.get('/school-data', authenticateToken, requireOperator, operatorController.getSchoolData);

// Get konfigurasi sekolah
router.get('/config', authenticateToken, requireOperator, operatorController.getSchoolConfig);

// Update konfigurasi sekolah
router.put('/config', authenticateToken, requireOperator, operatorController.updateSchoolConfig);

// Bulk create users
router.post('/bulk-create-users', authenticateToken, requireOperator, operatorController.bulkCreateUsers);

// Get all users
router.get('/users', authenticateToken, requireOperator, operatorController.getAllUsers);

module.exports = router;