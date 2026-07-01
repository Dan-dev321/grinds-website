import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const PROGRESS_STAGES = [
  { value: 'just-started',        label: 'Just Started',         colour: 'bg-gray-100 text-gray-600' },
  { value: 'building-foundations',label: 'Building Foundations', colour: 'bg-blue-100 text-blue-700' },
  { value: 'making-progress',     label: 'Making Progress',      colour: 'bg-yellow-100 text-yellow-700' },
  { value: 'on-track',            label: 'On Track',             colour: 'bg-green-100 text-green-700' },
  { value: 'exam-ready',          label: 'Exam Ready',           colour: 'bg-purple-100 text-purple-700' },
  { value: 'completed',           label: 'Completed',            colour: 'bg-emerald-100 text-emerald-700' },
]

const SUBJECT_COLOURS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
]

const subjectColour = (subject) => {
  let hash = 0
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash)
  return SUBJECT_COLOURS[Math.abs(hash) % SUBJECT_COLOURS.length]
}

const getStageColour = (value) =>
  PROGRESS_STAGES.find(s => s.value === value)?.colour ?? 'bg-gray-100 text-gray-600'

const getStageLabel = (value) =>
  PROGRESS_STAGES.find(s => s.value === value)?.label ?? 'Just Started'

const statCard = (icon, label, value, colour) => (
  <div key={label} className={`rounded-xl px-4 py-3 flex flex-col gap-0.5 ${colour}`}>
    <span className="text-lg">{icon}</span>
    <span className="text-xl font-extrabold leading-tight">{value}</span>
    <span className="text-xs font-medium opacity-70">{label}</span>
  </div>
)

