const express = require('express')
const router  = express.Router()

const { protect, studentOnly } = require('../middleware/authMiddleware')
const requireSubscription      = require('../middleware/requireSubscription')

const { getMySessions } = require('../controllers/studentController')

// ── Read — always allowed ─────────────────────────────────────────────────────
// Students can always view their own session history
router.get('/mine', protect, studentOnly, getMySessions)

module.exports = router