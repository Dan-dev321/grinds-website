import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

// ─── Defaults (overridden by Settings, persisted to localStorage) ────────────
const DEFAULT_HOUR_START   = 8
const DEFAULT_HOUR_END     = 22
const DEFAULT_LESSON_MINS  = 60
const DEFAULT_BUFFER_MINS  = 0
const SLOT_MINS    = 15
const CELL_HEIGHT  = 16

const SETTINGS_KEY = 'tutorAvailabilitySettings'

const LESSON_PRESETS = [30, 45, 60, 90]

const SLOT_COLOUR = { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' } // blue

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMins  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toTime  = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`
const addMins = (t, n) => toTime(toMins(t) + n)

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

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) throw new Error('none')
    const parsed = JSON.parse(raw)
    return {
      hourStart:   parsed.hourStart   ?? DEFAULT_HOUR_START,
      hourEnd:     parsed.hourEnd     ?? DEFAULT_HOUR_END,
      lessonMins:  parsed.lessonMins  ?? DEFAULT_LESSON_MINS,
      bufferMins:  parsed.bufferMins  ?? DEFAULT_BUFFER_MINS,
    }
  } catch {
    return {
      hourStart:  DEFAULT_HOUR_START,
      hourEnd:    DEFAULT_HOUR_END,
      lessonMins: DEFAULT_LESSON_MINS,
      bufferMins: DEFAULT_BUFFER_MINS,
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const TutorAvailability = () => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  // ── Settings state (persisted) ─────────────────────────────────
  const [settings, setSettings] = useState(loadSettings)
  const { hourStart, hourEnd, lessonMins, bufferMins } = settings

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }))

  // ── Derived time grid (depends on working hours) ────────────────
  const totalSlots = Math.max(0, ((hourEnd - hourStart) * 60) / SLOT_MINS)
  const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
    const totalMinsFromStart = hourStart * 60 + i * SLOT_MINS
    return toTime(totalMinsFromStart)
  })
  const MIN_CELLS = Math.max(1, lessonMins / SLOT_MINS)

  // ── Sidebar open state ───────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false)

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
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  // ── Drag state ───────────────────────────────────────────────
  const [selecting, setSelecting]     = useState(false)
  const [selectDate, setSelectDate]   = useState(null)
  const [selectStart, setSelectStart] = useState(null)
  const [selectEnd, setSelectEnd]     = useState(null)

  // ── Copy day state (in Settings sidebar) ──────────────────────
  const [copyFrom, setCopyFrom] = useState('')
  const [copyTo, setCopyTo]     = useState('')
  const [copying, setCopying]   = useState(false)

  // ── Recurring weekly template state ───────────────────────────
  const [recurUntil, setRecurUntil] = useState('')
  const [recurring, setRecurring]   = useState(false)

  // ── Bulk clear day state ──────────────────────────────────────
  const [clearDate, setClearDate] = useState('')
  const [clearing, setClearing]   = useState(false)

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

  useEffect(() => {
    fetchSlots()
  }, [weekStart])

  // ── Slot helpers ─────────────────────────────────────────────
  const getSlotsAt = (date, time) =>
    slots.filter(s => s.date === date && time >= s.startTime && time < s.endTime)

  const spanCells = (slot) =>
    (toMins(slot.endTime) - toMins(slot.startTime)) / SLOT_MINS

  // ── Drag ──────────────────────────────────────────────────────
  const handleCellMouseDown = (date, time) => {
    const existing = getSlotsAt(date, time)
    if (existing.length > 0) return
    setSelecting(true)
    setSelectDate(date)
    setSelectStart(time)
    setSelectEnd(addMins(time, SLOT_MINS))
  }

  const handleCellMouseEnter = (date, time) => {
    if (selecting && date === selectDate && toMins(time) >= toMins(selectStart)) {
      setSelectEnd(addMins(time, SLOT_MINS))
    }
  }

  const handleMouseUp = async () => {
    if (!selecting) return
    setSelecting(false)
    const durationCells = (toMins(selectEnd) - toMins(selectStart)) / SLOT_MINS
    if (durationCells < MIN_CELLS) {
      flashError(`Minimum slot length is ${lessonMins} minutes — drag further down`)
      setSelectDate(null); setSelectStart(null); setSelectEnd(null)
      return
    }
    try {
      // NOTE: backend needs to read lessonMins/bufferMins to auto-insert a
      // buffer slot after this one (if bufferMins > 0). TODO server-side.
      await axios.post(`${API}/api/availability`, {
        date: selectDate,
        startTime: selectStart,
        endTime: selectEnd,
        lessonLength: lessonMins,
        bufferMinutes: bufferMins,
      }, authHeader)
      flashSuccess(`Slot added: ${selectStart}–${selectEnd} on ${formatDisplay(selectDate)} ✅`)
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to create slot')
    }
    setSelectDate(null); setSelectStart(null); setSelectEnd(null)
  }

  // ── Unbook ────────────────────────────────────────────────────
  const handleUnbook = async (slotId) => {
    try {
      await axios.put(`${API}/api/availability/${slotId}/unbook`, {}, authHeader)
      flashSuccess('Booking cancelled ✅')
      fetchSlots()
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
    } catch (err) {
      flashError('Failed to delete slot')
    }
  }

  // ── Copy day ──────────────────────────────────────────────────
  const handleCopyDay = async () => {
    if (!copyFrom || !copyTo) return flashError('Please select both dates')
    try {
      setCopying(true)
      // TODO backend: POST /api/availability/copy-day { fromDate, toDate }
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

  // ── Recurring weekly template ──────────────────────────────────
  const handleRecurringTemplate = async () => {
    if (!recurUntil) return flashError('Please select an end date')
    try {
      setRecurring(true)
      // TODO backend: POST /api/availability/recurring
      // body: { weekStart: formatDate(weekStart), untilDate: recurUntil }
      // Should repeat THIS week's available slots every week up to & including untilDate.
      const res = await axios.post(
        `${API}/api/availability/recurring`,
        { weekStart: formatDate(weekStart), untilDate: recurUntil },
        authHeader
      )
      flashSuccess(res.data?.message || 'Recurring schedule created ✅')
      setRecurUntil('')
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to create recurring schedule')
    } finally {
      setRecurring(false)
    }
  }

  // ── Bulk clear a day ────────────────────────────────────────────
  const handleBulkClearDay = async () => {
    if (!clearDate) return flashError('Please select a date to clear')
    if (!window.confirm(`Clear all unbooked slots on ${formatDisplay(clearDate)}?`)) return
    try {
      setClearing(true)
      // TODO backend: DELETE /api/availability/clear-day?date=YYYY-MM-DD
      // Should delete all slots on that date with slotType !== 'booked'.
      const res = await axios.delete(
        `${API}/api/availability/clear-day`,
        { ...authHeader, params: { date: clearDate } }
      )
      flashSuccess(res.data?.message || 'Day cleared ✅')
      setClearDate('')
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to clear day')
    } finally {
      setClearing(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-2 select-none"
      onMouseUp={handleMouseUp}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">📅 Availability</h1>
            <p className="text-gray-500 text-sm">
              Click and drag to create a slot (minimum {lessonMins} minutes)
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="absolute right-0 top-2 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            ⚙️ Settings
          </button>
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
        ) : totalSlots === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-3">⚠️</div>
            <p>Working hours are invalid — check Settings (end time must be after start time)</p>
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

                    // Single tall block anchored at startTime
                    const startingSlot = slotsHere.find(s => s.startTime === time)
                    const slotSpan = startingSlot ? spanCells(startingSlot) : 0

                    return (
                      <div
                        key={date}
                        className={`
                          relative border-l border-gray-100
                          ${rowIdx % 2 === 0 ? 'border-t border-gray-50' : ''}
                          ${date === todayStr ? 'bg-blue-50/20' : ''}
                          ${inSel ? 'bg-blue-200' : ''}
                          ${slotsHere.length === 0 ? 'hover:bg-blue-50 cursor-crosshair' : ''}
                        `}
                        style={{ height: `${CELL_HEIGHT}px` }}
                        onMouseDown={() => handleCellMouseDown(date, time)}
                        onMouseEnter={() => handleCellMouseEnter(date, time)}
                      >
                        {startingSlot && (
                          <div
                            className="absolute left-0.5 right-0.5 z-10 rounded border overflow-hidden flex flex-col justify-between px-1 py-0.5"
                            style={{
                              height: `${slotSpan * CELL_HEIGHT - 2}px`,
                              background:  startingSlot.slotType === 'available'
                                ? SLOT_COLOUR.bg
                                : startingSlot.slotType === 'booked' ? '#fee2e2' : '#f3f4f6',
                              borderColor: startingSlot.slotType === 'available'
                                ? SLOT_COLOUR.border
                                : startingSlot.slotType === 'booked' ? '#ef4444' : '#d1d5db',
                              color: startingSlot.slotType === 'available'
                                ? SLOT_COLOUR.text
                                : startingSlot.slotType === 'booked' ? '#b91c1c' : '#9ca3af',
                            }}
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <div>
                              <p className="text-xs font-bold leading-tight">
                                {startingSlot.startTime}–{startingSlot.endTime}
                              </p>
                              {startingSlot.slotType === 'booked' && startingSlot.bookedBy && (
                                <p className="text-xs leading-tight truncate opacity-80">
                                  {startingSlot.bookedBy.name}
                                </p>
                              )}
                              {startingSlot.slotType === 'buffer' && (
                                <p className="text-xs leading-tight opacity-60">buffer</p>
                              )}
                              {startingSlot.slotType === 'unavailable' && (
                                <p className="text-xs leading-tight opacity-60">unavailable</p>
                              )}
                            </div>
                            {startingSlot.slotType === 'available' && slotSpan * CELL_HEIGHT >= 40 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(startingSlot._id) }}
                                className="text-xs rounded px-1 py-0.5 self-start hover:opacity-80"
                                style={{ background: '#fee2e2', color: '#ef4444' }}
                              >
                                Delete
                              </button>
                            )}
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
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-200 inline-block" />
            Selecting
          </span>
        </div>

        {/* This week's slots list */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 This Week's Slots</h2>
          {slots.filter(s => s.slotType === 'available' || s.slotType === 'booked').length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium">No slots this week — drag on the calendar to add some!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {slots
                .filter(s => s.slotType === 'available' || s.slotType === 'booked')
                .map(slot => (
                  <div key={slot._id}
                    className="bg-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
                    style={{
                      border: `1px solid ${slot.slotType === 'booked' ? '#ef4444' : SLOT_COLOUR.border}`
                    }}>
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

      </div>

      {/* ── Settings Sidebar ─────────────────────────────────────── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onMouseUp={(e) => e.stopPropagation()}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSettingsOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">⚙️ Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-8">

              {/* Working Hours */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">🕒 Working Hours</h3>
                <p className="text-xs text-gray-400 mb-3">Calendar will only show this time range.</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                    <select
                      value={hourStart}
                      onChange={(e) => updateSetting('hourStart', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                    <select
                      value={hourEnd}
                      onChange={(e) => updateSetting('hourEnd', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 25 }, (_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
                {hourEnd <= hourStart && (
                  <p className="text-xs text-red-500 mt-1.5">End time must be after start time.</p>
                )}
              </section>

              {/* Lesson Length */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">⏱️ Lesson Length</h3>
                <p className="text-xs text-gray-400 mb-3">Minimum length when dragging to create a slot.</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {LESSON_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => updateSetting('lessonMins', p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        lessonMins === p
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p} min
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSetting('lessonMins', Math.max(SLOT_MINS, lessonMins - SLOT_MINS))}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                  >−</button>
                  <span className="text-sm font-semibold text-gray-800 w-16 text-center">{lessonMins} min</span>
                  <button
                    onClick={() => updateSetting('lessonMins', lessonMins + SLOT_MINS)}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                  >+</button>
                </div>
              </section>

              {/* Buffer Time */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">🧯 Buffer Between Lessons</h3>
                <p className="text-xs text-gray-400 mb-3">Gap automatically added after each booked slot.</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSetting('bufferMins', Math.max(0, bufferMins - SLOT_MINS))}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                  >−</button>
                  <span className="text-sm font-semibold text-gray-800 w-16 text-center">{bufferMins} min</span>
                  <button
                    onClick={() => updateSetting('bufferMins', bufferMins + SLOT_MINS)}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                  >+</button>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Copy Schedule (day to day) */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">📋 Copy Day</h3>
                <p className="text-xs text-gray-400 mb-3">Copy one day's slots onto another day.</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Copy FROM</label>
                    <input type="date" value={copyFrom} onChange={e => setCopyFrom(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Copy TO</label>
                    <input type="date" value={copyTo} onChange={e => setCopyTo(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button onClick={handleCopyDay} disabled={copying}
                    className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                    {copying ? 'Copying...' : 'Copy Day →'}
                  </button>
                  <p className="text-xs text-gray-400">⚠️ Unbooked slots on destination day will be replaced</p>
                </div>
              </section>

              {/* Recurring Weekly Template */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">🔁 Repeat This Week</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Repeat the slots from the week currently shown ({formatDisplay(weekDates[0])} – {formatDisplay(weekDates[6])}) every week, until:
                </p>
                <div className="flex flex-col gap-3">
                  <input type="date" value={recurUntil} onChange={e => setRecurUntil(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleRecurringTemplate} disabled={recurring}
                    className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                    {recurring ? 'Setting up...' : 'Repeat Weekly →'}
                  </button>
                </div>
              </section>

              {/* Bulk Clear Day */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-2">🧹 Clear a Day</h3>
                <p className="text-xs text-gray-400 mb-3">Removes all unbooked slots on the chosen day. Booked slots are kept.</p>
                <div className="flex flex-col gap-3">
                  <input type="date" value={clearDate} onChange={e => setClearDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleBulkClearDay} disabled={clearing}
                    className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-200 transition disabled:opacity-50">
                    {clearing ? 'Clearing...' : 'Clear Day'}
                  </button>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TutorAvailability
