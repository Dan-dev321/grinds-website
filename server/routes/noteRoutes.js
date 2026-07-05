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

const { markNoShow } = require('../controllers/availabilityController')

// ── PDF export temporarily disabled (puppeteer install issue on Render) ────
const {
  exportStudentPDF,
  exportEntryPDF,
} = require('../controllers/pdfController')

// ── Read — always allowed ─────────────────────────────────────────────────
router.get('/students',                          protect, tutorOnly, getNotebookStudents)
router.get('/student/:studentId',                protect, tutorOnly, getStudentNotes)

// ── PDF export — read-only, always allowed ────────────────────────────────
router.get('/student/:studentId/export',                     protect, tutorOnly, exportStudentPDF)
router.get('/student/:studentId/entry/:entryId/export',      protect, tutorOnly, exportEntryPDF)

// ── Write — blocked if trial expired or cancelled ─────────────────────────
router.put('/complete/:id',                      protect, tutorOnly, requireSubscription, completeSession)
router.put('/no-show/:id',                       protect, tutorOnly, requireSubscription, markNoShow)
router.put('/student/:studentId/entry/:entryId', protect, tutorOnly, requireSubscription, updateEntry)

module.exports = router