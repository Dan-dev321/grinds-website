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

const StudentDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/availability/my-bookings`, authHeader)
      setBookings(res.data)
    } catch (err) {
      flashError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (slotId) => {
    if (!window.confirm('Cancel this session?')) return
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Session cancelled ✅')
      fetchBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  // ── Split into upcoming vs past ──────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(b => b.date >= todayStr)
  const past     = bookings.filter(b => b.date <  todayStr)

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ======= WELCOME HEADER ======= */}
        <div className="bg-blue-700 text-white rounded-2xl p-8 mb-8 shadow-md">
          <h1 className="text-3xl font-extrabold mb-1">
            👋 Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-blue-100">
            Here's your student dashboard — manage your sessions and track your progress.
          </p>
          <span className="inline-block mt-3 bg-blue-600 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            {user?.role}
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

        {/* ======= QUICK ACTIONS ======= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Link
            to="/availability"
            className="bg-white rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition border-t-4 border-blue-400"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-bold text-gray-800">Book a Session</h3>
            <p className="text-gray-500 text-sm mt-1">View available slots and book your next grind</p>
          </Link>

          <Link
            to="/services"
            className="bg-white rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition border-t-4 border-blue-500"
          >
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-gray-800">View Pricing</h3>
            <p className="text-gray-500 text-sm mt-1">Check session rates for JC and LC</p>
          </Link>

          <Link
            to="/feedback"
            className="bg-white rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition border-t-4 border-blue-700"
          >
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-gray-800">Leave a Review</h3>
            <p className="text-gray-500 text-sm mt-1">Share your experience with other students</p>
          </Link>
        </div>

        {/* ======= MY UPCOMING SESSIONS ======= */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">📚 My Upcoming Sessions</h2>
            {upcoming.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {upcoming.length} booked
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading your sessions...</p>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-medium">No upcoming sessions booked yet.</p>
              <p className="text-sm mt-1">Head to the availability page to book your first session!</p>
              <Link
                to="/availability"
                className="inline-block mt-4 bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition"
              >
                Book Now →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map(slot => (
                <div
                  key={slot._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {formatDisplay(slot.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        Tutor: {slot.tutor?.name || 'Daniel'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(slot._id)}
                    className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto"
                  >
                    Cancel Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======= PAST SESSIONS ======= */}
        {!loading && past.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">🕘 Past Sessions</h2>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                {past.length} completed
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {past.map(slot => (
                <div
                  key={slot._id}
                  className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 opacity-75"
                >
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">
                      {formatDisplay(slot.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {slot.startTime} – {slot.endTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      Tutor: {slot.tutor?.name || 'Daniel'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/feedback"
                className="text-blue-600 text-sm font-semibold hover:underline"
              >
                ⭐ Enjoyed your sessions? Leave a review →
              </Link>
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

export default StudentDashboard