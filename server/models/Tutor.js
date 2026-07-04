const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const tutorSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  businessName: { type: String, default: '' },
  inviteCode:   { type: String, unique: true },

  // Subscription
  subscription: {
    status:               { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
    trialEnds:            { type: Date },
    stripeCustomerId:     { type: String },
    stripeSubscriptionId: { type: String },
    plan:                 { type: String, enum: ['monthly', 'quarterly', 'yearly', null], default: null },
    trialReminderSent:     { type: Boolean, default: false },
    trialExpiredEmailSent: { type: Boolean, default: false },
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// ✅ Mongoose 7+ async pre-save — do NOT use next(), just return
tutorSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

// Generate unique invite code
tutorSchema.methods.generateInviteCode = function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  this.inviteCode = code
  return code
}

tutorSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('Tutor', tutorSchema)