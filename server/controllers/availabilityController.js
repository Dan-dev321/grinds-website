const Availability = require('../models/Availability')

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toMins = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const toTime = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, '0')
  const m = String(mins % 60).padStart(2, '0')
  return `${h}:${m}`
}

const getDayOfWeek = (dateStr) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const [year, month, day] = dateStr.split('-').map(Number)
  return days[new Date(year, month - 1, day).getDay()]
}

// Add N days to a 'YYYY-MM-DD' string, returns 'YYYY-MM-DD'
const addDaysToDateStr = (dateStr, days) => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, mo - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

const dateStrToObj = (dateStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

// ─── ADD SLOT (Tutor/Admin) ───────────────────────────────────────────────────
const addSlot = async (req, res) => {
  const { date, startTime, endTime, lessonLength, bufferMinutes } = req.body

  try {
    if (!date || !startTime || !endTime)
      return res.status(400).json({ message: 'Date, start time and end time are required' })

    if (startTime >= endTime)
      return res.status(400).json({ message: 'End time must be after start time' })

    // Default to 60 min lessons / 0 min buffer if not supplied (back-compat)
    const lessonMins = Number.isFinite(lessonLength) ? lessonLength : 60
    const bufferMins = Number.isFinite(bufferMinutes) ? bufferMinutes : 0

    if (lessonMins < 15 || lessonMins % 15 !== 0)
      return res.status(400).json({ message: 'Lesson length must be a multiple of 15 minutes' })

    if (bufferMins < 0 || bufferMins % 15 !== 0)
      return res.status(400).json({ message: 'Buffer must be a multiple of 15 minutes' })

    const durationMins = toMins(endTime) - toMins(startTime)

    if (durationMins < lessonMins)
      return res.status(400).json({
        message: `Minimum slot length is ${lessonMins} minutes`
      })

    const dayOfWeek = getDayOfWeek(date)

    const existing = await Availability.find({
      tutor: req.user.id,
      date
    })

    const overlap = existing.some(
      s => startTime < s.endTime && endTime > s.startTime
    )

    if (overlap)
      return res.status(400).json({
        message: 'This slot overlaps with an existing slot'
      })

    const slot = await Availability.create({
      tutor: req.user.id,
      date,
      dayOfWeek,
      startTime,
      endTime,
      slotType: 'available',
      lessonLength: lessonMins,
      bufferMinutes: bufferMins,
      isBooked: false
    })

    res.status(201).json(slot)
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    })
  }
}

// @desc   Tutor manually creates a booked slot for a student who booked
//         outside the system (e.g. forgot to add it via the calendar)
// @route  POST /api/availability/manual-booking
// @access Private (Tutor)
const manualBooking = async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      lessonLength,
      studentName,
      studentEmail
    } = req.body

    if (!date || !startTime || !endTime || !studentName) {
      return res.status(400).json({
        message: 'Date, time, and student name are required'
      })
    }

    const overlap = await Availability.findOne({
      tutor: req.user.id,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    })

    if (overlap) {
      return res.status(409).json({
        message: 'This overlaps with an existing slot on your calendar'
      })
    }

    const dayOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ][new Date(date).getDay()]

    const slot = await Availability.create({
      tutor: req.user.id,
      date,
      dayOfWeek,
      startTime,
      endTime,
      lessonLength: lessonLength || 60,
      slotType: 'booked',
      isBooked: true,
      isManualBooking: true,
      manualStudentName: studentName,
      manualStudentEmail: studentEmail || null
    })

    res.json({
      message: `Booking added for ${studentName} ✅`,
      slot
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: 'Failed to add booking'
    })
  }
}

