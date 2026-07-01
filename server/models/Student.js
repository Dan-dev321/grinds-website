const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const studentSchema = new mongoose.Schema({
  tutorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },

  // Profile
  phone:       { type: String, default: '' },
  school:      { type: String, default: '' },
  yearGroup:   { type: String, default: '' },
  subjects:    [{ type: String }],
  examBoard:   { type: String, default: '' },
  goals:       { type: String, default: '' },

  // Parent / guardian
  parentName:  { type: String, default: '' },
  parentEmail: { type: String, default: '' },
  parentPhone: { type: String, default: '' },

  // Progress tracking (set by tutor on /students page)
  progressStage: {
    type: String,
    enum: [
      'just-started',
      'building-foundations',
      'making-progress',
      'on-track',
      'exam-ready',
      'completed',
    ],
    default: 'just-started',
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true })

studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

studentSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('Student', studentSchema)