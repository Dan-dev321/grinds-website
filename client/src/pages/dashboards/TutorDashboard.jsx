import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

const getWeekBounds = () => {
  const now  = new Date()
  const day  = now.getDay()
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

// ── Small reusable status pill ────────────────────────────────
const StatusPill = ({ status }) => {
  if (status === 'completed')
    return <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">Completed</span>
  if (status === 'no-show')
    return <span className="text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">No-show</span>
  return <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full font-semibold">Upcoming</span>
}

const TutorDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const [showPast, setShowPast] = useState(false)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  const fetchData = async () => {
    try {
      setLoading(true)
      const { monday } = getWeekBounds()
      const res = await axios.get(
        `${API}/api/availability?weekStart=${toDateStr(monday)}`,
        authHeader
      )
      setSlots(res.data)
    } catch (err) {
      flashError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Actions ───────────────────────────────────────────────────
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
      await axios.put(`${API}/api/notes/complete/${slotId}`, {}, authHeader)
      flashSuccess('Session marked as complete ✅ — added to Notebook!')
      fetchData()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to mark as complete')
    }
  }

  // ── Derived data ──────────────────────────────────────────────
  const todayStr    = toDateStr(new Date())
  const now         = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const { monday, sunday } = getWeekBounds()
  const mondayStr = toDateStr(monday)
  const sundayStr = toDateStr(sunday)

  const bookedSlots    = slots.filter(s => s.slotType === 'booked')
  const availableSlots = slots.filter(s => s.slotType === 'available')

  const sessionsThisWeek = bookedSlots.filter(
    s => s.date >= mondayStr && s.date <= sundayStr
  )

  const completedThisWeek = sessionsThisWeek.filter(s => s.status === 'completed').length
  const noShowsThisWeek   = sessionsThisWeek.filter(s => s.status === 'no-show').length

  const attendanceRate = sessionsThisWeek.length > 0
    ? Math.round(((sessionsThisWeek.length - noShowsThisWeek) / sessionsThisWeek.length) * 100)
    : null

  const uniqueStudents = new Set(
    sessionsThisWeek.map(s => s.bookedBy?._id).filter(Boolean)
  ).size

  const upcomingSessions = bookedSlots
    .filter(s => s.date > todayStr || (s.date === todayStr && s.endTime > currentTime))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const pastSessions = bookedSlots
    .filter(s => s.date < todayStr || (s.date === todayStr && s.endTime <= currentTime))
    .sort((a, b) => b.date.localeCompare(a.date))

  const pendingNotes = pastSessions.filter(s => s.status !== 'completed').length

  // Today's sessions
  const todaySessions = upcomingSessions.filter(s => s.date === todayStr)

  // Stat cards
  const statCards = [
    {
      label: "Today's Sessions",
      value: loading ? '…' : todaySessions.length,
      icon: '☀️',
      color: 'border-amber-400',
      sub: todaySessions.length > 0
        ? `Next: ${todaySessions[0]?.startTime}`
        : 'None today',
    },
    {
      label: 'This Week',
      value: loading ? '…' : sessionsThisWeek.length,
      icon: '📅',
      color: 'border-brand-400',
      sub: `${uniqueStudents} student${uniqueStudents !== 1 ? 's' : ''}`,
    },
    {
      label: 'Attendance',
      value: loading ? '…' : attendanceRate !== null ? `${attendanceRate}%` : '—',
      icon: '📈',
      color: 'border-emerald-400',
      sub: attendanceRate !== null ? 'This week' : 'No sessions yet',
    },
    {
      label: 'Outstanding Notes',
      value: loading ? '…' : pendingNotes,
      icon: '📓',
      color: pendingNotes > 0 ? 'border-rose-400' : 'border-gray-200',
      sub: pendingNotes > 0 ? 'Need completing' : 'All up to date ✓',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ======= WELCOME HEADER ======= */}
        <div className="bg-brand-600 text-white rounded-2xl p-8 mb-8 shadow-md relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-500 rounded-full opacity-40 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent-600 rounded-full opacity-20 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1 uppercase tracking-widest">
                Tutor Workspace
              </p>
              <h1 className="text-3xl font-extrabold mb-1">
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-brand-100 text-sm">
                {todaySessions.length > 0
                  ? `You have ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} today.`
                  : 'No sessions today — a good time to plan your week.'}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/notebook"
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150"
              >
                📓 Notebook
              </Link>
              <Link
                to="/availability"
                className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-150 shadow-sm"
              >
                📅 Calendar
              </Link>
            </div>
          </div>

          {/* Invite code pill */}
          {user?.inviteCode && (
            <div className="relative mt-5 inline-flex items-center gap-2 bg-brand-700/60 border border-brand-400 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span className="text-brand-200 text-xs font-medium">Your invite code:</span>
              <span className="text-white font-black tracking-widest text-sm font-mono">
                {user.inviteCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/register?code=${user.inviteCode}`
                  )
                  flashSuccess('Invite link copied to clipboard! 🔗')
                }}
                className="ml-1 text-brand-200 hover:text-white text-xs underline transition-colors duration-150"
              >
                Copy link
              </button>
            </div>
          )}
        </div>

        {/* ======= FLASH MESSAGES ======= */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {error}
          </div>
        )}

        {/* ======= STAT CARDS ======= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm p-5 text-center border-t-4 ${stat.color}`}>
              <div className="text-3xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-extrabold text-brand-700">{stat.value}</p>
              <p className="text-gray-700 text-xs font-semibold mt-0.5">{stat.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ======= TODAY'S SESSIONS ======= */}
        {!loading && todaySessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-l-4 border-amber-400">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              ☀️ Today's Sessions
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {todaySessions.length}
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {todaySessions.map(slot => (
                <div key={slot._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
                      🧑‍🎓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {slot.bookedBy?.name || 'Student'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">
                        {slot.bookedBy?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start sm:self-auto">
                    <StatusPill status={slot.status} />
                    <button
                      onClick={() => handleUnbook(slot._id)}
                      className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full font-semibold hover:bg-red-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= UPCOMING SESSIONS ======= */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              📋 Upcoming Sessions
              {upcomingSessions.length > 0 && (
                <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {upcomingSessions.length}
                </span>
              )}
            </h2>
            <Link
              to="/availability"
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
            >
              Manage calendar →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Loading sessions...</p>
            </div>
          ) : upcomingSessions.filter(s => s.date !== todayStr).length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-medium text-sm">No upcoming sessions scheduled.</p>
              <p className="text-xs mt-1">Add availability so students can book.</p>
              <Link
                to="/availability"
                className="inline-block mt-4 bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition"
              >
                Open Calendar →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingSessions
                .filter(s => s.date !== todayStr)
                .map(slot => (
                  <div key={slot._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-brand-50 border border-brand-100 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-xl">
                        🧑‍🎓
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDisplay(slot.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        {slot.bookedBy && (
                          <p className="text-xs text-brand-600 font-medium">
                            {slot.bookedBy.name} · {slot.bookedBy.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnbook(slot._id)}
                      className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full font-semibold hover:bg-red-100 transition self-start sm:self-auto"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ======= PAST SESSIONS ======= */}
        {!loading && pastSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                🕘 Past Sessions
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {pastSessions.length}
                </span>
                {pendingNotes > 0 && (
                  <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {pendingNotes} note{pendingNotes !== 1 ? 's' : ''} outstanding
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowPast(p => !p)}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors"
              >
                {showPast ? 'Hide ▲' : 'Show ▼'}
              </button>
            </div>

            {showPast && (
              <div className="flex flex-col gap-3">
                {pastSessions.map(slot => {
                  const isCompleted = slot.status === 'completed'
                  const isNoShow    = slot.status === 'no-show'
                  return (
                    <div key={slot._id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-5 py-4 border ${
                        isCompleted ? 'bg-green-50 border-green-200' :
                        isNoShow    ? 'bg-red-50 border-red-200'   :
                        'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white border border-gray-100">
                          {isCompleted ? '✅' : isNoShow ? '❌' : '🕘'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-sm">
                            {formatDisplay(slot.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {slot.startTime} – {slot.endTime}
                          </p>
                          {slot.bookedBy && (
                            <p className="text-xs text-gray-400">
                              {slot.bookedBy.name}
                            </p>
                          )}
                          {isCompleted && (
                            <p className="text-xs text-green-600 font-semibold mt-0.5">
                              Added to Notebook ✓
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <StatusPill status={slot.status} />
                        {!isCompleted && !isNoShow && (
                          <button
                            onClick={() => handleMarkComplete(slot._id)}
                            className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-semibold hover:bg-green-200 transition"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ======= AVAILABLE SLOTS ======= */}
        {!loading && availableSlots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                🟢 Open Slots This Week
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {availableSlots.length} open
                </span>
              </h2>
              <Link
                to="/availability"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
              >
                Edit calendar →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {availableSlots
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map(slot => (
                  <div key={slot._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
                        🕐
                      </div>
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
                      className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full font-semibold hover:bg-red-100 transition self-start sm:self-auto"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======= ACCOUNT INFO ======= */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">👤 My Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Full Name',     value: user?.name },
              { label: 'Email',         value: user?.email },
              { label: 'Business Name', value: user?.businessName || '—' },
              { label: 'Invite Code',   value: user?.inviteCode || '—', mono: true },
              {
                label: 'Trial Status',
                value: user?.subscription?.status === 'trial'
                  ? `Trial ends ${new Date(user.subscription.trialEnds).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : user?.subscription?.status || '—',
              },
              { label: 'Account ID', value: user?.id, mono: true, small: true },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{item.label}</p>
                <p className={`text-gray-800 font-medium ${item.mono ? 'font-mono tracking-wide' : ''} ${item.small ? 'text-xs' : 'text-sm'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default TutorDashboard