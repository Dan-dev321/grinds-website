const mongoose = require('mongoose')

const sessionEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  content: { type: String, default: '' },
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false },
  topicsCovered: [{
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    rating: { type: Number, min: 0, max: 5, required: true },
  }],
}, { timestamps: true })

const noteSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  lastSessionDate: { type: String, default: '' }, // for sidebar ordering
  entries: [sessionEntrySchema]
}, { timestamps: true })

module.exports = mongoose.model('Note', noteSchema)