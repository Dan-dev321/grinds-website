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

const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const totalMins = HOUR_START * 60 + i * SLOT_MINS
  const h = String(Math.floor(totalMins / 60)).padStart(2, '0')
  const m = String(totalMins % 60).padStart(2, '0')
  return `${h}:${m}`
})

const SLOT_COLOUR = { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' } // blue

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
const StudentAvailability = () => {
  const { user, token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  // ── Week state ───────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return formatDate(d)
  })
  const todayStr = formatDate(new Date())

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }

  // ── Data state ───────────────────────────────────────────────
  const [slots, setSlots]           = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading]       = useState(true)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')

  // ── Hover state ──────────────────────────────────────────────
  const [hoverDate, setHoverDate] = useState(null)
  const [hoverTime, setHoverTime] = useState(null)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   3500) }

  // ── Fetch ────────────────────────────────────────────────────
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/availability?weekStart=${formatDate(weekStart)}`
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

  // ── Slot helpers ─────────────────────────────────────────────
  const getSlotsAt = (date, time) =>
    slots.filter(s => s.date === date && time >= s.startTime && time < s.endTime)

  const spanCells = (slot) =>
    (toMins(slot.endTime) - toMins(slot.startTime)) / SLOT_MINS

  // ── Check 1hr block is all-available ──────────────────────────
  const getStudentBlock = (date, startTime) => {
    const slotMins = toMins(startTime)
    const endMins  = slotMins + 60
    for (let m = slotMins; m < endMins; m += SLOT_MINS) {
      const cellSlots = getSlotsAt(date, toTime(m))
      const match = cellSlots.find(s => s.slotType === 'available')
      if (!match) return null
    }
    return { startTime: toTime(slotMins), endTime: toTime(endMins) }
  }

  // ── Hover block ───────────────────────────────────────────────
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

  // ── Book ────────────────────────────────────────────────────────
  const bookSlot = async (date, block) => {
    try {
      // Find the available slot covering this block to get its tutorId,
      // since the backend route still requires tutorId in the body.
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

  // ── Click to book ─────────────────────────────────────────────
  const handleStudentClick = async (date, time) => {
    if (!hoverBlock || hoverDate !== date) {
      flashError('Not enough consecutive time here for a 1-hour session')
      return
    }
    await bookSlot(date, hoverBlock)
  }

  // ── Unbook ────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-2 select-none"
      onMouseLeave={() => { setHoverDate(null); setHoverTime(null) }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">📅 Availability</h1>
          <p className="text-gray-500 text-sm">
            Hover to preview your session — click to book
          </p>
        </div>

        {/* Flash messages */}
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

        {/* Not logged in CTA */}
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

        {/* Week Navigation */}
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

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-3">⏳</div>
            <p>Loading calendar...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="min-w-[700px]">

              {/* Day headers */}
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

              {/* Time rows */}
              {timeSlots.map((time, rowIdx) => (
                <div key={time} className="grid"
                  style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>

                  {/* Time label */}
                  <div className="relative flex items-start justify-end pr-1.5"
                    style={{ height: `${CELL_HEIGHT}px` }}>
                    {(time.endsWith(':00') || time.endsWith(':30')) && (
                      <span className="text-xs text-gray-400 leading-none"
                        style={{ marginTop: '-6px' }}>
                        {time}
                      </span>
                    )}
                  </div>

                  {/* Day cells */}
                  {weekDates.map((date) => {
                    const slotsHere = getSlotsAt(date, time)

                    const availableHere = slotsHere.filter(s => s.slotType === 'available')
                    const nonAvailHere = slotsHere.filter(s => s.slotType !== 'available')
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
                          const isHovered = inHoverBlock
                          const isTopRow    = s.startTime === time
                          const lastRowTime = toTime(toMins(s.endTime) - SLOT_MINS)
                          const isBottomRow = lastRowTime === time

                          return (
                            <div
                              key={s._id}
                              className="absolute top-0 bottom-0 left-0 right-0"
                              style={{
                                background: isHovered ? SLOT_COLOUR.border : SLOT_COLOUR.bg,
                                opacity: isHovered ? 0.85 : 1,
                                borderLeft:   `1.5px solid ${SLOT_COLOUR.border}`,
                                borderRight:  `1.5px solid ${SLOT_COLOUR.border}`,
                                borderTop:    isTopRow    ? `1.5px solid ${SLOT_COLOUR.border}` : 'none',
                                borderBottom: isBottomRow ? `1.5px solid ${SLOT_COLOUR.border}` : 'none',
                                zIndex: 10,
                              }}
                            />
                          )
                        })}

                        {/* Non-available (booked/buffer) — tall block, starts at startTime row only */}
                        {nonAvailStarting.map(s => {
                          const spanH   = spanCells(s)
                          const isBooked = s.slotType === 'booked'
                          return (
                            <div
                              key={s._id}
                              className="absolute left-0.5 right-0.5 z-20 rounded border overflow-hidden px-1 py-0.5"
                              style={{
                                height:      `${spanH * CELL_HEIGHT - 2}px`,
                                background:  isBooked ? '#fee2e2' : '#f3f4f6',
                                borderColor: isBooked ? '#ef4444' : '#d1d5db',
                                color:       isBooked ? '#b91c1c' : '#9ca3af',
                              }}
                            >
                              <p className="text-xs font-bold leading-tight">
                                {s.startTime}–{s.endTime}
                              </p>
                              <p className="text-xs leading-tight opacity-60">{s.slotType}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block"
              style={{ background: SLOT_COLOUR.bg, border: `1px solid ${SLOT_COLOUR.border}` }} />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
            Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />
            Buffer
          </span>
        </div>

        {/* My Bookings */}
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
                  className="bg-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
                  style={{ border: `1px solid ${SLOT_COLOUR.border}` }}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">✅</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {slot.dayOfWeek} — {formatDisplay(slot.date)}
                      </p>
                      <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUnbook(slot._id)}
                    className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition self-start sm:self-auto">
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
