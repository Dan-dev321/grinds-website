const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token, not authorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access only' })
  next()
}

const isTutor = (req, res, next) => {
  if (req.user.role !== 'tutor' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Tutor access only' })
  next()
}

const isStudentOrParent = (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'parent')
    return res.status(403).json({ message: 'Only students and parents can book slots' })
  next()
}

// alias so new admin routes work
const adminOnly = isAdmin

module.exports = { protect, isAdmin, adminOnly, isTutor, isStudentOrParent }