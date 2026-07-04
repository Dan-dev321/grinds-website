import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ALL_FEATURES = [
  'Unlimited students',
  'Smart scheduling calendar',
  'Session notebook',
  'Email reminders',
  'Student profiles',
  'Invite link registration',
  'Priority email support',
  'PDF session exports',
  'Attendance tracking',
  'Homework tracking',
  'Advanced analytics',
  'Parent portal access',
  'Early access to new features',
  'Dedicated onboarding call',
]

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19,
    period: '/month',
    billed: 'Billed monthly',
    saving: null,
    badge: null,
    highlight: false,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 15,
    period: '/month',
    billed: 'Billed €45 every 3 months',
    saving: 'Save €12',
    badge: 'Popular',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 12,
    period: '/month',
    billed: 'Billed €144/year',
    saving: 'Save €84',
    badge: 'Best value',
    highlight: true,
  },
]

const FAQ = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. Your 14-day free trial starts the moment you register — no payment details required.',
  },
  {
    q: 'What happens when my trial ends?',
    a: "You'll get an email reminder 3 days before it expires. After that, your account becomes read-only until you subscribe — we never delete your data.",
  },
  {
    q: 'Do all plans really include everything?',
    a: 'Yes. Every plan — Monthly, Quarterly, and Yearly — gives you the exact same full feature set. The only difference is how often you pay and how much you save.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade at any time through your billing portal. Changes take effect at the next billing cycle.',
  },
  {
    q: 'Can I cancel anytime?',
    a: "Absolutely. Cancel from your account settings with one click. You keep access until the end of your billing period.",
  },
  {
    q: 'Is my student data safe?',
    a: 'All data is stored securely. Each tutor has a completely isolated workspace — no student data is ever shared between accounts.',
  },
  {
    q: 'Do you offer refunds?',
    a: "If you're unhappy in your first 30 days after subscribing, contact us and we'll sort it out.",
  },
]

const Pricing = () => {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError]             = useState(null)
  const [openFaq, setOpenFaq]         = useState(null)

  // Detect ?cancelled=true coming back from Stripe
  const cancelled = new URLSearchParams(location.search).get('cancelled') === 'true'

  const handleChoosePlan = async (planId) => {
    // Not logged in → send to register
    if (!user) {
      navigate('/register')
      return
    }

    // Not a tutor → nothing to bill
    if (user.role !== 'tutor') return

    setLoadingPlan(planId)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-brand-600 text-white overflow-hidden">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-accent-600 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">

          <div className="inline-flex items-center gap-2 bg-brand-700/60 border border-brand-400 text-brand-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            14-day free trial · No credit card required
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            One plan. Every feature. Just pick your billing.
          </h1>
          <p className="text-brand-100 text-lg max-w-xl mx-auto leading-relaxed">
            Every plan includes the full product — no feature gates, no upsells.
            Pay monthly, quarterly, or yearly and save more the longer you commit.
          </p>

        </div>
      </section>

      {/* ── CANCELLED BANNER ─────────────────────────────────── */}
      {cancelled && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-amber-700 text-sm font-medium">
            ⚠️ Checkout was cancelled — your plan hasn't changed. Pick a plan below whenever you're ready.
          </p>
        </div>
      )}

      {/* ── PLAN CARDS ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface-100">
        <div className="max-w-5xl mx-auto">

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-brand-600 text-white shadow-xl ring-2 ring-brand-400'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >

                {/* Badge */}
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                {/* Plan name */}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                {/* Billed line */}
                <p className={`text-xs mb-1 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>
                  {plan.billed}
                </p>

                {/* Saving badge */}
                {plan.saving && (
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-4 w-fit ${
                    plan.highlight ? 'bg-accent-500 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {plan.saving}
                  </span>
                )}
                {!plan.saving && <div className="mb-4 h-[22px]" />}

                {/* Price */}
                <div className="flex items-end gap-1 mt-2 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    €{plan.price}
                  </span>
                  <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>

                {/* Full-access callout instead of a feature list */}
                <div
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-8 flex-grow ${
                    plan.highlight ? 'bg-brand-700/50' : 'bg-brand-50'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 text-lg ${plan.highlight ? 'text-accent-300' : 'text-brand-500'}`}>
                    ✓
                  </span>
                  <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-brand-100' : 'text-gray-600'}`}>
                    Includes <span className={`font-semibold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>every feature</span> —
                    scheduling, notebook, exports, analytics, parent portal, and more.
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleChoosePlan(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full text-center font-bold py-3 rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? 'bg-white text-brand-700 hover:bg-brand-50'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {loadingPlan === plan.id
                    ? 'Redirecting…'
                    : user
                    ? 'Choose plan'
                    : 'Start free trial'}
                </button>

              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            All plans include a 14-day free trial · Full feature access on every plan · Cancel anytime
          </p>

        </div>
      </section>

      {/* ── EVERYTHING INCLUDED (replaces comparison table) ──── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              No tiers, no gates
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Everything, on every plan
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Whether you pay monthly or yearly, you get the full product from day one.
              Billing frequency only changes what you pay — never what you get.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 bg-surface-100 rounded-2xl border border-gray-100 p-8">
            {ALL_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                  ✓
                </span>
                <span className="text-gray-700 text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface-100">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              FAQ
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Common questions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                  <span className={`text-brand-500 font-bold text-lg flex-shrink-0 transition-transform duration-200 ${
                    openFaq === i ? 'rotate-45' : ''
                  }`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative bg-brand-600 text-white py-20 px-4 overflow-hidden">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-accent-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-brand-400 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Start your free trial today
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            14 days free. No credit card. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all duration-150 shadow-lg"
            >
              Start your free trial →
            </Link>
            <Link
              to="/login"
              className="border border-brand-400 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-all duration-150"
            >
              Log in
            </Link>
          </div>
        </div>

      </section>

    </div>
  )
}

export default Pricing
