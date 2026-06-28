const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// ========================
// CORS CONFIG
// ========================
const allowedOrigins = [
  'http://localhost:5173',
  'https://grinds-website.vercel.app'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true
}))

// ========================
// ⚡ STRIPE WEBHOOK — raw body, MUST be before express.json()
// ========================
const stripeRoutes = require('./routes/stripeRoutes')
app.use('/api/stripe', stripeRoutes)

// ========================
// MIDDLEWARE (after webhook)
// ========================
app.use(express.json())

// ========================
// ROUTES
// ========================
const authRoutes         = require('./routes/authRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')
const feedbackRoutes     = require('./routes/feedbackRoutes')
const adminRoutes        = require('./routes/adminRoutes')
const noteRoutes         = require('./routes/noteRoutes')
const studentRoutes      = require('./routes/studentRoutes')
const sessionRoutes      = require('./routes/sessionRoutes')

app.use('/api/auth',         authRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/feedback',     feedbackRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/notes',        noteRoutes)
app.use('/api/students',     studentRoutes)
app.use('/api/sessions',     sessionRoutes)

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => res.send('TutorBase server running ✅'))

// ========================
// DATABASE
// ========================
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log('MongoDB Connected ✅'))
  .catch((err) => console.log(err))

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))