// ─── GET SLOTS BY WEEK ────────────────────────────────────────────────────────
const getSlotsByWeek = async (req, res) => {
  try {
    const { weekStart, tutorId } = req.query
    if (!weekStart)
      return res.status(400).json({ message: 'weekStart query param required' })

    const [year, month, day] = weekStart.split('-').map(Number)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(year, month - 1, day + i)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    })

    // tutorId is optional: students browsing all tutors can omit it,
    // but the tutor's own calendar should always pass its own id so
    // slots/bookings from other tutors never bleed into its view.
    const query = { date: { $in: dates } }
    if (tutorId) query.tutor = tutorId

    const slots = await Availability.find(query)
      .populate('tutor', 'name email')
      .populate('bookedBy', 'name email')
      .sort({ date: 1, startTime: 1 })

    res.json(slots)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET ALL SLOTS (Tutor/Admin) ──────────────────────────────────────────────
const getAllSlots = async (req, res) => {
  try {
    const slots = await Availability.find()
      .populate('tutor', 'name email')
      .populate('bookedBy', 'name email')
      .sort({ date: 1, startTime: 1 })
    res.json(slots)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET MY BOOKINGS (Student/Parent) ────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const slots = await Availability.find({
      bookedBy: req.user.id,
      slotType: 'booked'
    })
      .populate('tutor', 'name email')
      .sort({ date: 1, startTime: 1 })
    res.json(slots)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET ALL BOOKINGS (Admin only) ───────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Availability.find({ isBooked: true })
      .populate('bookedBy', 'name email')
      .populate('tutor', 'name email')
      .sort({ date: 1, startTime: 1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load bookings', error: err.message })
  }
}

// ─── CLEANUP STALE SLOTS (Tutor) ─────────────────────────────────────────────
// Removes any slot belonging to this tutor where date+endTime is >48hrs in the past
const cleanupStaleSlots = async (req, res) => {
  try {
    const now = new Date()
    const msIn48Hrs = 48 * 60 * 60 * 1000

    const slots = await Availability.find({ tutor: req.user.id })

    const staleIds = slots
      .filter(slot => {
        const [y, mo, d]  = slot.date.split('-').map(Number)
        const [h, m]      = slot.endTime.split(':').map(Number)
        const slotEndDate = new Date(y, mo - 1, d, h, m, 0)
        return (now - slotEndDate) > msIn48Hrs
      })
      .map(slot => slot._id)

    if (staleIds.length === 0)
      return res.json({ deleted: 0 })

    await Availability.deleteMany({ _id: { $in: staleIds } })
    res.json({ deleted: staleIds.length })
  } catch (err) {
    console.error('Cleanup error:', err)
    res.status(500).json({ message: 'Cleanup failed', error: err.message })
  }
}

// ─── BOOK A SLOT (Student/Parent) ────────────────────────────────────────────
// Booking duration and buffer size now come from the available slot being
// booked (slot.lessonLength / slot.bufferMinutes), not hardcoded 60/15.
const bookSlot = async (req, res) => {
  try {
    const { startTime, date, tutorId } = req.body
    if (!startTime || !date || !tutorId)
      return res.status(400).json({ message: 'startTime, date and tutorId are required' })

    // ── Find the available slot that covers this start time ───────
    const parentSlot = await Availability.findOne({
      date,
      tutor: tutorId,
      slotType: 'available',
      startTime: { $lte: startTime },
      endTime:   { $gt: startTime }
    })

    if (!parentSlot)
      return res.status(400).json({ message: 'No available slot covers this time' })

    const lessonMins = Number.isFinite(parentSlot.lessonLength) ? parentSlot.lessonLength : 60
    const bufferMins  = Number.isFinite(parentSlot.bufferMinutes) ? parentSlot.bufferMinutes : 0

    const bookStart   = toMins(startTime)
    const bookEnd     = bookStart + lessonMins
    const bookEndTime = toTime(bookEnd)

    const parentStart = toMins(parentSlot.startTime)
    const parentEnd   = toMins(parentSlot.endTime)

    if (bookEnd > parentEnd)
      return res.status(400).json({ message: 'Not enough time left in this slot for a full lesson' })

    // ── Prevent student booking same time twice ───────────────
    const existingBooking = await Availability.findOne({
      bookedBy: req.user.id,
      date,
      slotType: 'booked',
      startTime: { $lt: bookEndTime },
      endTime:   { $gt: startTime }
    })
    if (existingBooking) {
      return res.status(400).json({
        message: 'You already have a booking during this time on this date'
      })
    }
    // ─────────────────────────────────────────────────────────

    const tutorIdRef  = parentSlot.tutor
    const dayOfWeek   = parentSlot.dayOfWeek
    const origId      = parentSlot._id

    await parentSlot.deleteOne()

    const newDocs = []

    // ── Segment BEFORE (anything ahead of the buffer zone) ────────
    if (bookStart - bufferMins > parentStart) {
      const beforeStart    = parentStart
      const beforeEnd      = bookStart - bufferMins
      const beforeDuration = beforeEnd - beforeStart
      newDocs.push({
        tutor: tutorIdRef, date, dayOfWeek,
        startTime: toTime(beforeStart),
        endTime:   toTime(beforeEnd),
        slotType:  beforeDuration >= lessonMins ? 'available' : 'unavailable',
        lessonLength: lessonMins,
        bufferMinutes: bufferMins,
        parentSlotId: origId,
        isBooked: false
      })
    }

    // ── Buffer BEFORE ────────────────────────────────────────────
    if (bufferMins > 0 && bookStart - bufferMins >= parentStart) {
      newDocs.push({
        tutor: tutorIdRef, date, dayOfWeek,
        startTime: toTime(Math.max(parentStart, bookStart - bufferMins)),
        endTime:   toTime(bookStart),
        slotType:  'buffer',
        lessonLength: lessonMins,
        bufferMinutes: bufferMins,
        parentSlotId: origId,
        isBooked: false
      })
    }

    // ── The BOOKING itself ───────────────────────────────────────
    newDocs.push({
      tutor: tutorIdRef, date, dayOfWeek,
      startTime: toTime(bookStart),
      endTime:   toTime(bookEnd),
      slotType:  'booked',
      lessonLength: lessonMins,
      bufferMinutes: bufferMins,
      parentSlotId: origId,
      isBooked: true,
      bookedBy: req.user.id
    })

    // ── Buffer AFTER ─────────────────────────────────────────────
    if (bufferMins > 0 && bookEnd + bufferMins <= parentEnd) {
      newDocs.push({
        tutor: tutorIdRef, date, dayOfWeek,
        startTime: toTime(bookEnd),
        endTime:   toTime(Math.min(parentEnd, bookEnd + bufferMins)),
        slotType:  'buffer',
        lessonLength: lessonMins,
        bufferMinutes: bufferMins,
        parentSlotId: origId,
        isBooked: false
      })
    }

    // ── Segment AFTER ────────────────────────────────────────────
    if (bookEnd + bufferMins < parentEnd) {
      const afterStart    = bookEnd + bufferMins
      const afterEnd      = parentEnd
      const afterDuration = afterEnd - afterStart
      newDocs.push({
        tutor: tutorIdRef, date, dayOfWeek,
        startTime: toTime(afterStart),
        endTime:   toTime(afterEnd),
        slotType:  afterDuration >= lessonMins ? 'available' : 'unavailable',
        lessonLength: lessonMins,
        bufferMinutes: bufferMins,
        parentSlotId: origId,
        isBooked: false
      })
    }

    const created   = await Availability.insertMany(newDocs)
    const bookedDoc = created.find(d => d.slotType === 'booked')

    res.status(201).json({
      message: 'Slot booked successfully! 🎉',
      slot: bookedDoc
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── CANCEL BOOKING (Student/Parent or Tutor/Admin) ──────────────────────────
const unbookSlot = async (req, res) => {
  try {
    const bookedSlot = await Availability.findById(req.params.id)
    if (!bookedSlot)
      return res.status(404).json({ message: 'Booking not found' })
    if (bookedSlot.slotType !== 'booked')
      return res.status(400).json({ message: 'This slot is not a booking' })

    if (req.user.role === 'student' || req.user.role === 'parent') {
      if (bookedSlot.bookedBy.toString() !== req.user.id)
        return res.status(403).json({ message: 'You can only cancel your own bookings' })
    }

    const { date, parentSlotId, tutor, dayOfWeek, lessonLength, bufferMinutes } = bookedSlot

    // ── Step 1: gather siblings (buffer slots) sharing the same parentSlotId ──
    const siblings = parentSlotId
      ? await Availability.find({ parentSlotId, date })
      : []

    // ── Step 2: collapse booking + its buffers into a single freed range ──
    const freedDocs = [...siblings, bookedSlot]
    const freedStart = freedDocs.reduce(
      (min, s) => (toMins(s.startTime) < toMins(min) ? s.startTime : min),
      freedDocs[0].startTime
    )
    const freedEnd = freedDocs.reduce(
      (max, s) => (toMins(s.endTime) > toMins(max) ? s.endTime : max),
      freedDocs[0].endTime
    )

    // ── Step 3: delete siblings + the booking itself ──
    if (parentSlotId) {
      await Availability.deleteMany({ parentSlotId, date })
    }
    await bookedSlot.deleteOne()

    // ── Step 4: gather other available slots for this tutor/date, plus the freed range ──
    const existingAvailable = await Availability.find({
      tutor,
      date,
      slotType: 'available'
    })

    const allRanges = [
      ...existingAvailable.map(s => ({ startTime: s.startTime, endTime: s.endTime })),
      { startTime: freedStart, endTime: freedEnd }
    ].sort((a, b) => toMins(a.startTime) - toMins(b.startTime))

    // ── Step 5: merge ALL adjacent/touching ranges ──
    const merged = []
    let current = { startTime: allRanges[0].startTime, endTime: allRanges[0].endTime }
    for (let i = 1; i < allRanges.length; i++) {
      const next = allRanges[i]
      if (toMins(next.startTime) <= toMins(current.endTime)) {
        if (toMins(next.endTime) > toMins(current.endTime)) {
          current.endTime = next.endTime
        }
      } else {
        merged.push(current)
        current = { startTime: next.startTime, endTime: next.endTime }
      }
    }
    merged.push(current)

    // ── Step 6: replace existing available slots with merged result ──
    // Re-uses the lessonLength/bufferMinutes that were on the booking, so the
    // freed range keeps the same settings it was created with.
    await Availability.deleteMany({ tutor, date, slotType: 'available' })
    await Availability.insertMany(
      merged.map(m => ({
        tutor,
        date,
        dayOfWeek,
        startTime:    m.startTime,
        endTime:      m.endTime,
        slotType:     'available',
        lessonLength: Number.isFinite(lessonLength) ? lessonLength : 60,
        bufferMinutes: Number.isFinite(bufferMinutes) ? bufferMinutes : 0,
        parentSlotId: null,
        isBooked:     false
      }))
    )

    res.json({ message: 'Booking cancelled and slot restored ✅' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── DELETE A SLOT (Tutor/Admin) ─────────────────────────────────────────────
const deleteSlot = async (req, res) => {
  try {
    const slot = await Availability.findById(req.params.id)
    if (!slot) return res.status(404).json({ message: 'Slot not found' })

    if (slot.parentSlotId) {
      await Availability.deleteMany({ parentSlotId: slot.parentSlotId })
    }

    await slot.deleteOne()
    res.json({ message: 'Slot deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── COPY DAY (Tutor/Admin) ───────────────────────────────────────────────────
const copyDay = async (req, res) => {
  const { fromDate, toDate } = req.body
  try {
    if (!fromDate || !toDate)
      return res.status(400).json({ message: 'fromDate and toDate are required' })
    if (fromDate === toDate)
      return res.status(400).json({ message: 'From and To dates cannot be the same' })

    const sourceSlots = await Availability.find({
      tutor: req.user.id,
      date: fromDate,
      slotType: 'available'
    })
    if (sourceSlots.length === 0)
      return res.status(404).json({ message: 'No available slots found on the source date' })

    await Availability.deleteMany({
      tutor: req.user.id,
      date: toDate,
      slotType: { $in: ['available', 'unavailable'] }
    })

    const dayOfWeek = getDayOfWeek(toDate)
    const newSlots = await Promise.all(
      sourceSlots.map(slot =>
        Availability.create({
          tutor: req.user.id,
          date: toDate,
          dayOfWeek,
          startTime:    slot.startTime,
          endTime:      slot.endTime,
          slotType:     'available',
          lessonLength: slot.lessonLength,
          bufferMinutes: slot.bufferMinutes,
          parentSlotId: null,
          isBooked:     false
        })
      )
    )

    res.status(201).json({
      message: `Copied ${newSlots.length} slot(s) from ${fromDate} to ${toDate} ✅`,
      slots: newSlots
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── REPEAT WEEKLY TEMPLATE (Tutor/Admin) ─────────────────────────────────────
// Clones this week's 'available' slots onto every following week, up to and
// including untilDate. weekStart is the Monday of the source week.
const repeatWeekly = async (req, res) => {
  const { weekStart, untilDate } = req.body
  try {
    if (!weekStart || !untilDate)
      return res.status(400).json({ message: 'weekStart and untilDate are required' })

    const untilObj = dateStrToObj(untilDate)
    if (dateStrToObj(weekStart) > untilObj)
      return res.status(400).json({ message: 'untilDate must be after weekStart' })

    const sourceDates = Array.from({ length: 7 }, (_, i) => addDaysToDateStr(weekStart, i))

    const sourceSlots = await Availability.find({
      tutor: req.user.id,
      date: { $in: sourceDates },
      slotType: 'available'
    })

    if (sourceSlots.length === 0)
      return res.status(404).json({ message: 'No available slots found in the source week' })

    const slotsByDate = {}
    sourceDates.forEach(d => { slotsByDate[d] = sourceSlots.filter(s => s.date === d) })

    const created = []
    let weekOffset = 7
    const MAX_WEEKS = 104 // safety cap (~2 years)

    while (weekOffset / 7 <= MAX_WEEKS) {
      const targetWeekStart = addDaysToDateStr(weekStart, weekOffset)
      if (dateStrToObj(targetWeekStart) > untilObj) break

      for (let i = 0; i < 7; i++) {
        const targetDate = addDaysToDateStr(targetWeekStart, i)
        if (dateStrToObj(targetDate) > untilObj) continue

        const daySlots = slotsByDate[sourceDates[i]]
        if (!daySlots || daySlots.length === 0) continue

        // Clear existing available/unavailable slots on the target date first
        await Availability.deleteMany({
          tutor: req.user.id,
          date: targetDate,
          slotType: { $in: ['available', 'unavailable'] }
        })

        const dayOfWeek = getDayOfWeek(targetDate)
        for (const slot of daySlots) {
          const doc = await Availability.create({
            tutor: req.user.id,
            date: targetDate,
            dayOfWeek,
            startTime:    slot.startTime,
            endTime:      slot.endTime,
            slotType:     'available',
            lessonLength: slot.lessonLength,
            bufferMinutes: slot.bufferMinutes,
            parentSlotId: null,
            isBooked:     false
          })
          created.push(doc)
        }
      }

      weekOffset += 7
    }

    res.status(201).json({
      message: `Repeated weekly schedule, creating ${created.length} slot(s) up to ${untilDate} ✅`,
      slots: created
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── CLEAR A DAY (Tutor/Admin) ────────────────────────────────────────────────
// Deletes everything on a given date except booked slots.
const clearDay = async (req, res) => {
  const { date } = req.query
  try {
    if (!date)
      return res.status(400).json({ message: 'date query param required' })

    const result = await Availability.deleteMany({
      tutor: req.user.id,
      date,
      slotType: { $ne: 'booked' }
    })

    res.json({ message: `Cleared ${result.deletedCount} slot(s) on ${date} ✅` })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports = {
  addSlot,
  getSlotsByWeek,
  getAllSlots,
  getMyBookings,
  getAllBookings,
  bookSlot,
  unbookSlot,
  deleteSlot,
  copyDay,
  cleanupStaleSlots,
  repeatWeekly,
  clearDay,
}