// ─── Student Progress Modal ────────────────────────────────────────────────────
const StudentModal = ({ student, onClose, onProgressUpdate }) => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const [stage, setStage]       = useState(student.progressStage || 'just-started')
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [flash, setFlash]       = useState('')

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${API}/api/students/${student._id}/sessions`, authHeader)
        setSessions(res.data)
      } catch {
        setSessions([])
      } finally {
        setLoadingSessions(false)
      }
    }
    fetchSessions()
  }, [student._id])

  const handleSaveStage = async () => {
    try {
      setSaving(true)
      await axios.patch(`${API}/api/students/${student._id}/progress`, { progressStage: stage }, authHeader)
      onProgressUpdate(student._id, stage)
      setFlash('Progress saved ✅')
      setTimeout(() => setFlash(''), 2500)
    } catch {
      setFlash('Failed to save — try again')
      setTimeout(() => setFlash(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  const upcoming  = sessions.filter(s => s.status === 'upcoming')
  const completed = sessions.filter(s => s.status === 'completed')
  const noShows   = sessions.filter(s => s.status === 'no-show')

  const stageIndex = PROGRESS_STAGES.findIndex(s => s.value === stage)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 leading-tight">{student.name}</h2>
            <p className="text-sm text-gray-400">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1 mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-7 p-6 flex-1">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {statCard('📅', 'Upcoming',  upcoming.length,  'bg-blue-50')}
            {statCard('✅', 'Completed', completed.length, 'bg-green-50')}
            {statCard('🚫', 'No Shows',  noShows.length,   'bg-red-50')}
          </div>

          {/* Progress stage */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3">📈 Progress Stage</h3>

            {/* Visual stepper */}
            <div className="flex items-center gap-1 mb-4">
              {PROGRESS_STAGES.map((s, i) => (
                <div key={s.value} className="flex-1 flex flex-col items-center gap-1">
                  <button
                    onClick={() => setStage(s.value)}
                    className={`w-full h-2 rounded-full transition-all ${
                      i <= stageIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    title={s.label}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {PROGRESS_STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStage(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    stage === s.value
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {flash && (
              <p className={`text-xs mt-2 font-medium ${flash.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {flash}
              </p>
            )}

            <button
              onClick={handleSaveStage}
              disabled={saving}
              className="mt-3 bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Stage'}
            </button>
          </section>

          {/* Student info */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3">📋 Profile</h3>
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
              {student.school    && <Row label="School"    value={student.school} />}
              {student.yearGroup && <Row label="Year"      value={student.yearGroup} />}
              {student.examBoard && <Row label="Exam Board" value={student.examBoard} />}
              {student.phone     && <Row label="Phone"     value={student.phone} />}
              {student.parentName  && <Row label="Parent"  value={student.parentName} />}
              {student.parentEmail && <Row label="Parent Email" value={student.parentEmail} />}
              {student.parentPhone && <Row label="Parent Phone" value={student.parentPhone} />}
              {student.goals && (
                <div className="pt-1 border-t border-gray-200 mt-1">
                  <p className="text-xs text-gray-400 mb-0.5">Goals</p>
                  <p className="text-gray-700 text-xs leading-relaxed">{student.goals}</p>
                </div>
              )}
            </div>
          </section>

          {/* Session history */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3">🗓️ Session History</h3>
            {loadingSessions ? (
              <p className="text-sm text-gray-400">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm">No sessions yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.map(s => (
                  <div
                    key={s._id}
                    className={`rounded-xl px-4 py-3 border text-sm flex items-center justify-between ${
                      s.status === 'completed' ? 'bg-green-50 border-green-200' :
                      s.status === 'no-show'   ? 'bg-red-50 border-red-200' :
                                                 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {s.date} · {s.startTime}–{s.endTime}
                      </p>
                      {s.subject && <p className="text-xs text-gray-500">{s.subject}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      s.status === 'completed' ? 'bg-green-200 text-green-800' :
                      s.status === 'no-show'   ? 'bg-red-200 text-red-800' :
                                                 'bg-blue-200 text-blue-800'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-24 shrink-0">{label}</span>
    <span className="text-gray-700 font-medium">{value}</span>
  </div>
)

// ─── Main Students Page ────────────────────────────────────────────────────────
const Students = () => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const [students, setStudents]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [search, setSearch]               = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterStage, setFilterStage]     = useState('all')
  const [selected, setSelected]           = useState(null) // open modal

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/students`, authHeader)
      setStudents(res.data)
    } catch (err) {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleProgressUpdate = (studentId, newStage) => {
    setStudents(prev =>
      prev.map(s => s._id === studentId ? { ...s, progressStage: newStage } : s)
    )
  }

  const handleStageDropdown = async (studentId, newStage, e) => {
    e.stopPropagation()
    try {
      await axios.patch(`${API}/api/students/${studentId}/progress`, { progressStage: newStage }, authHeader)
      handleProgressUpdate(studentId, newStage)
    } catch {
      // silent — the modal has its own save feedback
    }
  }

  // All unique subjects across all students
  const allSubjects = [...new Set(students.flatMap(s => s.subjects || []))].sort()

  const filtered = students.filter(s => {
    const matchSearch  = s.name.toLowerCase().includes(search.toLowerCase()) ||
                         s.email.toLowerCase().includes(search.toLowerCase())
    const matchSubject = filterSubject === 'all' || (s.subjects || []).includes(filterSubject)
    const matchStage   = filterStage === 'all' || (s.progressStage || 'just-started') === filterStage
    return matchSearch && matchSubject && matchStage
  })

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">👨‍🎓 Students</h1>
          <p className="text-gray-500 text-sm">
            {students.length} student{students.length !== 1 ? 's' : ''} · click any card for full details
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All subjects</option>
            {allSubjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All stages</option>
            {PROGRESS_STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-3">⏳</div>
            <p>Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
            <div className="text-5xl mb-3">{students.length === 0 ? '🎒' : '🔍'}</div>
            <p className="font-medium text-gray-500">
              {students.length === 0 ? 'No students yet' : 'No students match your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(student => {
              const stage        = student.progressStage || 'just-started'
              const stageColour  = getStageColour(stage)
              const stageLabel   = getStageLabel(stage)
              const booked       = student.sessionStats?.booked    ?? 0
              const completed    = student.sessionStats?.completed ?? 0
              const noShow       = student.sessionStats?.noShow    ?? 0

              return (
                <div
                  key={student._id}
                  onClick={() => setSelected(student)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-800 text-base truncate group-hover:text-blue-700 transition">
                        {student.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                    <span className={`ml-2 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${stageColour}`}>
                      {stageLabel}
                    </span>
                  </div>

                  {/* Subjects */}
                  {(student.subjects?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {student.subjects.map(sub => (
                        <span
                          key={sub}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subjectColour(sub)}`}
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Lesson stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-blue-700">{booked}</p>
                      <p className="text-xs text-blue-500 leading-tight">Booked</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-green-700">{completed}</p>
                      <p className="text-xs text-green-500 leading-tight">Done</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-red-500">{noShow}</p>
                      <p className="text-xs text-red-400 leading-tight">No Show</p>
                    </div>
                  </div>

                  {/* Progress dropdown (inline, no modal needed for quick changes) */}
                  <div onClick={e => e.stopPropagation()}>
                    <select
                      value={stage}
                      onChange={e => handleStageDropdown(student._id, e.target.value, e)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {PROGRESS_STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Footer info */}
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{student.school || student.yearGroup || '—'}</span>
                    <span className="text-blue-500 font-medium group-hover:underline">View details →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Student detail modal */}
      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </div>
  )
}

export default Students
