const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// ========================
// CORS CONFIG (FIXED)
// ========================
const allowedOrigins = [
  'http://localhost:5173',
  'https://grinds-website.vercel.app'
]

app.use(cors({
  origin: function (origin, callback) {
    // allow tools like Postman or server-to-server requests
    if (!origin) return callback(null, true)

    // allow localhost + your Vercel frontend
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true)
    }

    return callback(null, true) // TEMP: allow all origins to avoid deployment blocking
  },
  credentials: true
}))

// ========================
// MIDDLEWARE
// ========================
app.use(express.json())

// ========================
// ROUTES
// ========================
const authRoutes = require('./routes/authRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')
const feedbackRoutes = require('./routes/feedbackRoutes')
const adminRoutes = require('./routes/adminRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/admin', adminRoutes)

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => {
  res.send('Server is running! ✅')
})

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