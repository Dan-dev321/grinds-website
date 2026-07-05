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
  'https://grinds-website-flame.vercel.app'
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
// ⚡ STRIPE WEBHOOK — raw body, must come before express.json()
// Only the /webhook route uses express.raw(), registered inside stripeRoutes.js
// We mount the express.raw() parser here for ONLY the webhook path
// ========================
app.use(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' })
)

// ========================
// MIDDLEWARE
// express.json() must come BEFORE all other routes
// ========================
app.use(express.json())

// ========================
// ROUTES
// ========================
const authRoutes         = require('./routes/authRoutes')
const stripeRoutes       = require('./routes/stripeRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')
const ownerRoutes        = require('./routes/ownerRoutes')
const noteRoutes         = require('./routes/noteRoutes')
const studentRoutes      = require('./routes/studentRoutes')
const sessionRoutes      = require('./routes/sessionRoutes')
const cronRoutes         = require('./routes/cronRoutes')
const topicRoutes        = require('./routes/topicRoutes')

app.use('/api/auth',         authRoutes)
app.use('/api/stripe',       stripeRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/owner',        ownerRoutes)
app.use('/api/notes',        noteRoutes)
app.use('/api/students',     studentRoutes)
app.use('/api/sessions',     sessionRoutes)
app.use('/api/cron',         cronRoutes)
app.use('/api/topics',       topicRoutes)

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => res.send('TutorNode server running ✅'))
app.get('/health', (req, res) => res.json({ status: 'ok' }))

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