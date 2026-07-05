import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_START  = 8
const HOUR_END    = 22
const SLOT_MINS   = 15
const TOTAL_SLOTS = ((HOUR_END - HOUR_START) * 60) / SLOT_MINS
const CELL_HEIGHT = 16
const DEFAULT_LESSON_MINS = 60

const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const totalMins = HOUR_START * 60 + i * SLOT_MINS
  const h = String(Math.floor(totalMins / 60)).padStart(2, '0')
  const m = String(totalMins % 60).padStart(2, '0')
  return `${h}:${m}`
})

const SLOT_COLOUR = {
  bg: '#dcfce7',
  bgHover: '#86efac',
  border: '#22c55e',
  text: '#166534'
}

const STATUS_META = {
  booked: { label: 'Slot Booked',        bg: '#fee2e2', border: '#f87171', text: '#b91c1c' },
  buffer: { label: 'Tutor Unavailable',  bg: '#f1f5f9', border: '#cbd5e1', text: '#64748b' },
}

const toMins  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toTime  = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`

const getMonday = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d
}

const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ─── BookingNote sub-component ────────────────────────────────────────────────
const BookingNote = ({ slot, token, onSaved }) => {
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState(slot.studentNote || '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await axios.put(
        `${API}/api/availability/${slot._id}/note`,
        { studentNote: text },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSaved(slot._id, text)
      setEditing(false)
    } catch (err) {
      console.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="mt-2">
        {slot.studentNote ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 flex items-start justify-between gap-2">
            <span className="italic">"{slot.studentNote}"</span>
            <button
              onClick={() => setEditing(true)}
              className="text-blue-500 hover:text-blue-700 font-semibold shrink-0"
            >
              Edit
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            📝 Leave a note
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Want to focus on quadratics, or practise for Friday's test"
        rows={2}
        maxLength={500}
        className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-blue-700 text-white px-3 py-1 rounded-full font-semibold hover:bg-blue-800 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save note'}
        </button>
        <button
          onClick={() => { setEditing(false); setText(slot.studentNote || '') }}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const StudentAvailability = () => {
  const { user, token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return formatDate(d)
  })
  const todayStr = formatDate(new Date())

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }

  const [slots, setSlots]           = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading]       = useState(true)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')

  const [hoverDate, setHoverDate] = useState(null)
  const [hoverTime, setHoverTime] = useState(null)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  // ── THE FIX: authHeader is now passed so the backend can identify
  //    the student via tryGetStudentTutorId and return only their
  //    assigned tutor's slots instead of every tutor's slots.
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/availability?weekStart=${formatDate(weekStart)}`,
        authHeader // <-- THIS was the missing line
      )
      setSlots(res.data)
    } catch (err) {
      flashError('Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const res = await axios.get(`${API}/api/availability/my-bookings`, authHeader)
      setMyBookings(res.data)
    } catch (err) {
      console.error('Failed to fetch bookings')
    }
  }

  useEffect(() => {
    fetchSlots()
    if (user) fetchMyBookings()
  }, [weekStart, user])

  const getSlotsAt = (date, time) =>
    slots.filter(s => s.date === date && time >= s.startTime && time < s.endTime)

  const spanCells = (slot) =>
    (toMins(slot.endTime) - toMins(slot.startTime)) / SLOT_MINS

  const getStudentBlock = (date, startTime) => {
    const covering = getSlotsAt(date, startTime).find(s => s.slotType === 'available')
    if (!covering) return null

    const lessonMins = Number.isFinite(covering.lessonLength) ? covering.lessonLength : DEFAULT_LESSON_MINS
    const startMins  = toMins(startTime)
    const endMins    = startMins + lessonMins

    if (endMins > toMins(covering.endTime)) return null

    return { startTime: toTime(startMins), endTime: toTime(endMins), lessonMins }
  }

  const getHoverBlock = () => {
    if (!hoverDate || !hoverTime) return null
    const available = getSlotsAt(hoverDate, hoverTime).filter(s => s.slotType === 'available')
    if (available.length === 0) return null
    return getStudentBlock(hoverDate, hoverTime)
  }

  const hoverBlock = getHoverBlock()

  const handleCellMouseEnter = (date, time) => {
    setHoverDate(date)
    setHoverTime(time)
  }

  const bookSlot = async (date, block) => {
    try {
      const matchingSlot = getSlotsAt(date, block.startTime)
        .find(s => s.slotType === 'available')
      const tutorId = matchingSlot?.tutor?._id?.toString() || matchingSlot?.tutor?.toString()

      await axios.post(`${API}/api/availability/book`,
        { date, startTime: block.startTime, tutorId },
        authHeader
      )
      flashSuccess(`Booked: ${block.startTime}–${block.endTime} 🎉`)
      fetchSlots()
      fetchMyBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to book slot')
    }
  }

  const handleStudentClick = async (date, time) => {
    if (!hoverBlock || hoverDate !== date) {
      const fallbackSlot = getSlotsAt(date, time).find(s => s.slotType === 'available')
      const lessonMins = Number.isFinite(fallbackSlot?.lessonLength) ? fallbackSlot.lessonLength : DEFAULT_LESSON_MINS
      flashError(`Not enough consecutive time here for a ${lessonMins}-minute session`)
      return
    }
    await bookSlot(date, hoverBlock)
  }

  const handleUnbook = async (slotId) => {
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Booking cancelled ✅')
      fetchSlots()
      fetchMyBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  const handleNoteSaved = (slotId, newNote) => {
    setMyBookings(prev => prev.map(s =>
      s._id === slotId ? { ...s, studentNote: newNote } : s
    ))
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-2 select-none"
      onMouseLeave={() => { setHoverDate(null); setHoverTime(null) }}
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">📅 Availability</h1>
          <p className="text-gray-500 text-sm">
            Hover to preview your session — click to book
          </p>
        </div>

        {success && (
          <div className="mb-4 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center font-medium text-sm">
            {error}
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center">
            <p className="text-blue-800 font-semibold text-lg mb-1">👋 Want to book a session?</p>
            <p className="text-blue-600 text-sm mb-4">
              Create a free account or log in to reserve your spot.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/register"
                className="bg-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition text-sm">
                Register Free
              </Link>
              <Link to="/login"
                className="border-2 border-blue-700 text-blue-700 px-6 py-2 rounded-full font-semibold hover:bg-blue-100 transition text-sm">
                Log In
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button onClick={prevWeek}
            className="text-blue-700 font-bold text-xl hover:text-blue-900 px-2">←</button>
          <div className="text-center">
            <p className="font-bold text-gray-800 text-sm">
              {formatDisplay(weekDates[0])} – {formatDisplay(weekDates[6])}
            </p>
            <p className="text-xs text-gray-400">{new Date(weekStart).getFullYear()}</p>
          </div>
          <button onClick={nextWeek}
            className="text-blue-700 font-bold text-xl hover:text-blue-900 px-2">→</button>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-3">⏳</div>
            <p>Loading calendar...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="min-w-[700px]">

              <div className="grid border-b border-gray-100"
                style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                <div className="py-2" />
                {weekDates.map((date, i) => (
                  <div key={date}
                    className={`py-2 text-center border-l border-gray-100 ${date === todayStr ? 'bg-blue-50' : ''}`}>
                    <p className={`text-xs font-bold uppercase ${date === todayStr ? 'text-blue-700' : 'text-gray-500'}`}>
                      {DAY_LABELS[i]}
                    </p>
                    <p className={`text-xs font-semibold ${date === todayStr ? 'text-blue-700' : 'text-gray-600'}`}>
                      {formatDisplay(date)}
                    </p>
                    {date === todayStr && (
                      <span className="text-xs bg-blue-700 text-white px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {timeSlots.map((time, rowIdx) => (
                <div key={time} className="grid"
                  style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>

                  <div className="relative flex items-start justify-end pr-1.5"
                    style={{ height: `${CELL_HEIGHT}px` }}>
                    {(time.endsWith(':00') || time.endsWith(':30')) && (
                      <span className="text-xs text-gray-400 leading-none"
                        style={{ marginTop: '-6px' }}>
                        {time}
                      </span>
                    )}
                  </div>

                  {weekDates.map((date) => {
                    const slotsHere = getSlotsAt(date, time)

                    const availableHere    = slotsHere.filter(s => s.slotType === 'available')
                    const nonAvailHere     = slotsHere.filter(s => s.slotType !== 'available')
                    const nonAvailStarting = nonAvailHere.filter(s => s.startTime === time)

                    const inHoverBlock =
                      hoverBlock &&
                      date === hoverDate &&
                      toMins(time) >= toMins(hoverBlock.startTime) &&
                      toMins(time) <  toMins(hoverBlock.endTime)

                    return (
                      <div
                        key={date}
                        className={`
                          relative border-l border-gray-100
                          ${rowIdx % 2 === 0 ? 'border-t border-gray-50' : ''}
                          ${date === todayStr ? 'bg-blue-50/20' : ''}
                          ${availableHere.length > 0 ? 'cursor-pointer' : ''}
                        `}
                        style={{ height: `${CELL_HEIGHT}px` }}
                        onMouseEnter={() => handleCellMouseEnter(date, time)}
                        onClick={() => handleStudentClick(date, time)}
                      >
                        {availableHere.map((s) => {
                          const isHovered   = inHoverBlock
                          const isTopRow    = s.startTime === time
                          const lastRowTime = toTime(toMins(s.endTime) - SLOT_MINS)
                          const isBottomRow = lastRowTime === time
                          const spanH       = spanCells(s)

                          return (
                            <div
                              key={s._id}
                              className="absolute top-0 bottom-0 left-0 right-0"
                              style={{
                                background:   isHovered ? SLOT_COLOUR.bgHover : SLOT_COLOUR.bg,
                                borderLeft:   `1.5px solid ${SLOT_COLOUR.border}`,
                                borderRight:  `1.5px solid ${SLOT_COLOUR.border}`,
                                borderTop:    isTopRow    ? `1.5px solid ${SLOT_COLOUR.border}` : 'none',
                                borderBottom: isBottomRow ? `1.5px solid ${SLOT_COLOUR.border}` : 'none',
                                zIndex: 10,
                                transition: 'background 120ms ease',
                              }}
                            >
                              {isTopRow && (
                                <div
                                  className="absolute top-0 left-0 right-0 px-1 leading-tight overflow-hidden"
                                  style={{ color: SLOT_COLOUR.text, height: `${spanH * CELL_HEIGHT}px` }}
                                >
                                  <p className="text-[10px] font-bold truncate">
                                    {s.startTime}–{s.endTime}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {nonAvailStarting.map(s => {
                          const spanH = spanCells(s)
                          const meta  = STATUS_META[s.slotType] || STATUS_META.buffer
                          return (
                            <div
                              key={s._id}
                              className="absolute left-0.5 right-0.5 z-20 rounded border overflow-hidden px-1 py-0.5"
                              style={{
                                height:      `${spanH * CELL_HEIGHT - 2}px`,
                                background:  meta.bg,
                                borderColor: meta.border,
                                color:       meta.text,
                              }}
                            >
                              <p className="text-xs font-bold leading-tight">
                                {s.startTime}–{s.endTime}
                              </p>
                              <p className="text-xs leading-tight opacity-70">{meta.label}</p>
                            </div>
                          )
                        })}

                        {hoverBlock && date === hoverDate && time === hoverTime && (
                          <div
                            className="absolute left-1/2 z-30 px-2 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap pointer-events-none"
                            style={{
                              top: '-2px',
                              transform: 'translate(-50%, -100%)',
                              background: SLOT_COLOUR.border,
                              color: 'white',
                            }}
                          >
                            {hoverBlock.startTime}–{hoverBlock.endTime} · {hoverBlock.lessonMins} min
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block"
              style={{ background: SLOT_COLOUR.bg, border: `1px solid ${SLOT_COLOUR.border}` }} />
            Available — click to book
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block"
              style={{ background: STATUS_META.booked.bg, border: `1px solid ${STATUS_META.booked.border}` }} />
            {STATUS_META.booked.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block"
              style={{ background: STATUS_META.buffer.bg, border: `1px solid ${STATUS_META.buffer.border}` }} />
            {STATUS_META.buffer.label}
          </span>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📌 My Bookings</h2>
          {myBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
              <div className="text-4xl mb-3">🗓️</div>
              <p className="font-medium">No bookings yet — click a slot above!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myBookings.map(slot => (
                <div key={slot._id}
                  className="bg-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-sm"
                  style={{ border: `1px solid ${SLOT_COLOUR.border}` }}>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="text-2xl">✅</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">
                        {slot.dayOfWeek} — {formatDisplay(slot.date)}
                      </p>
                      <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                      <BookingNote slot={slot} token={token} onSaved={handleNoteSaved} />
                    </div>
                  </div>
                  <button onClick={() => handleUnbook(slot._id)}
                    className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto shrink-0">
                    Cancel Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default StudentAvailability