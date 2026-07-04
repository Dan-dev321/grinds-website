const express = require('express')
const router = express.Router()
const verifyCronSecret = require('../middleware/verifyCronSecret')
const { sendSessionReminders, sendTrialReminders } = require('../controllers/cronController')

router.post('/send-session-reminders', verifyCronSecret, sendSessionReminders)
router.post('/send-trial-reminders', verifyCronSecret, sendTrialReminders)

module.exports = router