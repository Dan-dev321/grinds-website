const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const User = require('../models/User')
const Availability = require('../models/Availability')
const Feedback = require('../models/Feedback')
const { getStats, getStudentStats, getTutorStats } = require('../controllers/adminController')

// GET /api/admin/stats
router.get('/stats',                protect, adminOnly, getStats)

// GET /api/admin/stats/student/:id
router.get('/stats/student/:id',    protect, adminOnly, getStudentStats)

// GET /api/admin/stats/tutor/:id
router.get('/stats/tutor/:id',      protect, adminOnly, getTutorStats)

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users' })
  }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

module.exports = router