const Tutor   = require('../models/Tutor')
const Student = require('../models/Student')
const jwt     = require('jsonwebtoken')

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── Register Tutor ────────────────────────────────────────────
const registerTutor = async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body

    const exists = await Tutor.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already in use' })

    const tutor = new Tutor({
      name,
      email,
      password,
      businessName: businessName || '',
      subscription: {
        status:    'trial',
        trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    })

    // Generate a unique invite code
    let code, taken
    do {
      code  = tutor.generateInviteCode()
      taken = await Tutor.findOne({ inviteCode: code })
    } while (taken)

    await tutor.save()

    res.status(201).json({
      _id:        tutor._id,
      name:       tutor.name,
      email:      tutor.email,
      role:       'tutor',
      inviteCode: tutor.inviteCode,
      token:      generateToken(tutor._id, 'tutor'),
    })
  } catch (err) {
    console.error('registerTutor:', err)
    res.status(500).json({ message: 'Registration failed' })
  }
}

// ── Register Student (requires invite code) ───────────────────
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body

    // Find the tutor this code belongs to
    const tutor = await Tutor.findOne({ inviteCode: inviteCode?.toUpperCase() })
    if (!tutor) return res.status(400).json({ message: 'Invalid invite code' })

    const exists = await Student.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already in use' })

    const student = await Student.create({
      tutorId: tutor._id,
      name,
      email,
      password,
    })

    res.status(201).json({
      _id:     student._id,
      name:    student.name,
      email:   student.email,
      role:    'student',
      tutorId: student.tutorId,
      token:   generateToken(student._id, 'student'),

      subscription: {
        status:    'trial',
        trialEnds: tutor.subscription.trialEnds,
        plan:      null,
      },
    })
  } catch (err) {
    console.error('registerStudent:', err)
    res.status(500).json({ message: 'Registration failed' })
  }
}

// ── Login (works for tutor, student, owner) ───────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    let account = await Tutor.findOne({ email })
    let role = 'tutor'

    if (!account) {
      account = await Student.findOne({ email })
      role = 'student'
    }

    if (!account) {
      const Owner = require('../models/Owner')
      account = await Owner.findOne({ email })
      role = 'owner'
    }

    if (!account) return res.status(401).json({ message: 'Invalid credentials' })

    const match = await account.matchPassword(password)
    if (!match)  return res.status(401).json({ message: 'Invalid credentials' })

    // Build base response
    const response = {
      _id:     account._id,
      name:    account.name,
      email:   account.email,
      role,
      tutorId: account.tutorId || null,
      token:   generateToken(account._id, role),
    }

    // Attach subscription info + invite code for tutors so the frontend
    // can gate access to the dashboard immediately on login
    if (role === 'tutor') {
      const { status, trialEnds, plan } = account.subscription

      // Compute whether trial has silently expired
      const trialExpired =
        status === 'trial' && trialEnds && new Date() > new Date(trialEnds)

      response.subscription = {
        status:    trialExpired ? 'trial_expired' : status,
        trialEnds: trialEnds ?? null,
        plan:      plan ?? null,
      }

      response.inviteCode = account.inviteCode
    }

    res.json(response)
  } catch (err) {
    console.error('login:', err)
    res.status(500).json({ message: 'Login failed' })
  }
}

module.exports = { registerTutor, registerStudent, login }