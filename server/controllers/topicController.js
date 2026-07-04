const Topic = require('../models/Topic')
const Note = require('../models/Note')

// ─── Search/list this tutor's topic library ───────────────────────────────────
// ?search=alg filters by name (case-insensitive partial match)
const getTopics = async (req, res) => {
  try {
    const { search } = req.query
    const query = { tutor: req.user.id }
    if (search) query.name = { $regex: search, $options: 'i' }

    const topics = await Topic.find(query).sort({ name: 1 })
    res.json(topics)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Create a new topic in the tutor's library ────────────────────────────────
const createTopic = async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Topic name is required' })

    const trimmedName = name.trim()

    const existing = await Topic.findOne({ tutor: req.user.id, name: trimmedName })
    if (existing) return res.status(200).json(existing) // idempotent — return existing rather than erroring

    const topic = await Topic.create({ tutor: req.user.id, name: trimmedName })
    res.status(201).json(topic)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Set the full topicsCovered list for a specific entry ─────────────────────
// Body: { topicsCovered: [{ topic: <topicId>, rating: <0-5, 0.5 increments> }] }
// Replaces the whole array each time — simplest to reason about from the
// frontend (send the full current state of topics+ratings for this entry).
const updateEntryTopics = async (req, res) => {
  try {
    const { studentId, entryId } = req.params
    const { topicsCovered } = req.body

    if (!Array.isArray(topicsCovered))
      return res.status(400).json({ message: 'topicsCovered must be an array' })

    // Validate each rating is within range and a multiple of 0.5
    for (const t of topicsCovered) {
      if (typeof t.rating !== 'number' || t.rating < 0 || t.rating > 5 || (t.rating * 2) % 1 !== 0) {
        return res.status(400).json({ message: 'Each rating must be 0-5 in 0.5 increments' })
      }
    }

    const note = await Note.findOne({ tutor: req.user.id, student: studentId })
    if (!note) return res.status(404).json({ message: 'Notebook not found' })

    const entry = note.entries.id(entryId)
    if (!entry) return res.status(404).json({ message: 'Entry not found' })

    entry.topicsCovered = topicsCovered
    await note.save()

    // Return the entry populated with topic names, so the frontend doesn't
    // need a separate round-trip to display them.
    await note.populate('entries.topicsCovered.topic', 'name')
    const populatedEntry = note.entries.id(entryId)

    res.json({ message: 'Topics updated ✅', entry: populatedEntry })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = {
  getTopics,
  createTopic,
  updateEntryTopics,
}