const Feedback = require('../models/Feedback')

// ─── SUBMIT FEEDBACK (Student/Parent) ────────────────────────────────────────
const submitFeedback = async (req, res) => {
  const { rating, comment } = req.body
  try {
    if (!rating || !comment)
      return res.status(400).json({ message: 'Rating and comment are required' })
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })

    const feedback = await Feedback.create({
      student: req.user.id,
      rating,
      comment
    })
    res.status(201).json({ message: 'Feedback submitted! Awaiting approval ✅', feedback })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET APPROVED FEEDBACK (Public) ──────────────────────────────────────────
const getApprovedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ isApproved: true })
      .populate('student', 'name')
      .sort({ createdAt: -1 })
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET ALL FEEDBACK (Admin only) ───────────────────────────────────────────
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── APPROVE FEEDBACK (Admin only) ───────────────────────────────────────────
const approveFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' })
    if (feedback.isApproved) return res.status(400).json({ message: 'Already approved' })

    feedback.isApproved = true
    await feedback.save()
    res.json({ message: 'Feedback approved ✅', feedback })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── DELETE FEEDBACK (Admin only) ────────────────────────────────────────────
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' })
    await feedback.deleteOne()
    res.json({ message: 'Feedback deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── GET MY FEEDBACK (Student/Parent) ────────────────────────────────────────
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ student: req.user.id })
      .sort({ createdAt: -1 })
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = {
  submitFeedback,
  getApprovedFeedback,
  getAllFeedback,
  approveFeedback,
  deleteFeedback,
  getMyFeedback
}