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

const formatJoined = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

// ── Tabs for the main panel ───────────────────────────────────
const TABS = ['Bookings', 'Users', 'Reviews']

const AdminDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [stats, setStats]         = useState(null)
  const [users, setUsers]         = useState([])
  const [bookings, setBookings]   = useState([])
  const [feedback, setFeedback]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('Bookings')
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')

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

  // ── Derived ───────────────────────────────────────────────────
  const todayStr    = new Date().toISOString().split('T')[0]
  const upcoming    = bookings.filter(b => b.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  const past        = bookings.filter(b => b.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
  const pendingFeedback  = feedback.filter(f => !f.approved)
  const approvedFeedback = feedback.filter(f => f.approved)

  const statCards = [
    { label: 'Total Users',     value: stats?.totalUsers    ?? '…', icon: '👥', color: 'border-blue-400' },
    { label: 'Total Bookings',  value: stats?.totalBookings ?? '…', icon: '📅', color: 'border-blue-500' },
    { label: 'Pending Reviews', value: stats?.pendingReviews ?? '…', icon: '⭐', color: 'border-yellow-400' },
    { label: 'Active Slots',    value: stats?.activeSlots   ?? '…', icon: '🟢', color: 'border-green-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ======= WELCOME HEADER ======= */}
        <div className="bg-blue-700 text-white rounded-2xl p-8 mb-8 shadow-md">
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
          {statCards.map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm p-5 text-center border-t-4 ${stat.color}`}>
              <div className="text-3xl mb-1">{stat.icon}</div>
              <p className="text-3xl font-extrabold text-blue-700">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ======= QUICK ACTIONS ======= */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Users */}
            <button
              onClick={() => setActiveTab('Users')}
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-blue-400 hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Users</h3>
              <p className="text-gray-500 text-sm">
                {stats ? `${stats.totalUsers} registered users` : 'View, edit or remove user accounts'}
              </p>
            </button>

            {/* Bookings */}
            <button
              onClick={() => setActiveTab('Bookings')}
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-blue-500 hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Bookings</h3>
              <p className="text-gray-500 text-sm">
                {stats ? `${stats.totalBookings} total bookings` : 'View and manage all session bookings'}
              </p>
            </button>

            {/* Reviews */}
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

            {/* Availability */}
            <Link
              to="/availability"
              className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-green-400 hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">🟢</div>
              <h3 className="font-bold text-gray-800 mb-1">Manage Availability</h3>
              <p className="text-gray-500 text-sm">Set and edit tutor availability slots</p>
            </Link>

            {/* Reports — visual only */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-purple-400 opacity-60 cursor-not-allowed">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-gray-800 mb-1">View Reports</h3>
              <p className="text-gray-500 text-sm">Session stats and business overview</p>
              <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>

            {/* Settings — visual only */}
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

          {/* Tab bar */}
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
                    {/* Upcoming */}
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
                                <p className="text-xs text-gray-400">
                                  Tutor: {slot.tutor?.name}
                                </p>
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

                    {/* Past */}
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
                          u.role === 'admin'  ? 'bg-red-50 border-red-200' :
                          u.role === 'tutor'  ? 'bg-blue-50 border-blue-200' :
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
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto"
                          >
                            Delete
                          </button>
                        )}
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
                    {/* Pending */}
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

                    {/* Approved */}
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