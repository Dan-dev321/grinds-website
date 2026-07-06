import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const Billing = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleManageBilling = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${API}/api/stripe/portal`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      window.location.href = res.data.url
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to open billing portal. Please try again.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/dashboard/tutor"
          className="text-sm text-brand-600 hover:text-brand-700 font-semibold mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">💳 Billing</h1>
          <p className="text-gray-500 text-sm mb-6">
            Manage your subscription, payment method, and invoices.
          </p>

          <div className="bg-gray-50 rounded-xl px-5 py-4 mb-6">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Current Plan</p>
            <p className="text-gray-800 font-medium text-sm">
              {user?.subscription?.status === 'active'
                ? 'Active subscription'
                : user?.subscription?.status === 'trial'
                ? `Free trial — ends ${user?.subscription?.trialEnds ? new Date(user.subscription.trialEnds).toLocaleDateString('en-IE') : '—'}`
                : user?.subscription?.status || '—'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-all duration-150"
          >
            {loading ? 'Opening portal…' : 'Manage Billing (Stripe Portal)'}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            You'll be redirected to Stripe to update payment details or cancel your subscription.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Billing