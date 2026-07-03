const Student      = require('../models/Student')
const Availability = require('../models/Availability')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students/me  (student auth)
// Returns the logged-in student's own profile + their tutor's info
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .select('-password')
      .populate('tutorId', 'name businessName email')

    if (!student) return res.status(404).json({ message: 'Student not found' })

    res.json({
      _id:        student._id,
      name:       student.name,
      email:      student.email,
      phone:      student.phone,
      school:     student.school,
      yearGroup:  student.yearGroup,
      subjects:   student.subjects,
      examBoard:  student.examBoard,
      goals:      student.goals,
      createdAt:  student.createdAt,
      tutor: {
        name:         student.tutorId?.name,
        businessName: student.tutorId?.businessName,
        email:        student.tutorId?.email,
      },
    })
  } catch (err) {
    console.error('getMe error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/mine  (student auth)
// Returns all sessions booked by this student
// ─────────────────────────────────────────────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await Availability.find({ bookedBy: req.user._id })
      .select('date dayOfWeek startTime endTime status lessonLength')
      .sort({ date: 1 })

    res.json(sessions)
  } catch (err) {
    console.error('getMySessions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students  (tutor auth)
// Returns all students belonging to this tutor, each with aggregated session stats
// ─────────────────────────────────────────────────────────────────────────────
const getTutorStudents = async (req, res) => {
  try {
    const students = await Student.find({ tutorId: req.user._id, isActive: true })
      .select('-password')
      .sort({ name: 1 })

    const studentIds = students.map(s => s._id)

    // Pull all booked slots for these students in one query
    const allSessions = await Availability.find({
      bookedBy: { $in: studentIds },
      slotType: 'booked',
    }).select('bookedBy status')

    // Build a stats map: { studentId -> { booked, completed, noShow } }
    const statsMap = {}
    for (const s of allSessions) {
      const id = s.bookedBy.toString()
      if (!statsMap[id]) statsMap[id] = { booked: 0, completed: 0, noShow: 0 }
      statsMap[id].booked++
      if (s.status === 'completed') statsMap[id].completed++
      if (s.status === 'no-show')   statsMap[id].noShow++
    }

    const result = students.map(s => ({
      _id:           s._id,
      name:          s.name,
      email:         s.email,
      phone:         s.phone,
      school:        s.school,
      yearGroup:     s.yearGroup,
      subjects:      s.subjects,
      examBoard:     s.examBoard,
      goals:         s.goals,
      parentName:    s.parentName,
      parentEmail:   s.parentEmail,
      parentPhone:   s.parentPhone,
      progressStage: s.progressStage || 'just-started',
      createdAt:     s.createdAt,
      sessionStats: statsMap[s._id.toString()] ?? { booked: 0, completed: 0, noShow: 0 },
    }))

    res.json(result)
  } catch (err) {
    console.error('getTutorStudents error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students/:id/sessions  (tutor auth)
// Returns the session history for one specific student (must belong to this tutor)
// ─────────────────────────────────────────────────────────────────────────────
const getStudentSessions = async (req, res) => {
  try {
    // Guard: confirm this student belongs to the requesting tutor
    const student = await Student.findOne({ _id: req.params.id, tutorId: req.user._id })
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const sessions = await Availability.find({
      bookedBy: student._id,
      slotType: 'booked',
    })
      .select('date dayOfWeek startTime endTime status lessonLength')
      .sort({ date: -1 }) // most recent first in the modal

    res.json(sessions)
  } catch (err) {
    console.error('getStudentSessions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/students/:id/progress  (tutor auth)
// Updates the progressStage field on a student
// ─────────────────────────────────────────────────────────────────────────────
const VALID_STAGES = [
  'just-started',
  'building-foundations',
  'making-progress',
  'on-track',
  'exam-ready',
  'completed',
]

const updateStudentProgress = async (req, res) => {
  try {
    const { progressStage } = req.body

    if (!VALID_STAGES.includes(progressStage)) {
      return res.status(400).json({ message: 'Invalid progress stage' })
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, tutorId: req.user._id },
      { progressStage },
      { new: true, select: '-password' }
    )

    if (!student) return res.status(404).json({ message: 'Student not found' })

    res.json({ _id: student._id, progressStage: student.progressStage })
  } catch (err) {
    console.error('updateStudentProgress error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/students/:id/profile  (tutor auth)
// Updates editable profile fields — name and email are intentionally excluded
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_PROFILE_FIELDS = [
  'phone', 'school', 'yearGroup', 'subjects',
  'examBoard', 'goals',
  'parentName', 'parentEmail', 'parentPhone',
]

const updateStudentProfile = async (req, res) => {
  try {
    // Strip any fields not in the allow-list (name, email, password stay untouched)
    const update = {}
    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, tutorId: req.user._id },
      update,
      { new: true, select: '-password', runValidators: true }
    )

    if (!student) return res.status(404).json({ message: 'Student not found' })

    res.json({
      _id:         student._id,
      phone:       student.phone,
      school:      student.school,
      yearGroup:   student.yearGroup,
      subjects:    student.subjects,
      examBoard:   student.examBoard,
      goals:       student.goals,
      parentName:  student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
    })
  } catch (err) {
    console.error('updateStudentProfile error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getMe,
  getMySessions,
  getTutorStudents,
  getStudentSessions,
  updateStudentProgress,
  updateStudentProfile,
}