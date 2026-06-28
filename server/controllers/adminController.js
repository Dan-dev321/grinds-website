const Tutor        = require('../models/Tutor')
const Student      = require('../models/Student')
const Availability = require('../models/Availability')
const mongoose     = require('mongoose')

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/stats  →  platform overview for Owner
// ─────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const now      = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Week boundaries (Mon–Sun)
    const diffToMon = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr   = weekEnd.toISOString().split('T')[0]

    const [
      totalTutors,
      activeTutors,
      trialTutors,
      totalStudents,
    ] = await Promise.all([
      Tutor.countDocuments(),
      Tutor.countDocuments({ 'subscription.status': 'active' }),
      Tutor.countDocuments({ 'subscription.status': 'trial'  }),
      Student.countDocuments(),
    ])

    // Session stats from Availability
    const [sessionStats] = await Availability.aggregate([
      { $match: { slotType: 'booked' } },
      {
        $facet: {
          totalSessions:     [{ $count: 'count' }],
          totalCompleted:    [{ $match: { status: 'completed' } }, { $count: 'count' }],
          totalNoShows:      [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
          bookedThisWeek:    [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr } } }, { $count: 'count' }],
          completedThisWeek: [
            { $match: { date: { $gte: weekStartStr, $lte: weekEndStr }, status: 'completed' } },
            { $count: 'count' },
          ],
          todaysSessions:    [{ $match: { date: todayStr } }, { $count: 'count' }],
        },
      },
    ])

    const pluck = (arr) => arr?.[0]?.count ?? 0

    res.json({
      // Tutor counts
      totalTutors,
      activeTutors,
      trialTutors,
      cancelledTutors: totalTutors - activeTutors - trialTutors,

      // Student counts
      totalStudents,

      // Session counts
      totalSessions:     pluck(sessionStats.totalSessions),
      totalCompleted:    pluck(sessionStats.totalCompleted),
      totalNoShows:      pluck(sessionStats.totalNoShows),
      bookedThisWeek:    pluck(sessionStats.bookedThisWeek),
      completedThisWeek: pluck(sessionStats.completedThisWeek),
      todaysSessions:    pluck(sessionStats.todaysSessions),
    })
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ message: 'Failed to load platform stats' })
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/stats/tutor/:id
// ─────────────────────────────────────────────────────────────
const getTutorStats = async (req, res) => {
  try {
    const tutorObjId = new mongoose.Types.ObjectId(req.params.id)
    const todayStr   = new Date().toISOString().split('T')[0]

    const now = new Date()
    const diffToMon = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr   = weekEnd.toISOString().split('T')[0]

    const tutor = await Tutor.findById(tutorObjId).select('-password')
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' })

    const studentCount = await Student.countDocuments({ tutorId: tutorObjId })

    const [sessionStats] = await Availability.aggregate([
      { $match: { tutorId: tutorObjId, slotType: 'booked' } },
      {
        $facet: {
          total:     [{ $count: 'count' }],
          upcoming:  [{ $match: { date: { $gte: todayStr } } }, { $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          noShows:   [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
          thisWeek:  [
            { $match: { date: { $gte: weekStartStr, $lte: weekEndStr } } },
            { $count: 'count' },
          ],
          recent: [
            { $sort: { date: -1 } },
            { $limit: 5 },
            { $lookup: {
                from:         'students',
                localField:   'studentId',
                foreignField: '_id',
                as:           'studentInfo',
            }},
          ],
        },
      },
    ])

    const pluck = (arr) => arr?.[0]?.count ?? 0

    const recentSessions = (sessionStats.recent || []).map(s => ({
      date:      s.date,
      startTime: s.startTime,
      endTime:   s.endTime,
      status:    s.status,
      student:   s.studentInfo?.[0]?.name || 'Unknown',
    }))

    res.json({
      tutor: {
        name:         tutor.name,
        email:        tutor.email,
        businessName: tutor.businessName,
        inviteCode:   tutor.inviteCode,
        isActive:     tutor.isActive,
        subscription: tutor.subscription,
        createdAt:    tutor.createdAt,
      },
      studentCount,
      totalSessions:  pluck(sessionStats.total),
      upcoming:       pluck(sessionStats.upcoming),
      completed:      pluck(sessionStats.completed),
      noShows:        pluck(sessionStats.noShows),
      thisWeek:       pluck(sessionStats.thisWeek),
      recentSessions,
    })
  } catch (err) {
    console.error('getTutorStats error:', err)
    res.status(500).json({ message: 'Failed to load tutor stats' })
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/stats/student/:id
// ─────────────────────────────────────────────────────────────
const getStudentStats = async (req, res) => {
  try {
    const studentObjId = new mongoose.Types.ObjectId(req.params.id)
    const todayStr     = new Date().toISOString().split('T')[0]

    const student = await Student.findById(studentObjId)
      .select('-password')
      .populate('tutorId', 'name email')
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const [sessionStats] = await Availability.aggregate([
      { $match: { studentId: studentObjId, slotType: 'booked' } },
      {
        $facet: {
          total:     [{ $count: 'count' }],
          upcoming:  [{ $match: { date: { $gte: todayStr } } }, { $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          noShows:   [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
          recent: [
            { $sort: { date: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ])

    const pluck = (arr) => arr?.[0]?.count ?? 0

    res.json({
      student: {
        name:      student.name,
        email:     student.email,
        tutor:     student.tutorId,
        createdAt: student.createdAt,
      },
      totalSessions: pluck(sessionStats.total),
      upcoming:      pluck(sessionStats.upcoming),
      completed:     pluck(sessionStats.completed),
      noShows:       pluck(sessionStats.noShows),
      recentSessions: sessionStats.recent || [],
    })
  } catch (err) {
    console.error('getStudentStats error:', err)
    res.status(500).json({ message: 'Failed to load student stats' })
  }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/admin/tutors/:id/toggle
//  Owner can enable/disable a tutor account
// ─────────────────────────────────────────────────────────────
const toggleTutorActive = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' })

    tutor.isActive = !tutor.isActive
    await tutor.save()

    res.json({
      message:  `Tutor ${tutor.isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: tutor.isActive,
    })
  } catch (err) {
    console.error('toggleTutorActive error:', err)
    res.status(500).json({ message: 'Failed to toggle tutor status' })
  }
}

module.exports = { getStats, getTutorStats, getStudentStats, toggleTutorActive }