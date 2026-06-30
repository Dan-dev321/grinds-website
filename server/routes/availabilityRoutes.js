const express  = require('express')
const router   = express.Router()

const { protect, tutorOnly, studentOnly, ownerOnly } = require('../middleware/authMiddleware')
const requireSubscription = require('../middleware/requireSubscription')

const {
  addSlot,
  getSlotsByWeek,
  getAllSlots,
  getMyBookings,
  bookSlot,
  unbookSlot,
  deleteSlot,
  copyDay,
  getAllBookings,
  cleanupStaleSlots,
  repeatWeekly,
  clearDay,
} = require('../controllers/availabilityController')

// ── Public / Read ─────────────────────────────────────────────────────────────
// Cancelled tutors can still VIEW their data — never delete it
router.get('/',             getSlotsByWeek)
router.get('/all',          protect, tutorOnly,   getAllSlots)
router.get('/my-bookings',  protect,              getMyBookings)
router.get('/all-bookings', protect, ownerOnly,   getAllBookings)

// ── Write — blocked if trial expired or cancelled ─────────────────────────────
router.delete('/cleanup',   protect, tutorOnly,   cleanupStaleSlots)
router.delete('/clear-day', protect, tutorOnly,   requireSubscription, clearDay)
router.post('/',            protect, tutorOnly,   requireSubscription, addSlot)
router.post('/copy-day',    protect, tutorOnly,   requireSubscription, copyDay)
router.post('/recurring',   protect, tutorOnly,   requireSubscription, repeatWeekly)
router.post('/book',        protect, studentOnly, requireSubscription, bookSlot)
router.put('/:id/unbook',   protect,              requireSubscription, unbookSlot)
router.delete('/:id',       protect, tutorOnly,   requireSubscription, deleteSlot)

module.exports = router