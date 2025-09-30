const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teachersController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all teachers
router.get('/', requireRole(['admin']), getTeachers);

// Get teacher by ID
router.get('/:id', requireRole(['admin']), getTeacherById);

// Create new teacher
router.post('/', requireRole(['admin']), createTeacher);

// Update teacher
router.put('/:id', requireRole(['admin']), updateTeacher);

// Delete teacher
router.delete('/:id', requireRole(['admin']), deleteTeacher);

module.exports = router;