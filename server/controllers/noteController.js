const Note = require('../models/Note')
const Availability = require('../models/Availability')

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const getDayOfWeek = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return DAY_NAMES[new Date(y, m - 1, d).getDay()]
}

// ─── Mark session as completed & auto-add notebook entry ─────────────────────
const completeSession = async (req, res) => {
  try {
    const slot = await Availability.findById(req.params.id)
      .populate('bookedBy', 'name email')
      .populate('tutor', 'name email')

    if (!slot) return res.status(404).json({ message: 'Session not found' })
    if (slot.slotType !== 'booked')
      return res.status(400).json({ message: 'Only booked sessions can be marked complete' })
    if (slot.tutor._id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorised' })

    // Mark slot as completed
    slot.status = 'completed'
    await slot.save()

    // Find or create the notebook entry for this tutor/student pair
    let note = await Note.findOne({
      tutor: slot.tutor._id,
      student: slot.bookedBy._id
    })

    if (!note) {
      note = new Note({
        tutor: slot.tutor._id,
        student: slot.bookedBy._id,
        entries: []
      })
    }

    // ── Check by date AND startTime to allow multiple same-day sessions ──
    const alreadyExists = note.entries.some(
      e => e.date === slot.date && e.startTime === slot.startTime
    )

    if (!alreadyExists) {
      // Add new entry at the FRONT (most recent first)
      note.entries.unshift({
        date:      slot.date,
        dayOfWeek: getDayOfWeek(slot.date),
        startTime: slot.startTime,
        endTime:   slot.endTime,
        content:   '',
        tags:      [],
        pinned:    false
      })
    }

    note.lastSessionDate = slot.date
    await note.save()

    res.json({ message: 'Session marked as completed ✅', note })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Get all students in this tutor's notebook ────────────────────────────────
const getNotebookStudents = async (req, res) => {
  try {
    const notes = await Note.find({ tutor: req.user.id })
      .populate('student', 'name email')
      .populate('entries.topicsCovered.topic', 'name')
      .sort({ lastSessionDate: -1 }) // most recently active first
    res.json(notes)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Get one student's notes ──────────────────────────────────────────────────
const getStudentNotes = async (req, res) => {
  try {
    const note = await Note.findOne({
      tutor: req.user.id,
      student: req.params.studentId
    })
      .populate('student', 'name email')
      .populate('entries.topicsCovered.topic', 'name')

    if (!note) return res.status(404).json({ message: 'No notes found for this student' })
    res.json(note)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Save/update notes for a specific entry ───────────────────────────────────
// Accepts content, tags, and/or pinned — all optional, so callers can update
// just one aspect (e.g. toggling pinned) without resending the others.
const updateEntry = async (req, res) => {
  try {
    const { studentId, entryId } = req.params
    const { content, tags, pinned } = req.body

    const note = await Note.findOne({ tutor: req.user.id, student: studentId })
    if (!note) return res.status(404).json({ message: 'Notebook not found' })

    const entry = note.entries.id(entryId)
    if (!entry) return res.status(404).json({ message: 'Entry not found' })

    if (content !== undefined) entry.content = content
    if (tags !== undefined) entry.tags = tags
    if (pinned !== undefined) entry.pinned = pinned

    await note.save()

    res.json({ message: 'Notes saved ✅', entry })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = {
  completeSession,
  getNotebookStudents,
  getStudentNotes,
  updateEntry
}