const express = require('express')
const router  = express.Router()

const { protect, ownerOnly } = require('../middleware/authMiddleware')
const Tutor = require('../models/Tutor')

// Monthly-equivalent price per plan, matching your Stripe Price IDs / Pricing page
const PLAN_PRICES = {
  monthly:   19,
  quarterly: 15,
  yearly:    12,
}

// ─────────────────────────────────────────────
// GET /api/admin/billing
// Owner-only: who's paying, who's trialing, who's lapsed.
// No student data, no booking data — billing only.
// ─────────────────────────────────────────────
router.get('/billing', protect, ownerOnly, async (req, res) => {
  try {
    const tutors = await Tutor.find().select('name email subscription createdAt')

    const rows = tutors.map(t => {
      const sub = t.subscription || {}
      const trialExpired =
        sub.status === 'trial' && sub.trialEnds && new Date() > new Date(sub.trialEnds)

      return {
        id:        t._id,
        name:      t.name,
        email:     t.email,
        status:    trialExpired ? 'trial_expired' : sub.status,
        plan:      sub.plan || null,
        trialEnds: sub.trialEnds || null,
        joined:    t.createdAt,
      }
    })

    const mrr = rows
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + (PLAN_PRICES[r.plan] || 0), 0)

    const counts = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})

    res.json({ mrr, counts, tutors: rows })
  } catch (err) {
    res.status(500).json({ message: 'Failed to load billing data', error: err.message })
  }
})

module.exports = router