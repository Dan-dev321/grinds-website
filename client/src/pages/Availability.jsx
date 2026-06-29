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
const MIN_CELLS   = 4
const CELL_HEIGHT = 16

const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const totalMins = HOUR_START * 60 + i * SLOT_MINS
  const h = String(Math.floor(totalMins / 60)).padStart(2, '0')
  const m = String(totalMins % 60).padStart(2, '0')
  return `${h}:${m}`
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMins  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toTime  = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const addMins = (t, n) => toTime(toMins(t) + n)

const getMonday = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d
}

const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Component ────────────────────────────────────────────────────────────────
const Availability = () => {
  const { user, token } = useAuth()

  const isTutor           = user?.role === 'tutor'
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent'
  const authHeader        = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  // ── Week state ───────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return formatDate(d)
  })
  const todayStr = formatDate(new Date())

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  // ── Data state ───────────────────────────────────────────────
  const [slots, setSlots]           = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading]       = useState(true)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')

  // ── Drag state (tutor) ──────────────────────────────────────
  const [selecting, setSelecting]     = useState(false)
  const [selectDate, setSelectDate]   = useState(null)
  const [selectStart, setSelectStart] = useState(null)
  const [selectEnd, setSelectEnd]     = useState(null)

  // ── Student hover state ──────────────────────────────────────
  const [hoverDate, setHoverDate]     = useState(null)
  const [hoverTime, setHoverTime]     = useState(null)

  // ── Copy day state ───────────────────────────────────────────
  const [copyFrom, setCopyFrom] = useState('')
  const [copyTo, setCopyTo]     = useState('')
  const [copying, setCopying]   = useState(false)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg);   setTimeout(() => setError(''), 3500) }

  // ── Fetch ────────────────────────────────────────────────────
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/availability?weekStart=${formatDate(weekStart)}`
      )
      setSlots(res.data)
    } catch {
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
    if (isStudentOrParent) fetchMyBookings()
  }, [weekStart, user])

  // ── Visibility filter ─────────────────────────────────────────
  // Each board belongs to exactly one tutor:
  // - Tutors see only their own slots
  // - Students/parents see only their assigned tutor's slots
  const boardTutorId = isTutor ? user.id : user?.tutorId
  const visibleSlots = boardTutorId
    ? slots.filter(s => {
        const sid = s.tutor?._id?.toString() || s.tutor?.toString()
        return sid === boardTutorId.toString()
      })
    : slots

  // ── Slot helpers ──────────────────────────────────────────────
  const getSlotsForDate = (date) => visibleSlots.filter(s => s.date === date)

  const getSlotsAt = (date, time) =>
    getSlotsForDate(date).filter(s => time >= s.startTime && time < s.endTime)

  const spanCells = (slot) =>
    (toMins(slot.endTime) - toMins(slot.startTime)) / SLOT_MINS

  // ── Student: check 1hr block is all-available ────────────────
  const getStudentBlock = (date, hoveredTime) => {
    if (!date || !hoveredTime) return null
    const startMins = toMins(hoveredTime)
    const endMins = startMins + 60

    // Make sure every 15-minute chunk for the next hour is available
    for (let mins = startMins; mins < endMins; mins += SLOT_MINS) {
      const available = getSlotsAt(date, toTime(mins))
        .some(s => s.slotType === 'available')

      if (!available) return null
    }

    return {
      startTime: toTime(startMins),
      endTime: toTime(endMins)
    }
  }

  // ── Hover block (single source of truth for the preview) ──────
  const getHoverBlock = () => {
    if (!hoverDate || !hoverTime || !isStudentOrParent) return null
    return getStudentBlock(hoverDate, hoverTime)
  }

  const hoverBlock = getHoverBlock()

  // ── Tutor drag ────────────────────────────────────────────────
  const handleCellMouseDown = (date, time) => {
    if (!isTutor) return
    const existingHere = getSlotsAt(date, time).length > 0
    if (existingHere) return
    setSelecting(true)
    setSelectDate(date)
    setSelectStart(time)
    setSelectEnd(addMins(time, SLOT_MINS))
  }

  const handleCellMouseEnter = (date, time) => {
    if (selecting && date === selectDate && toMins(time) >= toMins(selectStart)) {
      setSelectEnd(addMins(time, SLOT_MINS))
    }
    if (isStudentOrParent) {
      setHoverDate(date)
      setHoverTime(time)
    }
  }

  const handleMouseUp = async () => {
    if (!selecting) return
    setSelecting(false)
    const durationCells = (toMins(selectEnd) - toMins(selectStart)) / SLOT_MINS
    if (durationCells < MIN_CELLS) {
      flashError('Minimum slot length is 1 hour — drag further down')
      setSelectDate(null); setSelectStart(null); setSelectEnd(null)
      return
    }
    try {
      await axios.post(`${API}/api/availability`, {
        date: selectDate, startTime: selectStart, endTime: selectEnd
      }, authHeader)
      flashSuccess(`Slot added: ${selectStart}–${selectEnd} on ${formatDisplay(selectDate)} ✅`)
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to create slot')
    }
    setSelectDate(null); setSelectStart(null); setSelectEnd(null)
  }

  // ── Student click → book ──────────────────────────────────────
  const handleStudentClick = async (date, time) => {
    if (!isStudentOrParent) return
    if (!hoverBlock || hoverDate !== date || hoverTime !== time) {
      flashError('Not enough consecutive time here for a 1-hour session')
      return
    }
    const availableSlot = getSlotsAt(date, time)
      .find(s => s.slotType === 'available')

    if (!availableSlot) {
      flashError('That slot is no longer available')
      return
    }

    try {
      await axios.post(`${API}/api/availability/book`, {
        date,
        startTime: time,
        tutorId: availableSlot.tutor?._id?.toString() || availableSlot.tutor?.toString()
      }, authHeader)
      flashSuccess(`Booked: ${hoverBlock.startTime}–${hoverBlock.endTime} 🎉`)
      fetchSlots()
      fetchMyBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to book slot')
    }
  }

  // ── Unbook ────────────────────────────────────────────────────
  const handleUnbook = async (slotId) => {
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Booking cancelled ✅')
      fetchSlots()
      if (isStudentOrParent) fetchMyBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      await axios.delete(`${API}/api/availability/${slotId}`, authHeader)
      flashSuccess('Slot deleted')
      fetchSlots()
    } catch {
      flashError('Failed to delete slot')
    }
  }

  // ── Copy day ──────────────────────────────────────────────────
  const handleCopyDay = async () => {
    if (!copyFrom || !copyTo) return flashError('Please select both dates')
    try {
      setCopying(true)
      const res = await axios.post(
        `${API}/api/availability/copy-day`,
        { fromDate: copyFrom, toDate: copyTo },
        authHeader
      )
      flashSuccess(res.data.message)
      setCopyFrom(''); setCopyTo('')
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to copy')
    } finally {
      setCopying(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-2 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (selecting) handleMouseUp()
        setHoverDate(null); setHoverTime(null)
      }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">📅 Availability</h1>
          <p className="text-gray-500 text-sm">
            {isTutor
              ? 'Click and drag to create a slot (minimum 1 hour)'
              : 'Hover to preview your session — click to book'}
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

        {/* Tutor: Copy Day Panel */}
        {isTutor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">📋 Copy Schedule</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Copy FROM</label>
                <input type="date" value={copyFrom} onChange={e => setCopyFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Copy TO</label>
                <input type="date" value={copyTo} onChange={e => setCopyTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleCopyDay} disabled={copying}
                className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                {copying ? 'Copying...' : 'Copy Day →'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ⚠️ Unbooked slots on destination day will be replaced
            </p>
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
                    const inSel     = selecting && date === selectDate &&
                                       time >= selectStart && time < selectEnd

                    // Tutor: tall block view
                    const startingSlot = slotsHere.find(s => s.startTime === time)
                    const slotSpan = startingSlot ? spanCells(startingSlot) : 0

                    // Per-cell hover highlight — evaluated fresh for THIS row/day,
                    // independent of where the underlying slot starts.
                    const inHoverBlock =
                      isStudentOrParent &&
                      hoverBlock &&
                      date === hoverDate &&
                      toMins(time) >= toMins(hoverBlock.startTime) &&
                      toMins(time) < toMins(hoverBlock.endTime)

                    const cellSlotType = slotsHere[0]?.slotType

                    return (
                      <div
                        key={date}
                        className={`
                          relative border-l border-gray-100
                          ${rowIdx % 2 === 0 ? 'border-t border-gray-50' : ''}
                          ${date === todayStr ? 'bg-blue-50/20' : ''}
                          ${inSel ? 'bg-blue-200' : ''}
                          ${isTutor && slotsHere.length === 0 ? 'hover:bg-blue-50 cursor-crosshair' : ''}
                          ${isStudentOrParent && cellSlotType === 'available' ? 'cursor-pointer' : ''}
                        `}
                        style={{ height: `${CELL_HEIGHT}px` }}
                        onMouseDown={() => handleCellMouseDown(date, time)}
                        onMouseEnter={() => handleCellMouseEnter(date, time)}
                        onClick={() => isStudentOrParent && handleStudentClick(date, time)}
                      >
                        {startingSlot && (
                          <div
                            className={`
                              absolute left-0.5 right-0.5 z-10 rounded border overflow-hidden flex flex-col justify-between px-1 py-0.5
                              ${startingSlot.slotType === 'available'
                                ? 'bg-green-100 border-green-400 text-green-700'
                                : startingSlot.slotType === 'booked'
                                  ? 'bg-red-100 border-red-400 text-red-700'
                                  : 'bg-gray-100 border-gray-300 text-gray-400'}
                            `}
                            style={{ height: `${slotSpan * CELL_HEIGHT - 2}px` }}
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <div>
                              <p className="text-xs font-bold leading-tight">
                                {startingSlot.startTime}–{startingSlot.endTime}
                              </p>
                              {startingSlot.slotType === 'booked' && startingSlot.bookedBy && (
                                <p className="text-xs leading-tight truncate opacity-80">
                                  {isTutor
                                    ? startingSlot.bookedBy.name
                                    : 'Your booking'}
                                </p>
                              )}
                              {startingSlot.slotType === 'buffer' && (
                                <p className="text-xs leading-tight opacity-60">buffer</p>
                              )}
                              {startingSlot.slotType === 'unavailable' && (
                                <p className="text-xs leading-tight opacity-60">unavailable</p>
                              )}
                            </div>
                            {isTutor && startingSlot.slotType === 'available' && slotSpan * CELL_HEIGHT >= 40 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(startingSlot._id) }}
                                className="text-xs rounded px-1 py-0.5 self-start hover:opacity-80 transition bg-red-100 text-red-500"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}

                        {/* Hover preview overlay — drawn per-cell, only over the
                            4 segments (1hr) actually under the cursor, on top of
                            whatever slot box is underneath. */}
                        {inHoverBlock && (
                          <div className="absolute inset-0 z-20 bg-blue-300/50 ring-1 ring-blue-500 pointer-events-none" />
                        )}
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
            <span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
            Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />
            Unavailable
          </span>
          {isTutor && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-200 inline-block" />
              Selecting
            </span>
          )}
        </div>

        {/* Student: My Bookings */}
        {isStudentOrParent && (
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
                    className="bg-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm border border-gray-100">
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
        )}

        {/* Tutor: This Week's Slots list */}
        {isTutor && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 This Week's Slots</h2>
            {visibleSlots.filter(s => s.slotType === 'available' || s.slotType === 'booked').length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium">No slots this week — drag on the calendar to add some!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleSlots
                  .filter(s => s.slotType === 'available' || s.slotType === 'booked')
                  .map(slot => (
                    <div key={slot._id}
                      className={`bg-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm border ${slot.slotType === 'booked' ? 'border-red-300' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{slot.slotType === 'booked' ? '🔴' : '🟢'}</div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {slot.dayOfWeek} — {formatDisplay(slot.date)}
                          </p>
                          <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                          {slot.slotType === 'booked' && slot.bookedBy && (
                            <p className="text-xs text-orange-500 font-medium">
                              Booked by: {slot.bookedBy.name} ({slot.bookedBy.email})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {slot.slotType === 'booked' && (
                          <button onClick={() => handleUnbook(slot._id)}
                            className="bg-orange-100 text-orange-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-orange-200 transition">
                            Unbook
                          </button>
                        )}
                        {slot.slotType === 'available' && (
                          <button onClick={() => handleDelete(slot._id)}
                            className="bg-red-100 text-red-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-red-200 transition">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Availability
