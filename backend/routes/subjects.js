const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all subjects
router.get('/', requireRole(['admin', 'guru']), getSubjects);

// Get subject by ID
router.get('/:id', requireRole(['admin', 'guru']), getSubjectById);

// Create new subject
router.post('/', requireRole(['admin']), createSubject);

// Update subject
router.put('/:id', requireRole(['admin']), updateSubject);

// Delete subject
router.delete('/:id', requireRole(['admin']), deleteSubject);

module.exports = router;