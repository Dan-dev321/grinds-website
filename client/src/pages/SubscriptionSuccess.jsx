import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SubscriptionSuccess = () => {
  const [searchParams]  = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    // The session_id comes back from Stripe in the success URL
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      return
    }

    // Poll /api/stripe/status to confirm webhook has fired
    // Retry up to 5 times with 1.5s gaps (webhooks can take a moment)
    let attempts = 0
    const MAX    = 5

    const poll = async () => {
      try {
        const res  = await fetch('/api/stripe/status', {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const data = await res.json()

        if (data.status === 'active') {
          setStatus('success')
        } else if (attempts < MAX) {
          attempts++
          setTimeout(poll, 1500)
        } else {
          // Webhook might be delayed — show success anyway,
          // the DB will update when it arrives
          setStatus('success')
        }
      } catch {
        setStatus('error')
      }
    }

    poll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ───────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Confirming your subscription…</h2>
          <p className="text-gray-400 text-sm">This only takes a moment.</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-6">
            We couldn't confirm your subscription. If you were charged, please contact support —
            your access will be activated as soon as we verify the payment.
          </p>
          <Link
            to="/pricing"
            className="inline-block bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-all duration-150"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">

        {/* Animated checkmark */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          You're all set!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your TutorBase subscription is now active.
          Head to your dashboard to get started.
        </p>

        {/* Quick links */}
        <div className="flex flex-col gap-3">
          <Link
            to="/dashboard/tutor"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all duration-150"
          >
            Go to my dashboard →
          </Link>
          <Link
            to="/pricing"
            className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors py-2"
          >
            View billing details
          </Link>
        </div>

        {/* What's next cards */}
        <div className="mt-8 grid grid-cols-1 gap-3 text-left">
          {[
            { icon: '🔗', title: 'Share your invite link', desc: 'Copy your link and send it to students.' },
            { icon: '📅', title: 'Set your availability', desc: 'Add your available slots to your calendar.' },
            { icon: '📓', title: 'Explore the notebook', desc: 'Notes are auto-created after each session.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-surface-100 rounded-xl p-4 border border-gray-100">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default SubscriptionSuccess