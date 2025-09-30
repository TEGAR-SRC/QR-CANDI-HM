const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getStudentsInClass
} = require('../controllers/classesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all classes
router.get('/', requireRole(['admin', 'guru']), getClasses);

// Get class by ID
router.get('/:id', requireRole(['admin', 'guru']), getClassById);

// Get students in a class
router.get('/:id/students', requireRole(['admin', 'guru']), getStudentsInClass);

// Create new class
router.post('/', requireRole(['admin']), createClass);

// Update class
router.put('/:id', requireRole(['admin']), updateClass);

// Delete class
router.delete('/:id', requireRole(['admin']), deleteClass);

module.exports = router;