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

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return formatDate(d)
  })

  const todayStr = formatDate(new Date())

  const [slots, setSlots]           = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading]       = useState(true)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')
  const [copying, setCopying]       = useState(false)

  // tutor drag
  const [selecting, setSelecting]   = useState(false)
  const [selectDate, setSelectDate] = useState(null)
  const [selectStart, setSelectStart] = useState(null)
  const [selectEnd, setSelectEnd]   = useState(null)

  // student hover (GRID BASED)
  const [hoverDate, setHoverDate]   = useState(null)
  const [hoverTime, setHoverTime]   = useState(null)

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const flashError   = (msg) => { setError(msg); setTimeout(() => setError(''), 3500) }

  // ─── GRID-BASED HOVER PREVIEW (NEW SYSTEM) ────────────────────────────────
  const getHoverPreview = (date, time) => {
    if (!isStudentOrParent) return null

    const startMins = toMins(time)
    const endMins = startMins + (SLOT_MINS * MIN_CELLS)

    for (let mins = startMins; mins < endMins; mins += SLOT_MINS) {
      const slotTime = toTime(mins)

      const available = getSlotsAt(date, slotTime)
        .some(s => s.slotType === 'available')

      if (!available) return null
    }

    return {
      startTime: time,
      endTime: toTime(endMins)
    }
  }

  const hoverPreview = getHoverPreview(hoverDate, hoverTime)

  // ─── DATA ────────────────────────────────────────────────────────────────
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/availability?weekStart=${formatDate(weekStart)}`)
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
    } catch {}
  }

  useEffect(() => {
    fetchSlots()
    if (isStudentOrParent) fetchMyBookings()
  }, [weekStart, user])

  // ─── FILTER ────────────────────────────────────────────────────────────────
  const boardTutorId = isTutor ? user.id : user?.tutorId

  const visibleSlots = boardTutorId
    ? slots.filter(s => {
        const sid = s.tutor?._id?.toString() || s.tutor?.toString()
        return sid === boardTutorId.toString()
      })
    : slots

  const getSlotsForDate = (date) =>
    visibleSlots.filter(s => s.date === date)

  const getSlotsAt = (date, time) =>
    getSlotsForDate(date).filter(s => time >= s.startTime && time < s.endTime)

  const spanCells = (slot) =>
    (toMins(slot.endTime) - toMins(slot.startTime)) / SLOT_MINS

  // ─── STUDENT CLICK (UPDATED) ───────────────────────────────────────────────
  const handleStudentClick = async (date, time) => {
    if (!isStudentOrParent) return

    const preview = getHoverPreview(date, time)

    if (!preview) {
      flashError('Need 1 continuous hour available')
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

      flashSuccess(`Booked: ${preview.startTime}–${preview.endTime} 🎉`)
      fetchSlots()
      fetchMyBookings()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to book slot')
    }
  }

  // ─── HOVER HANDLER ─────────────────────────────────────────────────────────
  const handleCellMouseEnter = (date, time) => {
    if (isStudentOrParent) {
      setHoverDate(date)
      setHoverTime(time)
    }
  }

  const handleCellMouseDown = (date, time) => {
    if (!isTutor) return
    const existingHere = getSlotsAt(date, time).length > 0
    if (existingHere) return
    setSelecting(true)
    setSelectDate(date)
    setSelectStart(time)
    setSelectEnd(addMins(time, SLOT_MINS))
  }

  const handleMouseUp = async () => {
    if (!selecting) return
    setSelecting(false)

    try {
      await axios.post(`${API}/api/availability`, {
        date: selectDate,
        startTime: selectStart,
        endTime: selectEnd
      }, authHeader)

      flashSuccess('Slot added')
      fetchSlots()
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed')
    }

    setSelectDate(null)
    setSelectStart(null)
    setSelectEnd(null)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (selecting) handleMouseUp()
        setHoverDate(null)
        setHoverTime(null)
      }}
    >
      <div className="max-w-7xl mx-auto">

        {/* GRID */}
        <div className="bg-white rounded-2xl overflow-x-auto">
          <div className="min-w-[700px]">

            {/* headers */}
            <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              <div />
              {weekDates.map(date => (
                <div key={date} className="text-center border-l text-xs py-2">
                  {formatDisplay(date)}
                </div>
              ))}
            </div>

            {/* rows */}
            {timeSlots.map((time, rowIdx) => (
              <div key={time} className="grid"
                style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>

                <div className="text-xs text-gray-400 pr-1 text-right">
                  {(time.endsWith(':00') || time.endsWith(':30')) ? time : ''}
                </div>

                {weekDates.map(date => {
                  const slotsHere = getSlotsAt(date, time)

                  const inHover =
                    hoverPreview &&
                    date === hoverDate &&
                    toMins(time) >= toMins(hoverPreview.startTime) &&
                    toMins(time) < toMins(hoverPreview.endTime)

                  const startingSlot = slotsHere.find(s => s.startTime === time)
                  const slotSpan = startingSlot ? spanCells(startingSlot) : 0

                  return (
                    <div
                      key={date}
                      className={`border-l h-[16px]
                        ${isTutor && slotsHere.length === 0 ? 'hover:bg-blue-50 cursor-crosshair' : ''}
                        ${inHover ? 'bg-blue-200' : ''}
                      `}
                      onMouseEnter={() => handleCellMouseEnter(date, time)}
                      onMouseDown={() => handleCellMouseDown(date, time)}
                      onClick={() => handleStudentClick(date, time)}
                    >
                      {startingSlot && (
                        <div
                          className={`absolute px-1 text-xs rounded
                            ${startingSlot.slotType === 'available'
                              ? 'bg-green-100'
                              : 'bg-red-100'}
                          `}
                          style={{ height: slotSpan * CELL_HEIGHT }}
                        >
                          {startingSlot.startTime}–{startingSlot.endTime}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  )
}

export default Availability