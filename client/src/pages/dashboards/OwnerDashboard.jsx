import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const STATUS_STYLES = {
  active:        { label: 'Active',        bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700'   },
  trial:         { label: 'Trial',         bg: 'bg-brand-50',  border: 'border-brand-200',  text: 'text-brand-700',  pill: 'bg-brand-100 text-brand-700'   },
  trial_expired: { label: 'Trial Expired', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', pill: 'bg-yellow-100 text-yellow-700' },
  past_due:      { label: 'Past Due',      bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', pill: 'bg-orange-100 text-orange-700' },
  cancelled:     { label: 'Cancelled',     bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   pill: 'bg-gray-200 text-gray-600'     },
}

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

const FILTERS = ['All', 'Active', 'Trial', 'Trial Expired', 'Past Due', 'Cancelled']

const OwnerDashboard = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API}/api/owner/billing`, authHeader)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load billing data')
      } finally {
        setLoading(false)
      }
    }
    fetchBilling()
  }, [])

  const filteredTutors = data?.tutors?.filter(t => {
    if (filter === 'All') return true
    const key = filter.toLowerCase().replace(' ', '_')
    return t.status === key
  }) ?? []

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-brand-700 text-white rounded-2xl p-8 mb-6 shadow-md">
          <h1 className="text-3xl font-extrabold mb-1">💰 Billing Overview</h1>
          <p className="text-brand-100">Welcome back, {user?.name}.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">⏳</div>
            <p>Loading billing data...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center border-t-4 border-green-500 col-span-2 sm:col-span-1">
                <p className="text-3xl font-extrabold text-green-700">€{data.mrr}</p>
                <p className="text-gray-500 text-xs mt-1">Est. MRR</p>
              </div>
              {['active', 'trial', 'past_due', 'cancelled'].map(key => {
                const style = STATUS_STYLES[key]
                return (
                  <div key={key} className={`bg-white rounded-2xl shadow-sm p-5 text-center border-t-4 ${style.border}`}>
                    <p className={`text-3xl font-extrabold ${style.text}`}>{data.counts[key] || 0}</p>
                    <p className="text-gray-500 text-xs mt-1">{style.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition ${
                    filter === f
                      ? 'bg-brand-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Tutor billing list */}
            {filteredTutors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium">No tutors match this filter.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTutors.map(t => {
                  const style = STATUS_STYLES[t.status] || STATUS_STYLES.cancelled
                  return (
                    <div key={t.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-5 py-4 border ${style.bg} ${style.border}`}>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(t.joined)}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:text-right">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.pill}`}>
                          {style.label}
                        </span>
                        <div className="text-xs text-gray-500">
                          {t.plan && <p className="capitalize">{t.plan} plan</p>}
                          {t.status === 'trial' && <p>Ends {formatDate(t.trialEnds)}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard