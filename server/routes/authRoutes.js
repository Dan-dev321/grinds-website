const express = require('express')
const router  = express.Router()
const { registerTutor, registerStudent, login } = require('../controllers/authController')

router.post('/register/tutor',   registerTutor)
router.post('/register/student', registerStudent)
router.post('/login',            login)

module.exports = router