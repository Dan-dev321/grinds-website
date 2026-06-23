import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const Feedback = () => {
  const { user, token } = useAuth()

  const [approved, setApproved] = useState([])
  const [allFeedback, setAllFeedback] = useState([])
  const [myFeedback, setMyFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent'

  const authHeader = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {}

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  // ── Fetch approved (public) ────────────────────────────────────
  const fetchApproved = async () => {
    try {
      const res = await axios.get('${API}/api/feedback')
      setApproved(res.data)
    } catch (err) {
      console.error('Failed to fetch approved feedback')
    }
  }

  // ── Fetch all feedback (admin) ─────────────────────────────────
  const fetchAll = async () => {
    try {
      const res = await axios.get('${API}/api/feedback/all', authHeader)
      setAllFeedback(res.data)
    } catch (err) {
      console.error('Failed to fetch all feedback')
    }
  }

  // ── Fetch my feedback (student/parent) ────────────────────────
  const fetchMine = async () => {
    try {
      const res = await axios.get('${API}/api/feedback/my-feedback', authHeader)
      setMyFeedback(res.data)
    } catch (err) {
      console.error('Failed to fetch my feedback')
    }
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await fetchApproved()
      if (isAdmin) await fetchAll()
      if (isStudentOrParent) await fetchMine()
      setLoading(false)
    }
    loadAll()
  }, [user])

  // ── Submit feedback ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.comment.trim()) return flashError('Please write a comment')
    try {
      setSubmitting(true)
      await axios.post('${API}/api/feedback', form, authHeader)
      flashSuccess('Feedback submitted! ⏳ It will appear once approved.')
      setForm({ rating: 5, comment: '' })
      fetchMine()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Admin: approve ─────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await axios.put(`${API}/api/feedback/${id}/approve`, {}, authHeader)
      flashSuccess('Feedback approved ✅')
      fetchAll()
      fetchApproved()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to approve feedback')
    }
  }

  // ── Admin: delete ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return
    try {
      await axios.delete(`${API}/api/feedback/${id}`, authHeader)
      flashSuccess('Feedback deleted')
      fetchAll()
      fetchApproved()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to delete feedback')
    }
  }

  // ── Star renderer ──────────────────────────────────────────────
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3">⭐ Reviews</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            See what students say about Daniel's Maths Grinds
          </p>
        </div>

        {/* ── Flash Messages ── */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl text-center font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* ── NOT LOGGED IN: CTA ── */}
        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-center">
            <p className="text-blue-800 font-semibold text-lg mb-1">
              📝 Had a session with Daniel?
            </p>
            <p className="text-blue-600 text-sm mb-4">
              Log in to leave a review and help other students!
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/register"
                className="bg-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition text-sm">
                Register Free
              </Link>
              <Link to="/login"
                className="border-2 border-blue-700 text-blue-700 px-6 py-2 rounded-full font-semibold hover:bg-blue-100 transition text-sm">
                Log In
              </Link>
            </div>
          </div>
        )}

        {/* ── STUDENT/PARENT: Submit Form ── */}
        {isStudentOrParent && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Leave a Review</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Star Rating Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className={`text-3xl transition ${
                        star <= form.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-sm text-gray-400 self-center ml-2">
                    {form.rating}/5
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed self-start"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* ── STUDENT: My Submitted Reviews ── */}
        {isStudentOrParent && myFeedback.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 My Submitted Reviews</h2>
            <div className="flex flex-col gap-3">
              {myFeedback.map((fb) => (
                <div key={fb._id}
                  className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex gap-0.5 mb-1">{renderStars(fb.rating)}</div>
                    <p className="text-sm text-gray-700">{fb.comment}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full self-start sm:self-auto ${
                    fb.isApproved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {fb.isApproved ? 'Approved ✅' : 'Pending ⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN: All Feedback Panel ── */}
        {isAdmin && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🛠️ Admin — All Feedback</h2>
            {allFeedback.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <p>No feedback submitted yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allFeedback.map((fb) => (
                  <div key={fb._id}
                    className={`bg-white border rounded-xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      fb.isApproved ? 'border-green-200' : 'border-yellow-200'
                    }`}>
                    <div className="flex-1">
                      <div className="flex gap-0.5 mb-1">{renderStars(fb.rating)}</div>
                      <p className="text-sm text-gray-700 mb-1">{fb.comment}</p>
                      <p className="text-xs text-gray-400">
                        By: {fb.student?.name} ({fb.student?.email})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        fb.isApproved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {fb.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {!fb.isApproved && (
                        <button
                          onClick={() => handleApprove(fb._id)}
                          className="bg-green-600 text-white text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-green-700 transition">
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(fb._id)}
                        className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PUBLIC: Approved Reviews ── */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">💬 Student Reviews</h2>
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">⏳</div>
              <p>Loading reviews...</p>
            </div>
          ) : approved.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium">No reviews yet — be the first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approved.map((fb) => (
                <div key={fb._id}
                  className="bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition">
                  <div className="flex gap-0.5 mb-2 text-xl">{renderStars(fb.rating)}</div>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{fb.comment}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {fb.student?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{fb.student?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Feedback