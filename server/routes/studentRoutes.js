const express = require('express')
const router  = express.Router()

const { protect, studentOnly, tutorOnly } = require('../middleware/authMiddleware')

const {
  getMe,
  getMySessions,
  getTutorStudents,
  getStudentSessions,
  updateStudentProgress,
  updateStudentProfile,
} = require('../controllers/studentController')

// ── Student-facing ────────────────────────────────────────────────────────────
router.get('/me',   protect, studentOnly, getMe)

// ── Tutor-facing ──────────────────────────────────────────────────────────────
// GET  /api/students          — list all of this tutor's students with session stats
// GET  /api/students/:id/sessions — session history for one student
// PATCH /api/students/:id/progress — update progressStage

router.get('/',                     protect, tutorOnly, getTutorStudents)
router.get('/:id/sessions',         protect, tutorOnly, getStudentSessions)
router.patch('/:id/progress',       protect, tutorOnly, updateStudentProgress)
router.patch('/:id/profile',        protect, tutorOnly, updateStudentProfile)

module.exports = router