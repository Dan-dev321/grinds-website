const express = require('express')
const router = express.Router()
const { protect, isTutor, isStudentOrParent, adminOnly } = require('../middleware/authMiddleware')  // ✅ added adminOnly
const {
  addSlot,
  getSlotsByWeek,
  getAllSlots,
  getMyBookings,
  bookSlot,
  unbookSlot,
  deleteSlot,
  copyDay,
  getAllBookings   // ✅ added
} = require('../controllers/availabilityController')

router.get('/',                getSlotsByWeek)
router.get('/all',             protect, isTutor,            getAllSlots)
router.get('/my-bookings',     protect,                     getMyBookings)
router.get('/all-bookings',    protect, adminOnly,          getAllBookings)   // ✅ added
router.post('/',               protect, isTutor,            addSlot)
router.post('/copy-day',       protect, isTutor,            copyDay)
router.post('/book',           protect, isStudentOrParent,  bookSlot)
router.put('/:id/unbook',      protect,                     unbookSlot)
router.delete('/:id',          protect, isTutor,            deleteSlot)

module.exports = router