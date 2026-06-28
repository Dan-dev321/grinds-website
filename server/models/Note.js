const mongoose = require('mongoose')

const sessionEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },        // "YYYY-MM-DD"
  dayOfWeek: { type: String, required: true },
  content: { type: String, default: '' },        // rich text stored as HTML string
}, { timestamps: true })

const noteSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastSessionDate: { type: String, default: '' }, // for sidebar ordering
  entries: [sessionEntrySchema]
}, { timestamps: true })

module.exports = mongoose.model('Note', noteSchema)