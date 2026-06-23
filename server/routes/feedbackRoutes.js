const express = require('express')
const router = express.Router()
const { protect, isAdmin, isStudentOrParent } = require('../middleware/authMiddleware')
const {
  submitFeedback,
  getApprovedFeedback,
  getAllFeedback,
  approveFeedback,
  deleteFeedback,
  getMyFeedback
} = require('../controllers/feedbackController')

// ── Public ───────────────────────────────────────────────────────
router.get('/', getApprovedFeedback)                              // Anyone: view approved reviews

// ── Specific routes BEFORE /:id ──────────────────────────────────
router.get('/all', protect, isAdmin, getAllFeedback)              // Admin: all feedback
router.get('/my-feedback', protect, getMyFeedback)               // Student: their own feedback

// ── Actions ──────────────────────────────────────────────────────
router.post('/', protect, isStudentOrParent, submitFeedback)     // Student/Parent: submit
router.put('/:id/approve', protect, isAdmin, approveFeedback)    // Admin: approve
router.delete('/:id', protect, isAdmin, deleteFeedback)          // Admin: delete

module.exports = router