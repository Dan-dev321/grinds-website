const express = require('express')
const router = express.Router()
const stripe = require('../config/stripe')
const Tutor = require('../models/Tutor')
const { protect } = require('../middleware/authMiddleware')

// ─────────────────────────────────────────────
// PRICE MAP
// Maps plan name → your Stripe Price ID
// ─────────────────────────────────────────────
const PRICE_MAP = {
  monthly:   process.env.STRIPE_PRICE_MONTHLY,
  quarterly: process.env.STRIPE_PRICE_QUARTERLY,
  yearly:    process.env.STRIPE_PRICE_YEARLY,
}

// ─────────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for the chosen plan
// ─────────────────────────────────────────────
router.post('/checkout', protect, async (req, res) => {
  try {
    const { plan } = req.body

    if (!PRICE_MAP[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected.' })
    }

    const tutor = await Tutor.findById(req.user.id)
    if (!tutor) return res.status(404).json({ message: 'Tutor not found.' })

    // Reuse existing Stripe customer or create a new one
    let customerId = tutor.subscription.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tutor.email,
        name: tutor.name,
        metadata: { tutorId: tutor._id.toString() },
      })
      customerId = customer.id
      tutor.subscription.stripeCustomerId = customerId
      await tutor.save()
    }

    // Build the Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/pricing?cancelled=true`,
      subscription_data: {
        metadata: { tutorId: tutor._id.toString(), plan },
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ message: 'Failed to create checkout session.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/stripe/portal
// Redirects tutor to Stripe Customer Portal
// (manage/cancel their own subscription)
// ─────────────────────────────────────────────
router.post('/portal', protect, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.user.id)

    if (!tutor?.subscription?.stripeCustomerId) {
      return res.status(400).json({ message: 'No billing account found.' })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tutor.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    })

    res.json({ url: portalSession.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    res.status(500).json({ message: 'Failed to open billing portal.' })
  }
})

// ─────────────────────────────────────────────
// GET /api/stripe/status
// Returns current subscription status for the
// logged-in tutor (used by frontend guards)
// ─────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.user.id).select('subscription')
    if (!tutor) return res.status(404).json({ message: 'Tutor not found.' })

    const { status, trialEnds, plan } = tutor.subscription

    // Check if trial has silently expired
    const trialExpired =
      status === 'trial' && trialEnds && new Date() > new Date(trialEnds)

    res.json({
      status: trialExpired ? 'trial_expired' : status,
      trialEnds,
      plan,
    })
  } catch (err) {
    console.error('Stripe status error:', err)
    res.status(500).json({ message: 'Failed to fetch subscription status.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/stripe/webhook
// Stripe sends events here — MUST use raw body
// Register this route BEFORE express.json()
// ─────────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // raw body required for signature verification
  async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // ── Helper: find tutor by Stripe customer ID ──
    const findTutor = async (customerId) =>
      Tutor.findOne({ 'subscription.stripeCustomerId': customerId })

    try {
      switch (event.type) {

        // ── Checkout completed → activate subscription ──
        case 'checkout.session.completed': {
          const session = event.data.object
          if (session.mode !== 'subscription') break

          const tutor = await findTutor(session.customer)
          if (!tutor) break

          const sub = await stripe.subscriptions.retrieve(session.subscription)
          const plan = sub.metadata?.plan || null

          tutor.subscription.stripeSubscriptionId = session.subscription
          tutor.subscription.status = 'active'
          tutor.subscription.plan   = plan
          tutor.subscription.trialEnds = null
          await tutor.save()

          console.log(`✅ Subscription activated for tutor ${tutor.email}`)
          break
        }

        // ── Subscription updated (plan change, renewal) ──
        case 'customer.subscription.updated': {
          const sub = await event.data.object
          const tutor = await findTutor(sub.customer)
          if (!tutor) break

          // Map Stripe status → our status
          const statusMap = {
            active:   'active',
            past_due: 'past_due',
            canceled: 'cancelled',
            trialing: 'trial',
          }

          tutor.subscription.status = statusMap[sub.status] ?? tutor.subscription.status
          await tutor.save()

          console.log(`🔄 Subscription updated for tutor ${tutor.email}: ${sub.status}`)
          break
        }

        // ── Subscription deleted/cancelled ──
        case 'customer.subscription.deleted': {
          const sub = event.data.object
          const tutor = await findTutor(sub.customer)
          if (!tutor) break

          tutor.subscription.status = 'cancelled'
          await tutor.save()

          console.log(`❌ Subscription cancelled for tutor ${tutor.email}`)
          break
        }

        // ── Payment failed → flag as past_due ──
        case 'invoice.payment_failed': {
          const invoice = event.data.object
          const tutor = await findTutor(invoice.customer)
          if (!tutor) break

          tutor.subscription.status = 'past_due'
          await tutor.save()

          console.log(`⚠️ Payment failed for tutor ${tutor.email}`)
          break
        }

        default:
          // Unhandled event — safe to ignore
          break
      }
    } catch (err) {
      console.error('Webhook handler error:', err)
      // Still return 200 so Stripe doesn't retry endlessly
    }

    res.json({ received: true })
  }
)

module.exports = router