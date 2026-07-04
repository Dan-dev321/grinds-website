const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  name:  { type: String, required: true, trim: true },
}, { timestamps: true })

// Prevent the same tutor from creating duplicate topic names (case-insensitive
// would need a collation or pre-save check; exact-match unique is enough for now).
topicSchema.index({ tutor: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Topic', topicSchema)