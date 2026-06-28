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

const formatJoined = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

const TABS = ['Bookings', 'Users', 'Reviews']

const AdminDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [stats, setStats]               = useState(null)
  const [users, setUsers]               = useState([])
  const [bookings, setBookings]         = useState([])
  const [feedback, setFeedback]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('Bookings')
  const [success, setSuccess]           = useState('')
  const [error, setError]               = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userStats, setUserStats]       = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [showStats, setShowStats]       = useState(false)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  // ── Fetch all data ────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, bookingsRes, feedbackRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, authHeader),
        axios.get(`${API}/api/admin/users`, authHeader),
        axios.get(`${API}/api/availability/all-bookings`, authHeader),
        axios.get(`${API}/api/feedback`, authHeader),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setBookings(bookingsRes.data)
      setFeedback(feedbackRes.data)
    } catch (err) {
      flashError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── Delete user ───────────────────────────────────────────────
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/api/admin/users/${userId}`, authHeader)
      flashSuccess(`User "${userName}" deleted ✅`)
      fetchAll()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // ── Approve / reject feedback ─────────────────────────────────
  const handleApproveFeedback = async (id) => {
    try {
      await axios.put(`${API}/api/feedback/${id}/approve`, {}, authHeader)
      flashSuccess('Review approved ✅')
      fetchAll()
    } catch (err) {
      flashError('Failed to approve review')
    }
  }

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await axios.delete(`${API}/api/feedback/${id}`, authHeader)
      flashSuccess('Review deleted ✅')
      fetchAll()
    } catch (err) {
      flashError('Failed to delete review')
    }
  }

  // ── Unbook a session ──────────────────────────────────────────
  const handleUnbook = async (slotId) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Booking cancelled ✅')
      fetchAll()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  // ── Open user detail modal ────────────────────────────────────
  const handleViewUser = async (u) => {
    setSelectedUser(u)
    setUserStats(null)
    setModalLoading(true)
    try {
      const endpoint = u.role === 'tutor'
        ? `${API}/api/admin/stats/tutor/${u._id}`
        : `${API}/api/admin/stats/student/${u._id}`
      const res = await axios.get(endpoint, authHeader)
      setUserStats(res.data)
    } catch (err) {
      flashError('Failed to load user stats')
      setSelectedUser(null)
    } finally {
      setModalLoading(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────
  const todayStr         = new Date().toISOString().split('T')[0]
  const upcoming         = bookings.filter(b => b.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  const past             = bookings.filter(b => b.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
  const pendingFeedback  = feedback.filter(f => !f.approved)
  const approvedFeedback = feedback.filter(f =>  f.approved)

  // ── Overview stat rows ────────────────────────────────────────
  const statRows = [
    {
      heading: '👥 People',
      cards: [
        { label: 'Total Students',  value: stats?.totalStudents  ?? '…', icon: '🎓', color: 'border-blue-400' },
        { label: 'Total Tutors',    value: stats?.totalTutors    ?? '…', icon: '🧑‍🏫', color: 'border-blue-500' },
        { label: 'Active Students', value: stats?.activeStudents ?? '…', icon: '⚡', color: 'border-indigo-400',
          tip: 'Had ≥ 1 session ever' },
      ],
    },
    {
      heading: '📅 This Week',
      cards: [
        { label: 'Sessions Booked', value: stats?.bookedThisWeek    ?? '…', icon: '📅', color: 'border-green-400' },
        { label: 'Completed',       value: stats?.completedThisWeek ?? '…', icon: '✅', color: 'border-green-500' },
        { label: 'No-Shows',        value: stats?.noShowsThisWeek   ?? '…', icon: '❌', color: 'border-red-400'   },
      ],
    },
    {
      heading: '📈 All Time',
      cards: [
        { label: 'Total Sessions',  value: stats?.totalSessions  ?? '…', icon: '📊', color: 'border-purple-400' },
        { label: 'Completed',       value: stats?.totalCompleted ?? '…', icon: '✅', color: 'border-purple-500' },
        { label: 'No-Shows',        value: stats?.totalNoShows   ?? '…', icon: '❌', color: 'border-red-400'    },
      ],
    },
  ]

  // ── User Detail Modal ─────────────────────────────────────────
  const UserStatsModal = () => {
    if (!selectedUser) return null

    const isStudent = selectedUser.role === 'student'

    const statusPill = (status) => {
      if (status === 'completed') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Completed</span>
      if (status === 'no-show')   return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">No-show</span>
      return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Upcoming</span>
    }

    const modalStatRows = isStudent ? [
      {
        heading: '📅 Sessions',
        cards: [
          { label: 'Total Booked', value: userStats?.totalSessions ?? '…', icon: '📅', color: 'border-blue-400'   },
          { label: 'Upcoming',     value: userStats?.upcoming       ?? '…', icon: '🔜', color: 'border-indigo-400' },
          { label: 'This Week',    value: userStats?.thisWeek       ?? '…', icon: '📆', color: 'border-blue-300'   },
        ],
      },
      {
        heading: '📈 Outcomes',
        cards: [
          { label: 'Completed',  value: userStats?.completed      ?? '…', icon: '✅', color: 'border-green-400'  },
          { label: 'No-Shows',   value: userStats?.noShows        ?? '…', icon: '❌', color: 'border-red-400'    },
          { label: 'Fav. Tutor', value: userStats?.favouriteTutor ?? '…', icon: '🧑‍🏫', color: 'border-purple-400', small: true },
        ],
      },
    ] : [
      {
        heading: '📅 Sessions',
        cards: [
          { label: 'Total Taught', value: userStats?.totalSessions  ?? '…', icon: '📅', color: 'border-blue-400'   },
          { label: 'Upcoming',     value: userStats?.upcoming        ?? '…', icon: '🔜', color: 'border-indigo-400' },
          { label: 'This Week',    value: userStats?.thisWeek        ?? '…', icon: '📆', color: 'border-blue-300'   },
        ],
      },
      {
        heading: '📈 Outcomes',
        cards: [
          { label: 'Completed',       value: userStats?.completed      ?? '…', icon: '✅', color: 'border-green-400'  },
          { label: 'No-Shows',        value: userStats?.noShows        ?? '…', icon: '❌', color: 'border-red-400'    },
          { label: 'Unique Students', value: userStats?.uniqueStudents ?? '…', icon: '🎓', color: 'border-purple-400' },
        ],
      },
      {
        heading: '🗓️ Slots',
        cards: [
          { label: 'Slots Created', value: userStats?.totalSlotsCreated ?? '…', icon: '🟢', color: 'border-green-300' },
        ],
      },
    ]

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedUser(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`p-6 rounded-t-2xl ${isStudent ? 'bg-gray-700' : 'bg-blue-700'} text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{isStudent ? '🎓' : '🧑‍🏫'}</div>
                <div>
                  <h2 className="text-2xl font-extrabold">{selectedUser.name}</h2>
                  <p className="text-sm opacity-80">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold capitalize">
                      {selectedUser.role}
                    </span>
                    <span className="text-xs opacity-70">
                      Joined {formatJoined(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/70 hover:text-white text-2xl font-bold leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {modalLoading ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">⏳</div>
                <p>Loading stats...</p>
              </div>
            ) : (
              <>
                {/* Stat rows */}
                <div className="flex flex-col gap-4 mb-6">
                  {modalStatRows.map((row, ri) => (
                    <div key={ri}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        {row.heading}
                      </p>
                      <div className={`grid gap-3 ${row.cards.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                        {row.cards.map((card, ci) => (
                          <div key={ci} className={`bg-gray-50 rounded-xl p-4 text-center border-t-4 ${card.color}`}>
                            <div className="text-2xl mb-1">{card.icon}</div>
                            <p className={`font-extrabold text-blue-700 ${card.small ? 'text-base' : 'text-2xl'}`}>
                              {card.value}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{card.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent sessions */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    🕐 Recent Sessions (last 5)
                  </p>
                  {userStats?.recentSessions?.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No sessions yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {userStats?.recentSessions?.map((s, i) => (
                        <div key={i}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{formatDisplay(s.date)}</p>
                            <p className="text-xs text-gray-500">
                              {s.startTime} – {s.endTime}
                              {isStudent ? ` · Tutor: ${s.tutor}` : ` · Student: ${s.student}`}
                            </p>
                          </div>
                          {statusPill(s.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <UserStatsModal />
      <div className="max-w-6xl mx-auto">

        {/* ======= WELCOME HEADER ======= */}
        <div className="bg-blue-700 text-white rounded-2xl p-8 mb-6 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">🛡️ Admin Dashboard</h1>
              <p className="text-blue-100">
                Welcome back, {user?.name}. You have full access to all site controls.
              </p>
            </div>
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
              Admin
            </span>
          </div>
        </div>

        {/* ======= STATS TOGGLE BUTTON ======= */}
        <div className="mb-4">
          <button
            onClick={() => setShowStats(prev => !prev)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md text-gray-700 hover:text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition"
          >
            <span className="text-base">📊</span>
            {showStats ? 'Hide Stats' : 'Show Stats'}
            <span className="text-xs text-gray-400 ml-1">{showStats ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* ======= STATS ROWS ======= */}
        {showStats && (
          <div className="flex flex-col gap-4 mb-8">
            {statRows.map((row, ri) => (
              <div key={ri}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 pl-1">
                  {row.heading}
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {row.cards.map((stat, i) => (
                    <div key={i} className={`bg-white rounded-2xl shadow-sm p-5 text-center border-t-4 ${stat.color}`}>
                      <div className="text-3xl mb-1">{stat.icon}</div>
                      <p className="text-3xl font-extrabold text-blue-700">{stat.value}</p>
                      <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
                      {stat.tip && (
                        <p className="text-gray-400 text-xs mt-0.5 italic">{stat.tip}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* ======= QUICK ACTIONS ======= */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <button
              onClick={() => setActiveTab('Users')}
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-blue-400 hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Users</h3>
              <p className="text-gray-500 text-sm">
                {stats
                  ? `${stats.totalStudents + stats.totalTutors} registered users`
                  : 'View, edit or remove user accounts'}
              </p>
            </button>

            <button
              onClick={() => setActiveTab('Bookings')}
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-blue-500 hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Bookings</h3>
              <p className="text-gray-500 text-sm">
                {stats
                  ? `${stats.totalSessions} total sessions`
                  : 'View and manage all session bookings'}
              </p>
            </button>

            <button
              onClick={() => setActiveTab('Reviews')}
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-yellow-400 hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-gray-800 mb-1">Approve Reviews</h3>
              <p className="text-gray-500 text-sm">
                {stats?.pendingReviews > 0
                  ? `${stats.pendingReviews} review${stats.pendingReviews !== 1 ? 's' : ''} awaiting approval`
                  : 'No pending reviews'}
              </p>
              {stats?.pendingReviews > 0 && (
                <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                  Action needed
                </span>
              )}
            </button>

            <Link
              to="/availability"
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-green-400 hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">🟢</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Availability</h3>
              <p className="text-gray-500 text-sm">Set and edit tutor availability slots</p>
            </Link>

            <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-purple-400 opacity-60 cursor-not-allowed">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-gray-800 mb-1">View Reports</h3>
              <p className="text-gray-500 text-sm">Session stats and business overview</p>
              <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-gray-400 opacity-60 cursor-not-allowed">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-bold text-gray-800 mb-1">Site Settings</h3>
              <p className="text-gray-500 text-sm">Configure site-wide settings</p>
              <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>

          </div>
        </div>

        {/* ======= TABBED PANEL ======= */}
        <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">

          <div className="flex border-b border-gray-100">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'Reviews' && pendingFeedback.length > 0 && (
                  <span className="ml-1.5 bg-yellow-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingFeedback.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── BOOKINGS TAB ── */}
            {activeTab === 'Bookings' && (
              <div>
                {loading ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-2">⏳</div><p>Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="font-medium">No bookings yet.</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                      Upcoming ({upcoming.length})
                    </h3>
                    {upcoming.length === 0 ? (
                      <p className="text-gray-400 text-sm mb-6">No upcoming bookings.</p>
                    ) : (
                      <div className="flex flex-col gap-3 mb-6">
                        {upcoming.map(slot => (
                          <div key={slot._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="text-xl">🔴</div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{formatDisplay(slot.date)}</p>
                                <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                                <p className="text-xs text-orange-600 font-medium">
                                  Student: {slot.bookedBy?.name} — {slot.bookedBy?.email}
                                </p>
                                <p className="text-xs text-gray-400">Tutor: {slot.tutor?.name}</p>
                              </div>
                            </div>
                            <button onClick={() => handleUnbook(slot._id)}
                              className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto">
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {past.length > 0 && (
                      <>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                          Past ({past.length})
                        </h3>
                        <div className="flex flex-col gap-3">
                          {past.map(slot => (
                            <div key={slot._id}
                              className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 opacity-70">
                              <div className="text-xl">✅</div>
                              <div>
                                <p className="font-semibold text-gray-700 text-sm">{formatDisplay(slot.date)}</p>
                                <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                                <p className="text-xs text-gray-400">
                                  Student: {slot.bookedBy?.name} | Tutor: {slot.tutor?.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'Users' && (
              <div>
                {loading ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-2">⏳</div><p>Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="font-medium">No users found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {users.map(u => (
                      <div key={u._id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-5 py-4 border ${
                          u.role === 'admin' ? 'bg-red-50 border-red-200' :
                          u.role === 'tutor' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {u.role === 'admin' ? '🛡️' : u.role === 'tutor' ? '🧑‍🏫' : '🎓'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${
                                u.role === 'admin' ? 'bg-red-100 text-red-600' :
                                u.role === 'tutor' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {u.role}
                              </span>
                              <span className="text-xs text-gray-400">
                                Joined {formatJoined(u.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto">
                          {(u.role === 'student' || u.role === 'tutor') && (
                            <button
                              onClick={() => handleViewUser(u)}
                              className="bg-blue-100 text-blue-700 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-blue-200 transition"
                            >
                              View Stats 📊
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === 'Reviews' && (
              <div>
                {loading ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-2">⏳</div><p>Loading reviews...</p>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">⭐</div>
                    <p className="font-medium">No reviews yet.</p>
                  </div>
                ) : (
                  <div>
                    {pendingFeedback.length > 0 && (
                      <>
                        <h3 className="text-sm font-bold text-yellow-700 uppercase tracking-wide mb-3">
                          ⏳ Pending Approval ({pendingFeedback.length})
                        </h3>
                        <div className="flex flex-col gap-3 mb-6">
                          {pendingFeedback.map(f => (
                            <div key={f._id}
                              className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-800 text-sm">
                                      {f.author?.name || 'Anonymous'}
                                    </p>
                                    <span className="text-yellow-500 text-sm">
                                      {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 text-sm italic">"{f.message}"</p>
                                </div>
                                <div className="flex gap-2 self-start shrink-0">
                                  <button onClick={() => handleApproveFeedback(f._id)}
                                    className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-green-200 transition">
                                    Approve ✅
                                  </button>
                                  <button onClick={() => handleDeleteFeedback(f._id)}
                                    className="bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-red-200 transition">
                                    Delete 🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {approvedFeedback.length > 0 && (
                      <>
                        <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3">
                          ✅ Approved ({approvedFeedback.length})
                        </h3>
                        <div className="flex flex-col gap-3">
                          {approvedFeedback.map(f => (
                            <div key={f._id}
                              className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-800 text-sm">
                                    {f.author?.name || 'Anonymous'}
                                  </p>
                                  <span className="text-yellow-500 text-sm">
                                    {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm italic">"{f.message}"</p>
                              </div>
                              <button onClick={() => handleDeleteFeedback(f._id)}
                                className="bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start shrink-0">
                                Delete 🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ======= ADMIN ACCOUNT INFO ======= */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🛡️ Admin Account</h2>
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
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Role</p>
              <p className="text-red-500 font-bold capitalize">Administrator</p>
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

export default AdminDashboard