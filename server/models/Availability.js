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
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null }
}, { timestamps: true })

module.exports = mongoose.model('Availability', availabilitySchema)