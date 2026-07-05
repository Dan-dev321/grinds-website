const express = require('express')
const router  = express.Router()

const { protect, studentOnly } = require('../middleware/authMiddleware')
const requireSubscription      = require('../middleware/requireSubscription')

const {
  getMe,
  getMySessions,
  getTutorStudents,
  getStudentSessions,
  updateStudentProgress,
  updateStudentProfile,
  getStudentAnalytics,
} = require('../controllers/studentController')

// ── Student-facing routes ─────────────────────────────────────────────────────
router.get('/mine', protect, studentOnly, getMySessions)

// ── Tutor-facing routes ───────────────────────────────────────────────────────
// ⚠️  /analytics and other static paths MUST come before /:id to avoid
//     Express treating "analytics" as a dynamic param value
router.get('/analytics', protect, requireSubscription, getStudentAnalytics)
router.get('/',          protect, requireSubscription, getTutorStudents)
router.get('/:id/sessions', protect, requireSubscription, getStudentSessions)
router.patch('/:id/progress', protect, requireSubscription, updateStudentProgress)
router.patch('/:id/profile',  protect, requireSubscription, updateStudentProfile)

module.exports = router