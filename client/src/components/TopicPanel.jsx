import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

// ─── Renders a 0–5 star display for a given rating (supports .5 increments) ───
const StarDisplay = ({ rating }) => {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fillPercent =
      rating >= i ? 100 :
      rating >= i - 0.5 ? 50 :
      0
    stars.push(
      <span key={i} className="relative inline-block w-4 h-4 text-gray-300">
        <span className="absolute inset-0 leading-none text-base">★</span>
        <span
          className="absolute inset-0 leading-none text-base text-amber-400 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          ★
        </span>
      </span>
    )
  }
  return <div className="flex gap-0.5">{stars}</div>
}

// ─── Single table-style row: name | 0 —slider— 5 | stars | number ────────────
// Click-to-rate scale: 0 on the left, 5 on the right, snaps to 0.5 steps
const TopicRow = ({ topic, rating, onChange, onRemove }) => {
  const trackRef = useRef(null)

  const handleClick = (e) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    const raw = ratio * 5
    const snapped = Math.round(raw * 2) / 2
    onChange(snapped)
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-b-0">
      <span
        className="text-xs font-semibold text-gray-700 w-20 shrink-0 truncate"
        title={topic.name}
      >
        {topic.name}
      </span>

      <span className="text-[10px] font-semibold text-gray-400 shrink-0">0</span>
      <div
        ref={trackRef}
        onClick={handleClick}
        className="relative flex-1 h-4 bg-gray-100 rounded-full cursor-pointer border border-gray-200 min-w-[60px]"
        title="Click where you'd rate this student on this topic"
      >
        <div
          className="absolute top-0 left-0 h-full bg-amber-300 rounded-full transition-all"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-amber-500 rounded-full shadow transition-all"
          style={{ left: `${(rating / 5) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-gray-400 shrink-0">5</span>

      <div className="shrink-0">
        <StarDisplay rating={rating} />
      </div>
      <span className="text-xs font-bold text-amber-600 w-7 text-right shrink-0">
        {rating.toFixed(1)}
      </span>

      <button
        onClick={onRemove}
        className="text-xs text-gray-300 hover:text-red-400 transition shrink-0 ml-1"
        title="Remove topic"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Topic search + select, with inline "create new" if no match found ───────
const TopicSearch = ({ token, onSelect, excludeIds }) => {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/api/topics?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setResults(res.data.filter(t => !excludeIds.includes(t._id)))
      } catch {
        setResults([])
      }
    }, 250) // debounce
    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = (topic) => {
    onSelect(topic)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleCreate = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    try {
      setCreating(true)
      const res = await axios.post(`${API}/api/topics`, { name: trimmed }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      handleSelect(res.data)
    } catch (err) {
      console.error('Failed to create topic')
    } finally {
      setCreating(false)
    }
  }

  const exactMatch = results.some(r => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search or add a topic…"
        className="text-sm px-3 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
      {open && query.trim() && (
        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {results.map(topic => (
            <button
              key={topic._id}
              onClick={() => handleSelect(topic)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition"
            >
              {topic.name}
            </button>
          ))}
          {!exactMatch && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 transition border-t border-gray-100"
            >
              {creating ? 'Adding…' : `+ Add "${query.trim()}" as new topic`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main panel: list of topics covered + ratings for this entry ─────────────
const TopicPanel = ({ studentId, entryId, token, topicsCovered, onChange }) => {
  const [saving, setSaving] = useState(false)

  // topicsCovered: [{ topic: { _id, name }, rating }]
  const persist = async (updated) => {
    try {
      setSaving(true)
      // Defensive filter: drop any entry missing a valid topic._id, so a
      // single corrupted/legacy item can't fail the whole save with a
      // Mongoose validation error (Path `topic` is required).
      const payload = updated
        .filter(t => t.topic && t.topic._id)
        .map(t => ({ topic: t.topic._id, rating: t.rating }))

      const res = await axios.put(
        `${API}/api/topics/student/${studentId}/entry/${entryId}`,
        { topicsCovered: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onChange(res.data.entry.topicsCovered)
    } catch (err) {
      console.error('Failed to save topic ratings:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTopic = (topic) => {
    const updated = [...topicsCovered, { topic, rating: 2.5 }]
    persist(updated)
  }

  const handleRatingChange = (topicId, rating) => {
    const updated = topicsCovered.map(t =>
      t.topic._id === topicId ? { ...t, rating } : t
    )
    persist(updated)
  }

  const handleRemoveTopic = (topicId) => {
    const updated = topicsCovered.filter(t => t.topic._id !== topicId)
    persist(updated)
  }

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">📚 Topics Covered</h3>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
      </div>

      <div className="mb-3">
        <TopicSearch
          token={token}
          onSelect={handleAddTopic}
          excludeIds={topicsCovered.map(t => t.topic._id)}
        />
      </div>

      {topicsCovered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 italic text-center py-4">
            No topics added for this session yet
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {topicsCovered.map(({ topic, rating }) => (
            <TopicRow
              key={topic._id}
              topic={topic}
              rating={rating}
              onChange={(newRating) => handleRatingChange(topic._id, newRating)}
              onRemove={() => handleRemoveTopic(topic._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TopicPanel