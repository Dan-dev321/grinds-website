// controllers/cronController.js
const Availability = require('../models/Availability')
const { sendEmail } = require('../services/emailService')
const { sessionReminder } = require('../emails/templates/sessionReminder')
const Tutor = require('../models/Tutor')
const { trialEnding } = require('../emails/templates/trialEnding')
const { trialExpired } = require('../emails/templates/trialExpired')

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Combine a 'YYYY-MM-DD' date string + 'HH:MM' time string into a real Date object
const toDateTime = (dateStr, timeStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, m] = timeStr.split(':').map(Number)
  return new Date(y, mo - 1, d, h, m, 0)
}

// ── POST /api/cron/send-session-reminders ──────────────────────────────────
const sendSessionReminders = async (req, res) => {
  try {
    const now = new Date()

    // Window: sessions starting between 23.5h and 24.5h from now.
    // This gives a ~1hr catch window so a cron firing every 15-30 min
    // never misses a booking, while still sending "roughly 24h before".
    const windowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000)
    const windowEnd   = new Date(now.getTime() + 24.5 * 60 * 60 * 1000)

    // Only booked, non-manual slots that haven't been reminded yet.
    // (Manual bookings may have no reliable email, and their own field
    // could be added later if needed — skipped for now.)
    const candidates = await Availability.find({
      slotType: 'booked',
      isManualBooking: false,
      reminderSent: false,
    })
      .populate('tutor', 'name email')
      .populate('bookedBy', 'name email')

    const due = candidates.filter(slot => {
      const sessionStart = toDateTime(slot.date, slot.startTime)
      return sessionStart >= windowStart && sessionStart <= windowEnd
    })

    let sentCount = 0

    for (const slot of due) {
      const tutorEmail = slot.tutor?.email
      const studentEmail = slot.bookedBy?.email

      if (tutorEmail) {
        const { subject, html } = sessionReminder({
          role: 'tutor',
          recipientName: slot.tutor.name,
          otherPartyName: slot.bookedBy?.name || 'your student',
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dashboardUrl: `${CLIENT_URL}/dashboard/tutor`,
        })
        sendEmail(tutorEmail, subject, html).catch(err =>
          console.error(`Reminder email failed (tutor, slot ${slot._id}):`, err)
        )
      }

      if (studentEmail) {
        const { subject, html } = sessionReminder({
          role: 'student',
          recipientName: slot.bookedBy.name,
          otherPartyName: slot.tutor?.name || 'your tutor',
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dashboardUrl: `${CLIENT_URL}/dashboard/student`,
        })
        sendEmail(studentEmail, subject, html).catch(err =>
          console.error(`Reminder email failed (student, slot ${slot._id}):`, err)
        )
      }

      // Mark as sent immediately so a duplicate cron run/overlap can't re-send.
      // Doing this per-slot right after queuing the emails (not in a batch at
      // the end) minimizes the race window.
      slot.reminderSent = true
      await slot.save()
      sentCount++
    }

    

    res.json({ checked: candidates.length, remindersSent: sentCount })
  } catch (err) {
    console.error('sendSessionReminders error:', err)
    res.status(500).json({ message: 'Cron job failed', error: err.message })
  }
}

// ── POST /api/cron/send-trial-reminders ────────────────────────────────────
const sendTrialReminders = async (req, res) => {
  try {
    const now = new Date()
    const PRICING_URL = `${CLIENT_URL}/pricing`

    // ── Trial ending soon: 3-day window (2.5-3.5 days out) ──────────────
    const endingWindowStart = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000)
    const endingWindowEnd   = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000)

    const endingSoon = await Tutor.find({
      'subscription.status': 'trial',
      'subscription.trialReminderSent': false,
      'subscription.trialEnds': { $gte: endingWindowStart, $lte: endingWindowEnd },
    })

    let endingSentCount = 0
    for (const tutor of endingSoon) {
      const { subject, html } = trialEnding({
        name: tutor.name,
        trialEnds: tutor.subscription.trialEnds,
        pricingUrl: PRICING_URL,
      })
      sendEmail(tutor.email, subject, html).catch(err =>
        console.error(`Trial ending email failed (tutor ${tutor._id}):`, err)
      )
      tutor.subscription.trialReminderSent = true
      await tutor.save()
      endingSentCount++
    }

    // ── Trial expired: trialEnds has passed, status still 'trial' ───────
    const expired = await Tutor.find({
      'subscription.status': 'trial',
      'subscription.trialExpiredEmailSent': false,
      'subscription.trialEnds': { $lte: now },
    })

    let expiredSentCount = 0
    for (const tutor of expired) {
      const { subject, html } = trialExpired({
        name: tutor.name,
        pricingUrl: PRICING_URL,
      })
      sendEmail(tutor.email, subject, html).catch(err =>
        console.error(`Trial expired email failed (tutor ${tutor._id}):`, err)
      )
      tutor.subscription.trialExpiredEmailSent = true
      await tutor.save()
      expiredSentCount++
    }

    res.json({
      endingSoonChecked: endingSoon.length,
      endingSoonSent: endingSentCount,
      expiredChecked: expired.length,
      expiredSent: expiredSentCount,
    })
  } catch (err) {
    console.error('sendTrialReminders error:', err)
    res.status(500).json({ message: 'Cron job failed', error: err.message })
  }
}

module.exports = { sendSessionReminders, sendTrialReminders }