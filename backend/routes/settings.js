const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getSetting,
  updateSetting,
  resetSettings
} = require('../controllers/settingsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all settings
router.get('/', requireRole(['admin']), getSettings);

// Update all settings
router.put('/', requireRole(['admin']), updateSettings);

// Reset settings to default
router.post('/reset', requireRole(['admin']), resetSettings);

// Get specific setting
router.get('/:key', requireRole(['admin']), getSetting);

// Update specific setting
router.put('/:key', requireRole(['admin']), updateSetting);

module.exports = router;