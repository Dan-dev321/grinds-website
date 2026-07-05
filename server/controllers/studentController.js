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
      _id:       student._id,
      name:      student.name,
      email:     student.email,
      phone:     student.phone,
      school:    student.school,
      yearGroup: student.yearGroup,
      subjects:  student.subjects,
      examBoard: student.examBoard,
      goals:     student.goals,
      createdAt: student.createdAt,
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
// ─────────────────────────────────────────────────────────────────────────────
const getStudentAnalytics = async (req, res) => {
  try {
    // ── Optional time range filter via ?days=30|90|180|all ───────────────────
    const { days } = req.query
    const cutoff = days && days !== 'all'
      ? new Date(Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10)          // "YYYY-MM-DD" string for comparison
      : null

    const students = await Student.find({ tutorId: req.user._id, isActive: true })
      .select('_id name email yearGroup createdAt')

    const studentIds = students.map(s => s._id)

    // All booked sessions — optionally filtered by date cutoff
    const sessionQuery = {
      bookedBy: { $in: studentIds },
      slotType: 'booked',
      ...(cutoff && { date: { $gte: cutoff } }),
    }

    const sessions = await Availability.find(sessionQuery)
      .select('date dayOfWeek startTime status lessonLength bookedBy bufferMinutes')

    // ── Upcoming sessions in next 7 / 14 / 30 days ───────────────────────────
    const today     = new Date().toISOString().slice(0, 10)
    const in7days   = new Date(Date.now() +  7 * 86400000).toISOString().slice(0, 10)
    const in14days  = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    const in30days  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

    // Query upcoming separately (always all-time — not affected by range filter)
    const upcomingSessions = await Availability.find({
      tutor:    req.user._id,
      slotType: 'booked',
      status:   'upcoming',
      date:     { $gte: today },
    }).select('date bookedBy lessonLength')

    const upcomingNext7  = upcomingSessions.filter(s => s.date <= in7days).length
    const upcomingNext14 = upcomingSessions.filter(s => s.date <= in14days).length
    const upcomingNext30 = upcomingSessions.filter(s => s.date <= in30days).length

    // ── Hours taught ──────────────────────────────────────────────────────────
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const totalMinutes      = completedSessions.reduce((acc, s) => acc + (s.lessonLength ?? 60), 0)

    // ── Average lesson length ─────────────────────────────────────────────────
    const avgLessonLength = completedSessions.length
      ? +(completedSessions.reduce((acc, s) => acc + (s.lessonLength ?? 60), 0) / completedSessions.length).toFixed(0)
      : null

    // ── Completion rate ───────────────────────────────────────────────────────
    const decided        = sessions.filter(s => s.status !== 'upcoming')
    const completedCount = decided.filter(s => s.status === 'completed').length
    const noShowCount    = decided.filter(s => s.status === 'no-show').length
    const completionRate = decided.length
      ? Math.round((completedCount / decided.length) * 100)
      : null

    // ── Avg sessions per student ──────────────────────────────────────────────
    const avgSessionsPerStudent = students.length
      ? +(completedSessions.length / students.length).toFixed(1)
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
    for (const s of completedSessions) {
      const [year, month] = s.date.split('-')
      const key = `${year}-${month}`
      monthMap[key] = (monthMap[key] ?? 0) + 1
    }
    const sessionsByMonth = Object.entries(monthMap)
      .map(([key, count]) => ({ month: key, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // ── No-show rate by month ─────────────────────────────────────────────────
    const noShowMonthMap = {}
    const decidedMonthMap = {}
    for (const s of decided) {
      const [year, month] = s.date.split('-')
      const key = `${year}-${month}`
      decidedMonthMap[key] = (decidedMonthMap[key] ?? 0) + 1
      if (s.status === 'no-show') {
        noShowMonthMap[key] = (noShowMonthMap[key] ?? 0) + 1
      }
    }
    const noShowRateByMonth = Object.keys(decidedMonthMap)
      .sort()
      .map(key => ({
        month:   key,
        rate:    Math.round(((noShowMonthMap[key] ?? 0) / decidedMonthMap[key]) * 100),
        noShows: noShowMonthMap[key] ?? 0,
        total:   decidedMonthMap[key],
      }))

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

    // ── Year group breakdown ──────────────────────────────────────────────────
    const yearGroupMap = {}
    for (const s of students) {
      const yg = s.yearGroup?.trim() || 'Unknown'
      yearGroupMap[yg] = (yearGroupMap[yg] ?? 0) + 1
    }
    const yearGroupBreakdown = Object.entries(yearGroupMap)
      .map(([yearGroup, count]) => ({ yearGroup, count }))
      .sort((a, b) => b.count - a.count)

    // ── Most active students (by completed sessions) ──────────────────────────
    const studentSessionMap = {}
    for (const s of completedSessions) {
      const id = s.bookedBy.toString()
      studentSessionMap[id] = (studentSessionMap[id] ?? 0) + 1
    }
    const mostActiveStudents = students
      .map(s => ({
        _id:      s._id,
        name:     s.name,
        email:    s.email,
        sessions: studentSessionMap[s._id.toString()] ?? 0,
      }))
      .filter(s => s.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)

    // ── Days between last lesson per student ──────────────────────────────────
    // Use ALL completed sessions regardless of range filter for last-seen accuracy
    const allCompletedSessions = await Availability.find({
      bookedBy: { $in: studentIds },
      slotType: 'booked',
      status:   'completed',
    }).select('date bookedBy')

    const lastSessionMap = {}
    for (const s of allCompletedSessions) {
      const id = s.bookedBy.toString()
      if (!lastSessionMap[id] || s.date > lastSessionMap[id]) {
        lastSessionMap[id] = s.date
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const daysBetweenLastLesson = students
      .map(s => {
        const lastDate = lastSessionMap[s._id.toString()]
        if (!lastDate) return { _id: s._id, name: s.name, email: s.email, lastDate: null, daysSince: null }
        const diff = Math.floor(
          (new Date(todayStr) - new Date(lastDate)) / 86400000
        )
        return { _id: s._id, name: s.name, email: s.email, lastDate, daysSince: diff }
      })
      .filter(s => s.daysSince !== null)
      .sort((a, b) => b.daysSince - a.daysSince)

    res.json({
      // ── Top-level numbers ──
      totalStudents:        students.length,
      totalMinutes,
      totalHours:           +(totalMinutes / 60).toFixed(1),
      avgLessonLength,
      completionRate,
      completedCount,
      noShowCount,
      avgSessionsPerStudent,

      // ── Upcoming load ──
      upcomingNext7,
      upcomingNext14,
      upcomingNext30,

      // ── Charts ──
      sessionsByDay,
      sessionsByHour,
      sessionsByMonth,
      noShowRateByMonth,
      newStudentsByMonth,
      yearGroupBreakdown,

      // ── Leaderboard & risk ──
      mostActiveStudents,
      daysBetweenLastLesson,
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