const express = require('express');
const router = express.Router();
const footerController = require('../controllers/footerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get footer settings (public)
router.get('/settings', footerController.getFooterSettings);

// Get footer settings for admin
router.get('/admin/settings', authenticateToken, requireAdmin, footerController.getFooterSettingsAdmin);

// Update footer settings
router.put('/admin/settings', authenticateToken, requireAdmin, footerController.updateFooterSettings);

// Reset footer settings to default
router.post('/admin/reset', authenticateToken, requireAdmin, footerController.resetFooterSettings);

module.exports = router;