const express = require('express')
const router = express.Router()
const stripe = require('../config/stripe')
const Tutor = require('../models/Tutor')
const { protect } = require('../middleware/authMiddleware')

const { sendEmail } = require('../services/emailService')
const { paymentReceipt } = require('../emails/templates/paymentReceipt')
const { paymentFailed } = require('../emails/templates/paymentFailed')

// ─────────────────────────────────────────────
// PRICE MAP
// ─────────────────────────────────────────────
const PRICE_MAP = {
  monthly:   process.env.STRIPE_PRICE_MONTHLY,
  quarterly: process.env.STRIPE_PRICE_QUARTERLY,
  yearly:    process.env.STRIPE_PRICE_YEARLY,
}

// ─────────────────────────────────────────────
// POST /api/stripe/checkout
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
    let customerId = tutor.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tutor.email,
        name: tutor.name,
        metadata: { tutorId: tutor._id.toString() },
      })
      customerId = customer.id

      // ✅ Use updateOne to avoid full document validation on trial_expired status
      await Tutor.updateOne(
        { _id: tutor._id },
        { $set: { 'subscription.stripeCustomerId': customerId } }
      )
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
// ─────────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
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

    const findTutor = async (customerId) =>
      Tutor.findOne({ 'subscription.stripeCustomerId': customerId })

    try {
      switch (event.type) {

        case 'checkout.session.completed': {
          const session = event.data.object
          if (session.mode !== 'subscription') break

          const tutor = await findTutor(session.customer)
          if (!tutor) break

          const sub = await stripe.subscriptions.retrieve(session.subscription)
          const plan = sub.metadata?.plan || null

          // ✅ Use updateOne to avoid enum validation issues
          await Tutor.updateOne(
            { _id: tutor._id },
            {
              $set: {
                'subscription.stripeSubscriptionId': session.subscription,
                'subscription.status': 'active',
                'subscription.plan':   plan,
                'subscription.trialEnds': null,
              }
            }
          )

          console.log(`✅ Subscription activated for tutor ${tutor.email}`)
          break
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object
          const tutor = await findTutor(sub.customer)
          if (!tutor) break

          const statusMap = {
            active:   'active',
            past_due: 'past_due',
            canceled: 'cancelled',
            trialing: 'trial',
          }

          const newStatus = statusMap[sub.status] ?? tutor.subscription.status

          await Tutor.updateOne(
            { _id: tutor._id },
            { $set: { 'subscription.status': newStatus } }
          )

          console.log(`🔄 Subscription updated for tutor ${tutor.email}: ${sub.status}`)
          break
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object
          const tutor = await findTutor(sub.customer)
          if (!tutor) break

          await Tutor.updateOne(
            { _id: tutor._id },
            { $set: { 'subscription.status': 'cancelled' } }
          )

          console.log(`❌ Subscription cancelled for tutor ${tutor.email}`)
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object
          const tutor = await findTutor(invoice.customer)
          if (!tutor) break

          const { subject, html } = paymentReceipt({
            name: tutor.name,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            plan: tutor.subscription.plan,
            dashboardUrl: `${process.env.CLIENT_URL}/dashboard/tutor`,
          })
          sendEmail(tutor.email, subject, html).catch(err =>
            console.error('Receipt email failed:', err)
          )

          console.log(`💰 Payment succeeded for tutor ${tutor.email}`)
          break
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object
          const tutor = await findTutor(invoice.customer)
          if (!tutor) break

          await Tutor.updateOne(
            { _id: tutor._id },
            { $set: { 'subscription.status': 'past_due' } }
          )

          const { subject, html } = paymentFailed({
            name: tutor.name,
            dashboardUrl: `${process.env.CLIENT_URL}/dashboard/tutor`,
          })
          sendEmail(tutor.email, subject, html).catch(err =>
            console.error('Payment failed email failed to send:', err)
          )

          console.log(`⚠️ Payment failed for tutor ${tutor.email}`)
          break
        }

        default:
          break
      }
    } catch (err) {
      console.error('Webhook handler error:', err)
    }

    res.json({ received: true })
  }
)

module.exports = router