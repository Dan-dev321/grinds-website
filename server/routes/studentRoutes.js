// server/routes/studentRoutes.js
const express = require('express');
const router  = express.Router();

const { getMe, getMySessions } = require('../controllers/studentController');
const { protect, studentOnly }  = require('../middleware/authMiddleware');

// GET /api/students/me — student's own profile + tutor info
router.get('/me', protect, studentOnly, getMe);

module.exports = router;