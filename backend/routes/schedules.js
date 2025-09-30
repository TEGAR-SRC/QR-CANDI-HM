const express = require('express');
const router = express.Router();
const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/schedulesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schedules
router.get('/', requireRole(['admin', 'guru']), getSchedules);

// Get schedule by ID
router.get('/:id', requireRole(['admin', 'guru']), getScheduleById);

// Create new schedule
router.post('/', requireRole(['admin']), createSchedule);

// Update schedule
router.put('/:id', requireRole(['admin']), updateSchedule);

// Delete schedule
router.delete('/:id', requireRole(['admin']), deleteSchedule);

module.exports = router;