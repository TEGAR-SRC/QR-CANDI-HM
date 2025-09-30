const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all students
router.get('/', requireRole(['admin', 'guru']), getStudents);

// Get student by ID
router.get('/:id', requireRole(['admin', 'guru']), getStudentById);

// Create new student
router.post('/', requireRole(['admin']), createStudent);

// Update student
router.put('/:id', requireRole(['admin']), updateStudent);

// Delete student
router.delete('/:id', requireRole(['admin']), deleteStudent);

module.exports = router;