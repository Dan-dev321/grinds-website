const express = require('express')
const router  = express.Router()

const { protect, studentOnly, tutorOnly } = require('../middleware/authMiddleware')
const requireSubscription                 = require('../middleware/requireSubscription')

const {
  getMe,
  getMySessions,
  getTutorStudents,
  getStudentSessions,
  updateStudentProgress,
  updateStudentProfile,
  getStudentAnalytics,
} = require('../controllers/studentController')

// ── Student-facing ────────────────────────────────────────────────────────────
router.get('/me',   protect, studentOnly, getMe)          // ← add this
router.get('/mine', protect, studentOnly, getMySessions)

// ── Tutor-facing — static paths BEFORE /:id ───────────────────────────────────
router.get('/analytics', protect, requireSubscription, getStudentAnalytics)
router.get('/',          protect, requireSubscription, getTutorStudents)

// ── Tutor-facing — dynamic /:id paths ─────────────────────────────────────────
router.get   ('/:id/sessions',  protect, requireSubscription, getStudentSessions)
router.patch ('/:id/progress',  protect, requireSubscription, updateStudentProgress)
router.patch ('/:id/profile',   protect, requireSubscription, updateStudentProfile)

module.exports = router