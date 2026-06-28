// server/routes/sessionRoutes.js
const express = require('express');
const router  = express.Router();

const { getMySessions } = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');

// GET /api/sessions/mine — all sessions for the logged-in student
router.get('/mine', protect, studentOnly, getMySessions);

module.exports = router;