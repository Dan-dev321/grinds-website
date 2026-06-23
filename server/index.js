const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'https://your-vercel-app-name.vercel.app'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

const authRoutes = require('./routes/authRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')
const feedbackRoutes = require('./routes/feedbackRoutes')
const adminRoutes = require('./routes/adminRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
  res.send('Server is running! ✅')
})

mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log('MongoDB Connected ✅'))
  .catch((err) => console.log(err))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))