const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const tutorSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  email:              { type: String, required: true, unique: true },
  password:           { type: String, required: true },
  businessName:       { type: String, default: '' },
  inviteCode:         { type: String, unique: true },

  // Subscription
  subscription: {
    status:               { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
    trialEnds:            { type: Date },
    stripeCustomerId:     { type: String },
    stripeSubscriptionId: { type: String },
    plan:                 { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: null },
  },

  isActive: { type: Boolean, default: true }, // Owner can disable accounts
}, { timestamps: true })

// Hash password before save
tutorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Generate unique invite code
tutorSchema.methods.generateInviteCode = function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars
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