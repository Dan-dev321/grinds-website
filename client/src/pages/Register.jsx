import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const Register = () => {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  // If a ?code= param exists in the URL, default to student registration
  const codeFromUrl     = searchParams.get('code') || ''
  const [mode, setMode] = useState(codeFromUrl ? 'student' : 'tutor')

  const [form, setForm] = useState({
    name: '', email: '', password: '', businessName: '', inviteCode: codeFromUrl,
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'tutor'
        ? `${API}/api/auth/register/tutor`
        : `${API}/api/auth/register/student`
      await axios.post(endpoint, form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">TutorBase</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {mode === 'tutor'
              ? 'Start your free 14-day trial'
              : 'Join your tutor\'s workspace'}
          </p>
        </div>

        {/* Mode toggle — only show if no code in URL */}
        {!codeFromUrl && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('tutor')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'tutor' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              I'm a Tutor
            </button>
            <button
              onClick={() => setMode('student')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'student' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              I'm a Student
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            name="name" placeholder="Full name" value={form.name}
            onChange={handle} required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400"
          />
          <input
            name="email" type="email" placeholder="Email" value={form.email}
            onChange={handle} required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400"
          />
          <input
            name="password" type="password" placeholder="Password" value={form.password}
            onChange={handle} required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400"
          />

          {/* Tutor only */}
          {mode === 'tutor' && (
            <input
              name="businessName" placeholder="Business name (optional)" value={form.businessName}
              onChange={handle}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400"
            />
          )}

          {/* Student only */}
          {mode === 'student' && (
            <input
              name="inviteCode"
              placeholder="Tutor invite code (e.g. AB4X92)"
              value={form.inviteCode}
              onChange={handle}
              required
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-sky-400"
            />
          )}

          <button
            type="submit" disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition text-sm mt-2"
          >
            {loading ? 'Creating account...' : mode === 'tutor' ? 'Start Free Trial' : 'Join Workspace'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 font-semibold hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  )
}

export default Register