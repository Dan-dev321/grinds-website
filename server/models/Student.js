const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

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

  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

studentSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('Student', studentSchema)