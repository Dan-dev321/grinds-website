// server/controllers/studentController.js
const Student = require('../models/Student');
const Availability = require('../models/Availability');

// ─────────────────────────────────────────────
// GET /api/students/me
// Returns the logged-in student's profile + their tutor's name
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .select('-password')
      .populate('tutorId', 'name businessName email'); // pull tutor name/business

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      _id:        student._id,
      name:       student.name,
      email:      student.email,
      phone:      student.phone,
      school:     student.school,
      yearGroup:  student.yearGroup,
      subjects:   student.subjects,
      examBoard:  student.examBoard,
      goals:      student.goals,
      createdAt:  student.createdAt,
      tutor: {
        name:         student.tutorId?.name,
        businessName: student.tutorId?.businessName,
        email:        student.tutorId?.email,
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/sessions/mine
// Returns all availability slots booked by this student
// Sorted: upcoming first, then past
// ─────────────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await Availability.find({ bookedBy: req.user._id })
      .select('date duration subject status notes isBooked')
      .sort({ date: 1 }); // ascending: soonest first

    res.json(sessions);
  } catch (err) {
    console.error('getMySessions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMe, getMySessions };