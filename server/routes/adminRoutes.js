const express = require('express')
const router  = express.Router()

const { protect, ownerOnly } = require('../middleware/authMiddleware')
const { getStats, getTutorStats, getStudentStats, toggleTutorActive } = require('../controllers/adminController')

// ── Platform stats overview ───────────────────────────────────
router.get('/stats',                 protect, ownerOnly, getStats)

// ── Per-tutor stats ───────────────────────────────────────────
router.get('/stats/tutor/:id',       protect, ownerOnly, getTutorStats)

// ── Per-student stats ─────────────────────────────────────────
router.get('/stats/student/:id',     protect, ownerOnly, getStudentStats)

// ── List all tutors ───────────────────────────────────────────
router.get('/tutors',                protect, ownerOnly, async (req, res) => {
  try {
    const Tutor = require('../models/Tutor')
    const tutors = await Tutor.find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json(tutors)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load tutors' })
  }
})

// ── List all students ─────────────────────────────────────────
router.get('/students',              protect, ownerOnly, async (req, res) => {
  try {
    const Student = require('../models/Student')
    const students = await Student.find()
      .select('-password')
      .populate('tutorId', 'name email')
      .sort({ createdAt: -1 })
    res.json(students)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load students' })
  }
})

// ── Enable / disable a tutor account ─────────────────────────
router.patch('/tutors/:id/toggle',   protect, ownerOnly, toggleTutorActive)

module.exports = router