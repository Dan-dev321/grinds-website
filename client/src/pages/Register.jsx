import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const Register = () => {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { login }      = useAuth()

  const codeFromUrl    = searchParams.get('code') || ''
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
      if (mode === 'tutor') {
        const res = await axios.post(`${API}/api/auth/register/tutor`, {
          name:         form.name,
          email:        form.email,
          password:     form.password,
          businessName: form.businessName,
        })
        // Auto-login after registration
        const { token, ...userData } = res.data
        login(userData, token)
        navigate('/dashboard/tutor')

      } else {
        const res = await axios.post(`${API}/api/auth/register/student`, {
          name:       form.name,
          email:      form.email,
          password:   form.password,
          inviteCode: form.inviteCode,
        })
        const { token, ...userData } = res.data
        login(userData, token)
        navigate('/dashboard/student')
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white font-black text-lg">TN</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">TutorNode</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {mode === 'tutor'
              ? 'Start your free 14-day trial'
              : "Join your tutor's workspace"}
          </p>
        </div>

        {/* Mode toggle — hidden if invite code in URL */}
        {!codeFromUrl && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('tutor')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                mode === 'tutor'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              I'm a Tutor
            </button>
            <button
              type="button"
              onClick={() => setMode('student')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                mode === 'student'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              I'm a Student
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">

          <input
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handle}
            required
            className="input"
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handle}
            required
            className="input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handle}
            required
            className="input"
          />

          {mode === 'tutor' && (
            <input
              name="businessName"
              placeholder="Business name (optional)"
              value={form.businessName}
              onChange={handle}
              className="input"
            />
          )}

          {mode === 'student' && (
            <input
              name="inviteCode"
              placeholder="Tutor invite code (e.g. AB4X92)"
              value={form.inviteCode}
              onChange={handle}
              required
              className="input font-mono uppercase tracking-widest"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading
              ? 'Creating account…'
              : mode === 'tutor'
              ? 'Start Free Trial'
              : 'Join Workspace'}
          </button>

        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register