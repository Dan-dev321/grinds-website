const express = require('express')
const router  = express.Router()

const { protect, tutorOnly } = require('../middleware/authMiddleware')
const {
  getTopics,
  createTopic,
  updateEntryTopics,
} = require('../controllers/topicController')

// ── Library management ─────────────────────────────────────────────────────
router.get('/',  protect, tutorOnly, getTopics)
router.post('/', protect, tutorOnly, createTopic)

// ── Attach ratings to a specific notebook entry ────────────────────────────
router.put('/student/:studentId/entry/:entryId', protect, tutorOnly, updateEntryTopics)

module.exports = router