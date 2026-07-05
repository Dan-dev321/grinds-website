const mongoose = require('mongoose')

const availabilitySchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  date: { type: String, required: true },
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  slotType: {
    type: String,
    enum: ['available', 'booked', 'buffer', 'unavailable'],
    default: 'available'
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'no-show'],
    default: 'upcoming'
  },
  parentSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability',
    default: null
  },
  // ── Lesson length & buffer this slot was created with ──────────────────────
  // Stored on 'available' slots so bookSlot/unbookSlot know how long a booking
  // should be and how big a buffer to carve out, instead of hardcoding 60/15.
  lessonLength:  { type: Number, default: 60 }, // minutes
  bufferMinutes: { type: Number, default: 0 },  // minutes
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  reminderSent: { type: Boolean, default: false },

  // ── Manual/guest booking ─────────────────────────────────────────────────
  // Set when a tutor adds a booking directly (e.g. a student forgot to book
  // via the calendar and arranged the lesson by text/in person). In this
  // case there's no Student account to link, so bookedBy stays null and the
  // student's details are stored here instead.
  studentNote: { type: String, default: '' },
  isManualBooking:    { type: Boolean, default: false },
  manualStudentName:  { type: String, default: null },
  manualStudentEmail: { type: String, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Availability', availabilitySchema)