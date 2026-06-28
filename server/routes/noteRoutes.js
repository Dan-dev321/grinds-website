const express = require('express')
const router = express.Router()
const { protect, isTutor } = require('../middleware/authMiddleware')
const {
  completeSession,
  getNotebookStudents,
  getStudentNotes,
  updateEntry
} = require('../controllers/noteController')

// Mark a session complete (triggers notebook entry)
router.put('/complete/:id',                    protect, isTutor, completeSession)

// Get sidebar list of students
router.get('/students',                        protect, isTutor, getNotebookStudents)

// Get one student's full notes
router.get('/student/:studentId',              protect, isTutor, getStudentNotes)

// Update a specific session entry's notes
router.put('/student/:studentId/entry/:entryId', protect, isTutor, updateEntry)

module.exports = router