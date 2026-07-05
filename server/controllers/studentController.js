const Student      = require('../models/Student')
const Availability = require('../models/Availability')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students/me  (student auth)
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
// ─────────────────────────────────────────────────────────────────────────────
const getTutorStudents = async (req, res) => {
  try {
    const students = await Student.find({ tutorId: req.user._id, isActive: true })
      .select('-password')
      .sort({ name: 1 })

    const studentIds = students.map(s => s._id)

    const allSessions = await Availability.find({
      bookedBy: { $in: studentIds },
      slotType: 'booked',
    }).select('bookedBy status')

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
      sessionStats:  statsMap[s._id.toString()] ?? { booked: 0, completed: 0, noShow: 0 },
    }))

    res.json(result)
  } catch (err) {
    console.error('getTutorStudents error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students/:id/sessions  (tutor auth)
// ─────────────────────────────────────────────────────────────────────────────
const getStudentSessions = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, tutorId: req.user._id })
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const sessions = await Availability.find({
      bookedBy: student._id,
      slotType: 'booked',
    })
      .select('date dayOfWeek startTime endTime status lessonLength')
      .sort({ date: -1 })

    res.json(sessions)
  } catch (err) {
    console.error('getStudentSessions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/students/:id/progress  (tutor auth)
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
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_PROFILE_FIELDS = [
  'phone', 'school', 'yearGroup', 'subjects',
  'examBoard', 'goals',
  'parentName', 'parentEmail', 'parentPhone',
]

const updateStudentProfile = async (req, res) => {
  try {
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/students/analytics  (tutor auth)
// Returns aggregate data for the tutor's Overview analytics panel
// ─────────────────────────────────────────────────────────────────────────────
const getStudentAnalytics = async (req, res) => {
  try {
    const students = await Student.find({ tutorId: req.user._id, isActive: true })
      .select('_id createdAt')

    const studentIds = students.map(s => s._id)

    const sessions = await Availability.find({
      bookedBy: { $in: studentIds },
      slotType: 'booked',
    }).select('date dayOfWeek startTime status lessonLength')

    // ── Hours taught ──────────────────────────────────────────────────────────
    const totalMinutes = sessions
      .filter(s => s.status === 'completed')
      .reduce((acc, s) => acc + (s.lessonLength ?? 60), 0)

    // ── Completion rate ───────────────────────────────────────────────────────
    const decided        = sessions.filter(s => s.status !== 'upcoming')
    const completedCount = decided.filter(s => s.status === 'completed').length
    const completionRate = decided.length
      ? Math.round((completedCount / decided.length) * 100)
      : null

    // ── Sessions per day of week ──────────────────────────────────────────────
    const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    const dayMap = Object.fromEntries(DAYS.map(d => [d, 0]))
    for (const s of sessions) {
      if (s.dayOfWeek && dayMap[s.dayOfWeek] !== undefined) dayMap[s.dayOfWeek]++
    }
    const sessionsByDay = DAYS.map(d => ({ day: d, count: dayMap[d] }))

    // ── Sessions per hour bucket ──────────────────────────────────────────────
    const hourMap = {}
    for (const s of sessions) {
      if (!s.startTime) continue
      const hour = parseInt(s.startTime.split(':')[0], 10)
      if (isNaN(hour)) continue
      hourMap[hour] = (hourMap[hour] ?? 0) + 1
    }
    const sessionsByHour = Object.entries(hourMap)
      .map(([hour, count]) => ({
        hour:  parseInt(hour, 10),
        label: `${hour.toString().padStart(2, '0')}:00`,
        count,
      }))
      .sort((a, b) => a.hour - b.hour)

    // ── Completed sessions by month ───────────────────────────────────────────
    const monthMap = {}
    for (const s of sessions.filter(s => s.status === 'completed')) {
      const [year, month] = s.date.split('-')
      const key = `${year}-${month}`
      monthMap[key] = (monthMap[key] ?? 0) + 1
    }
    const sessionsByMonth = Object.entries(monthMap)
      .map(([key, count]) => ({ month: key, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // ── New students by month ─────────────────────────────────────────────────
    const newStudentMap = {}
    for (const s of students) {
      const d   = new Date(s.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      newStudentMap[key] = (newStudentMap[key] ?? 0) + 1
    }
    const newStudentsByMonth = Object.entries(newStudentMap)
      .map(([key, count]) => ({ month: key, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    res.json({
      totalMinutes,
      totalHours:      +(totalMinutes / 60).toFixed(1),
      completionRate,
      totalSessions:   sessions.length,
      completedCount,
      noShowCount:     decided.length - completedCount,
      sessionsByDay,
      sessionsByHour,
      sessionsByMonth,
      newStudentsByMonth,
    })
  } catch (err) {
    console.error('getStudentAnalytics error:', err)
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
  getStudentAnalytics,
}