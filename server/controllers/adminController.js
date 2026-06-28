const User = require('../models/User')
const Availability = require('../models/Availability')

// ─────────────────────────────────────────────
//  GET /api/admin/stats  →  dashboard overview
// ─────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const toDateStr = (d) => d.toISOString().split('T')[0]
    const weekStartStr = toDateStr(weekStart)
    const weekEndStr   = toDateStr(weekEnd)

    const [totalStudents, totalTutors, totalAdmins] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'tutor'   }),
      User.countDocuments({ role: 'admin'   }),
    ])

    const activeStudentIds = await Availability.distinct('bookedBy', {
      slotType: 'booked',
      bookedBy: { $ne: null },
    })
    const activeStudents = activeStudentIds.length

    const [sessionStats] = await Availability.aggregate([
      { $match: { slotType: 'booked' } },
      {
        $facet: {
          bookedThisWeek:    [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr } } }, { $count: 'count' }],
          completedThisWeek: [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr }, status: 'completed' } }, { $count: 'count' }],
          noShowsThisWeek:   [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr }, status: 'no-show'   } }, { $count: 'count' }],
          totalSessions:     [{ $count: 'count' }],
          totalCompleted:    [{ $match: { status: 'completed' } }, { $count: 'count' }],
          totalNoShows:      [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
        },
      },
    ])

    const pluck = (arr) => arr?.[0]?.count ?? 0

    res.json({
      totalStudents,
      totalTutors,
      totalAdmins,
      activeStudents,
      bookedThisWeek:    pluck(sessionStats.bookedThisWeek),
      completedThisWeek: pluck(sessionStats.completedThisWeek),
      noShowsThisWeek:   pluck(sessionStats.noShowsThisWeek),
      totalSessions:     pluck(sessionStats.totalSessions),
      totalCompleted:    pluck(sessionStats.totalCompleted),
      totalNoShows:      pluck(sessionStats.totalNoShows),
    })
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ message: 'Failed to load stats' })
  }
}

// ─────────────────────────────────────────────
//  GET /api/admin/stats/student/:id
// ─────────────────────────────────────────────
const getStudentStats = async (req, res) => {
  try {
    const { id } = req.params
    const todayStr = new Date().toISOString().split('T')[0]

    // Week boundaries
    const now = new Date()
    const diffToMon = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr   = weekEnd.toISOString().split('T')[0]

    const mongoose = require('mongoose')
    const studentObjId = new mongoose.Types.ObjectId(id)

    const [sessionStats] = await Availability.aggregate([
      { $match: { slotType: 'booked', bookedBy: studentObjId } },
      {
        $facet: {
          total:        [{ $count: 'count' }],
          upcoming:     [{ $match: { date: { $gte: todayStr } } }, { $count: 'count' }],
          completed:    [{ $match: { status: 'completed' } }, { $count: 'count' }],
          noShows:      [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
          thisWeek:     [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr } } }, { $count: 'count' }],
          // Group by tutor to find favourite
          byTutor:      [{ $group: { _id: '$tutor', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }],
          // Last 5 sessions
          recent:       [{ $sort: { date: -1, startTime: -1 } }, { $limit: 5 },
                         { $lookup: { from: 'users', localField: 'tutor', foreignField: '_id', as: 'tutorInfo' } }],
        },
      },
    ])

    const pluck = (arr) => arr?.[0]?.count ?? 0

    // Resolve favourite tutor name
    let favouriteTutor = 'N/A'
    if (sessionStats.byTutor?.[0]?._id) {
      const tutor = await User.findById(sessionStats.byTutor[0]._id).select('name')
      if (tutor) favouriteTutor = tutor.name
    }

    // Clean up recent sessions
    const recentSessions = (sessionStats.recent || []).map(s => ({
      date:      s.date,
      startTime: s.startTime,
      endTime:   s.endTime,
      status:    s.status,
      tutor:     s.tutorInfo?.[0]?.name || 'Unknown',
    }))

    res.json({
      totalSessions:  pluck(sessionStats.total),
      upcoming:       pluck(sessionStats.upcoming),
      completed:      pluck(sessionStats.completed),
      noShows:        pluck(sessionStats.noShows),
      thisWeek:       pluck(sessionStats.thisWeek),
      favouriteTutor,
      recentSessions,
    })
  } catch (err) {
    console.error('getStudentStats error:', err)
    res.status(500).json({ message: 'Failed to load student stats' })
  }
}

// ─────────────────────────────────────────────
//  GET /api/admin/stats/tutor/:id
// ─────────────────────────────────────────────
const getTutorStats = async (req, res) => {
  try {
    const { id } = req.params
    const todayStr = new Date().toISOString().split('T')[0]

    const now = new Date()
    const diffToMon = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr   = weekEnd.toISOString().split('T')[0]

    const mongoose = require('mongoose')
    const tutorObjId = new mongoose.Types.ObjectId(id)

    const [sessionStats] = await Availability.aggregate([
      { $match: { slotType: 'booked', tutor: tutorObjId } },
      {
        $facet: {
          total:     [{ $count: 'count' }],
          upcoming:  [{ $match: { date: { $gte: todayStr } } }, { $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          noShows:   [{ $match: { status: 'no-show'   } }, { $count: 'count' }],
          thisWeek:  [{ $match: { date: { $gte: weekStartStr, $lte: weekEndStr } } }, { $count: 'count' }],
          // Unique students
          uniqueStudents: [{ $group: { _id: '$bookedBy' } }, { $count: 'count' }],
          // Last 5 sessions
          recent: [{ $sort: { date: -1, startTime: -1 } }, { $limit: 5 },
                   { $lookup: { from: 'users', localField: 'bookedBy', foreignField: '_id', as: 'studentInfo' } }],
        },
      },
    ])

    // Total slots created (available + booked) — separate query, different base match
    const totalSlotsCreated = await Availability.countDocuments({
      tutor: tutorObjId,
      slotType: { $in: ['available', 'booked'] },
    })

    const pluck = (arr) => arr?.[0]?.count ?? 0

    const recentSessions = (sessionStats.recent || []).map(s => ({
      date:      s.date,
      startTime: s.startTime,
      endTime:   s.endTime,
      status:    s.status,
      student:   s.studentInfo?.[0]?.name || 'Unknown',
    }))

    res.json({
      totalSlotsCreated,
      totalSessions:  pluck(sessionStats.total),
      upcoming:       pluck(sessionStats.upcoming),
      completed:      pluck(sessionStats.completed),
      noShows:        pluck(sessionStats.noShows),
      thisWeek:       pluck(sessionStats.thisWeek),
      uniqueStudents: pluck(sessionStats.uniqueStudents),
      recentSessions,
    })
  } catch (err) {
    console.error('getTutorStats error:', err)
    res.status(500).json({ message: 'Failed to load tutor stats' })
  }
}

module.exports = { getStats, getStudentStats, getTutorStats }