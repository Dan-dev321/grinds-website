const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false  // Admin must approve before showing publicly
  }
}, { timestamps: true })

module.exports = mongoose.model('Feedback', feedbackSchema)