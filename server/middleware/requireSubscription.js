const Tutor = require('../models/Tutor')

const requireSubscription = async (req, res, next) => {
  // ✅ Dev bypass — set BYPASS_SUBSCRIPTION=true in server/.env
  if (process.env.BYPASS_SUBSCRIPTION === 'true') return next()

  try {
    if (!req.user || req.role !== 'tutor') return next()

    const tutor = await Tutor.findById(req.user.id).select('subscription')
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' })

    const { status, trialEnds } = tutor.subscription

    if (status === 'trial' && trialEnds && new Date() > new Date(trialEnds)) {
      return res.status(402).json({
        message: 'Your free trial has ended. Please subscribe to continue.',
        code: 'TRIAL_EXPIRED',
      })
    }

    if (status === 'cancelled') {
      return res.status(402).json({
        message: 'Your subscription has been cancelled. Please resubscribe to continue.',
        code: 'SUBSCRIPTION_CANCELLED',
      })
    }

    if (status === 'past_due') {
      res.setHeader('X-Subscription-Warning', 'past_due')
    }

    next()
  } catch (err) {
    console.error('requireSubscription error:', err)
    res.status(500).json({ message: 'Server error checking subscription' })
  }
}

module.exports = requireSubscription