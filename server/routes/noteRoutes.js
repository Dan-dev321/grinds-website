const express = require('express')
const router  = express.Router()

const { protect, tutorOnly } = require('../middleware/authMiddleware')
const requireSubscription    = require('../middleware/requireSubscription')

const {
  completeSession,
  getNotebookStudents,
  getStudentNotes,
  updateEntry,
} = require('../controllers/noteController')

// ── Read — always allowed ─────────────────────────────────────────────────────
router.get('/students',                          protect, tutorOnly, getNotebookStudents)
router.get('/student/:studentId',                protect, tutorOnly, getStudentNotes)

// ── Write — blocked if trial expired or cancelled ─────────────────────────────
router.put('/complete/:id',                      protect, tutorOnly, requireSubscription, completeSession)
router.put('/student/:studentId/entry/:entryId', protect, tutorOnly, requireSubscription, updateEntry)

module.exports = router