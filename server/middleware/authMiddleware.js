const jwt     = require('jsonwebtoken')
const Tutor   = require('../models/Tutor')
const Student = require('../models/Student')
const Owner   = require('../models/Owner')

const protect = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorised' })

  try {
    const token   = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the right account type
    if (decoded.role === 'tutor') {
      req.user = await Tutor.findById(decoded.id).select('-password')
    } else if (decoded.role === 'student') {
      req.user = await Student.findById(decoded.id).select('-password')
    } else if (decoded.role === 'owner') {
      req.user = await Owner.findById(decoded.id).select('-password')
    }

    if (!req.user) return res.status(401).json({ message: 'Not authorised' })

    req.role = decoded.role
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

const tutorOnly  = (req, res, next) =>
  req.role === 'tutor'  ? next() : res.status(403).json({ message: 'Tutors only' })

const studentOnly = (req, res, next) =>
  req.role === 'student' ? next() : res.status(403).json({ message: 'Students only' })

const ownerOnly  = (req, res, next) =>
  req.role === 'owner'  ? next() : res.status(403).json({ message: 'Owner only' })

module.exports = { protect, tutorOnly, studentOnly, ownerOnly }