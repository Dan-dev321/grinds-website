import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'

//const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API = import.meta.env.VITE_API_URL

const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

const getWeekBounds = () => {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

const toDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const TutorDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [slots, setSlots]               = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [success, setSuccess]           = useState('')
  const [error, setError]               = useState('')

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  const fetchData = async () => {
    try {
      setLoading(true)
      const { monday } = getWeekBounds()

      // Fetch this week's slots
      const slotsRes = await axios.get(
        `${API}/api/availability?weekStart=${toDateStr(monday)}`,
        authHeader
      )
      setSlots(slotsRes.data)

      // Fetch pending feedback count
      const feedbackRes = await axios.get(`${API}/api/feedback`)
      const pending = feedbackRes.data.filter(f => !f.approved)
      setPendingCount(pending.length)
    } catch (err) {
      flashError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUnbook = async (slotId) => {
    if (!window.confirm('Cancel this student booking?')) return
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Booking cancelled ✅')
      fetchData()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  const handleDelete = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      await axios.delete(`${API}/api/availability/${slotId}`, authHeader)
      flashSuccess('Slot deleted ✅')
      fetchData()
    } catch (err) {
      flashError('Failed to delete slot')
    }
  }

  const handleMarkComplete = async (slotId) => {
    try {
      await axios.put(
        `${API}/api/notes/complete/${slotId}`,
        {},
        authHeader
      )
      flashSuccess('Session marked as complete ✅ — added to Notebook!')
      fetchData()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to mark as complete')
    }
  }

  // ── Derived stats ────────────────────────────────────────────
  const todayStr = toDateStr(new Date())
  const { monday, sunday } = getWeekBounds()
  const mondayStr = toDateStr(monday)
  const sundayStr = toDateStr(sunday)

  const bookedSlots    = slots.filter(s => s.slotType === 'booked')
  const availableSlots = slots.filter(s => s.slotType === 'available')
  const sessionsThisWeek = bookedSlots.filter(
    s => s.date >= mondayStr && s.date <= sundayStr
  )

  // Unique students booked this week
  const uniqueStudents = new Set(
    sessionsThisWeek.map(s => s.bookedBy?._id).filter(Boolean)
  ).size

  // Upcoming booked sessions (today or later)
  const upcomingSessions = bookedSlots
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  // Past booked sessions
  const pastSessions = bookedSlots
    .filter(s => s.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))

  const stats = [
    { label: 'Sessions This Week', value: loading ? '…' : sessionsThisWeek.length, icon: '📅' },
    { label: 'Students This Week', value: loading ? '…' : uniqueStudents,           icon: '👥' },
    { label: 'Pending Reviews',    value: loading ? '…' : pendingCount,             icon: '⭐' },
    { label: 'Available Slots',    value: loading ? '…' : availableSlots.length,    icon: '🟢' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ======= WELCOME HEADER ======= */}
        <div className="bg-blue-700 text-white rounded-2xl p-8 mb-8 shadow-md">
          <h1 className="text-3xl font-extrabold mb-1">
            👋 Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-blue-100">
            Your tutor dashboard — manage your availability and view your bookings.
          </p>
          <span className="inline-block mt-3 bg-blue-600 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Tutor
          </span>
        </div>

        {/* ======= FLASH MESSAGES ======= */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {error}
          </div>
        )}

        {/* ======= STATS ROW ======= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <div className="text-3xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-extrabold text-blue-700">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ======= QUICK ACTIONS ======= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Link
            to="/availability"
            className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-blue-400 hover:shadow-md transition"
          >
            <div className="text-4xl mb-3">🟢</div>
            <h3 className="font-bold text-gray-800">Set Availability</h3>
            <p className="text-gray-500 text-sm mt-1">Add or remove available time slots</p>
          </Link>

          <a
            href="#upcoming"
            className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-blue-500 hover:shadow-md transition cursor-pointer"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-bold text-gray-800">View Bookings</h3>
            <p className="text-gray-500 text-sm mt-1">
              {upcomingSessions.length > 0
                ? `${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''}`
                : 'No upcoming bookings yet'}
            </p>
          </a>

          <Link
            to="/feedback"
            className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-blue-700 hover:shadow-md transition"
          >
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-gray-800">View Reviews</h3>
            <p className="text-gray-500 text-sm mt-1">
              {pendingCount > 0
                ? `${pendingCount} review${pendingCount !== 1 ? 's' : ''} awaiting approval`
                : 'See what students are saying'}
            </p>
          </Link>
        </div>

        {/* ======= UPCOMING SESSIONS ======= */}
        <div id="upcoming" className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">📅 Upcoming Sessions</h2>
            {upcomingSessions.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {upcomingSessions.length} booked
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading sessions...</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-medium">No upcoming sessions yet.</p>
              <p className="text-sm mt-1">Add your availability so students can start booking!</p>
              <Link
                to="/availability"
                className="inline-block mt-4 bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition"
              >
                Manage Availability →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingSessions.map(slot => (
                <div
                  key={slot._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🔴</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {formatDisplay(slot.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {slot.startTime} – {slot.endTime}
                      </p>
                      {slot.bookedBy && (
                        <p className="text-xs text-orange-600 font-medium">
                          Student: {slot.bookedBy.name} — {slot.bookedBy.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnbook(slot._id)}
                    className="bg-orange-100 text-orange-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-orange-200 transition self-start sm:self-auto"
                  >
                    Cancel Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======= PAST SESSIONS ======= */}
        {!loading && pastSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">🕘 Past Sessions</h2>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                {pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {pastSessions.map(slot => {
                const isCompleted = slot.status === 'completed'
                return (
                  <div
                    key={slot._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-5 py-4 border ${
                      isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{isCompleted ? '✅' : '🕘'}</div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">
                          {formatDisplay(slot.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        {slot.bookedBy && (
                          <p className="text-xs text-gray-400">
                            Student: {slot.bookedBy.name}
                          </p>
                        )}
                        {isCompleted && (
                          <p className="text-xs text-green-600 font-semibold mt-0.5">
                            ✓ Marked as complete — added to Notebook
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Only show button if not already completed */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleMarkComplete(slot._id)}
                        className="bg-green-100 text-green-700 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-green-200 transition self-start sm:self-auto"
                      >
                        ✅ Mark as Complete
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ======= THIS WEEK'S AVAILABLE SLOTS ======= */}
        {!loading && availableSlots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">🟢 Available Slots This Week</h2>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                {availableSlots.length} open
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {availableSlots
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map(slot => (
                  <div
                    key={slot._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">🟢</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDisplay(slot.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.startTime} – {slot.endTime}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(slot._id)}
                      className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto"
                    >
                      Delete Slot
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======= ACCOUNT INFO ======= */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👤 My Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Full Name</p>
              <p className="text-gray-800 font-medium">{user?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p>
              <p className="text-gray-800 font-medium">{user?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Account Type</p>
              <p className="text-gray-800 font-medium capitalize">{user?.role}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Account ID</p>
              <p className="text-gray-800 font-medium text-xs">{user?.id}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TutorDashboard