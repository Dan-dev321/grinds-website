import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const PROGRESS_STAGES = [
  { value: 'just-started',         label: 'Just Started',         colour: 'bg-gray-100 text-gray-600' },
  { value: 'building-foundations', label: 'Building Foundations', colour: 'bg-blue-100 text-blue-700' },
  { value: 'making-progress',      label: 'Making Progress',      colour: 'bg-yellow-100 text-yellow-700' },
  { value: 'on-track',             label: 'On Track',             colour: 'bg-green-100 text-green-700' },
  { value: 'exam-ready',           label: 'Exam Ready',           colour: 'bg-purple-100 text-purple-700' },
  { value: 'completed',            label: 'Completed',            colour: 'bg-emerald-100 text-emerald-700' },
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

// ─── Field component for view mode ────────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-28 shrink-0 text-xs">{label}</span>
    <span className="text-gray-700 font-medium text-xs">{value}</span>
  </div>
)

// ─── Field component for edit mode ────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500">{label}</label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )}
  </div>
)

// ─── Student Modal ─────────────────────────────────────────────────────────────
const StudentModal = ({ student, onClose, onProgressUpdate, onProfileUpdate }) => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  // ── Tabs: 'overview' | 'sessions' ────────────────────────────────────────────
  const [tab, setTab] = useState('overview')

  // ── Edit mode ─────────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    phone:       student.phone       || '',
    school:      student.school      || '',
    yearGroup:   student.yearGroup   || '',
    subjects:    (student.subjects   || []).join(', '),
    examBoard:   student.examBoard   || '',
    goals:       student.goals       || '',
    parentName:  student.parentName  || '',
    parentEmail: student.parentEmail || '',
    parentPhone: student.parentPhone || '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileFlash, setProfileFlash]   = useState('')

  // ── Progress ─────────────────────────────────────────────────────────────────
  const [stage, setStage]   = useState(student.progressStage || 'just-started')
  const [savingStage, setSavingStage] = useState(false)
  const [stageFlash, setStageFlash]   = useState('')

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const [sessions, setSessions]             = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)

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

  const upcoming  = sessions.filter(s => s.status === 'upcoming')
  const completed = sessions.filter(s => s.status === 'completed')
  const noShows   = sessions.filter(s => s.status === 'no-show')
  const stageIndex = PROGRESS_STAGES.findIndex(s => s.value === stage)

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const payload = {
        ...form,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      }
      const res = await axios.patch(`${API}/api/students/${student._id}/profile`, payload, authHeader)
      onProfileUpdate(student._id, res.data)
      setEditing(false)
      setProfileFlash('Profile saved ✅')
      setTimeout(() => setProfileFlash(''), 2500)
    } catch {
      setProfileFlash('Failed to save — try again')
      setTimeout(() => setProfileFlash(''), 2500)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveStage = async () => {
    try {
      setSavingStage(true)
      await axios.patch(`${API}/api/students/${student._id}/progress`, { progressStage: stage }, authHeader)
      onProgressUpdate(student._id, stage)
      setStageFlash('Progress saved ✅')
      setTimeout(() => setStageFlash(''), 2500)
    } catch {
      setStageFlash('Failed to save — try again')
      setTimeout(() => setStageFlash(''), 2500)
    } finally {
      setSavingStage(false)
    }
  }

  const handleCancelEdit = () => {
    setForm({
      phone:       student.phone       || '',
      school:      student.school      || '',
      yearGroup:   student.yearGroup   || '',
      subjects:    (student.subjects   || []).join(', '),
      examBoard:   student.examBoard   || '',
      goals:       student.goals       || '',
      parentName:  student.parentName  || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
    })
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-gray-800 leading-tight truncate">
                {student.name}
              </h2>
              <p className="text-xs text-gray-400 truncate">{student.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Prominent Edit button */}
              {tab === 'overview' && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                >
                  ✏️ Edit Profile
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['overview', 'sessions'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setEditing(false) }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                  tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'overview' ? '📋 Overview' : '🗓️ Sessions'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '📅', label: 'Upcoming',  val: upcoming.length,  bg: 'bg-blue-50',  num: 'text-blue-700' },
                  { icon: '✅', label: 'Completed', val: completed.length, bg: 'bg-green-50', num: 'text-green-700' },
                  { icon: '🚫', label: 'No Shows',  val: noShows.length,   bg: 'bg-red-50',   num: 'text-red-500' },
                ].map(({ icon, label, val, bg, num }) => (
                  <div key={label} className={`rounded-xl px-3 py-2.5 text-center ${bg}`}>
                    <p className="text-base">{icon}</p>
                    <p className={`text-xl font-extrabold leading-tight ${num}`}>{val}</p>
                    <p className="text-xs text-gray-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress stage */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-3">📈 Progress Stage</h3>
                <div className="flex gap-1 mb-3">
                  {PROGRESS_STAGES.map((s, i) => (
                    <button
                      key={s.value}
                      onClick={() => setStage(s.value)}
                      title={s.label}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        i <= stageIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PROGRESS_STAGES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStage(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                        stage === s.value
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {stageFlash && (
                  <p className={`text-xs mb-2 font-medium ${stageFlash.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                    {stageFlash}
                  </p>
                )}
                <button
                  onClick={handleSaveStage}
                  disabled={savingStage}
                  className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {savingStage ? 'Saving...' : 'Save Stage'}
                </button>
              </section>

              <hr className="border-gray-100" />

              {/* Profile — VIEW mode */}
              {!editing && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">👤 Profile</h3>
                    {profileFlash && (
                      <p className={`text-xs font-medium ${profileFlash.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                        {profileFlash}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2.5">
                    {student.phone     && <Row label="Phone"       value={student.phone} />}
                    {student.school    && <Row label="School"      value={student.school} />}
                    {student.yearGroup && <Row label="Year Group"  value={student.yearGroup} />}
                    {student.examBoard && <Row label="Exam Board"  value={student.examBoard} />}
                    {(student.subjects?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.subjects.map(sub => (
                          <span key={sub} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subjectColour(sub)}`}>
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                    {(student.parentName || student.parentEmail || student.parentPhone) && (
                      <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                        <p className="text-xs font-bold text-gray-500">Parent / Guardian</p>
                        {student.parentName  && <Row label="Name"  value={student.parentName} />}
                        {student.parentEmail && <Row label="Email" value={student.parentEmail} />}
                        {student.parentPhone && <Row label="Phone" value={student.parentPhone} />}
                      </div>
                    )}
                    {student.goals && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-500 mb-1">Goals</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{student.goals}</p>
                      </div>
                    )}
                    {!student.phone && !student.school && !student.yearGroup &&
                     !student.examBoard && !student.parentName && !student.goals && (
                      <p className="text-xs text-gray-400 text-center py-2">No profile details yet — click Edit Profile to add some</p>
                    )}
                  </div>
                </section>
              )}

              {/* Profile — EDIT mode */}
              {editing && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">✏️ Edit Profile</h3>
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone"      name="phone"     value={form.phone}     onChange={handleFormChange} placeholder="+353..." />
                      <Field label="Year Group" name="yearGroup" value={form.yearGroup} onChange={handleFormChange} placeholder="e.g. 6th Year" />
                    </div>
                    <Field label="School"     name="school"    value={form.school}    onChange={handleFormChange} placeholder="School name" />
                    <Field label="Exam Board" name="examBoard" value={form.examBoard} onChange={handleFormChange} placeholder="e.g. SEC, Cambridge" />
                    <Field
                      label="Subjects (comma-separated)"
                      name="subjects"
                      value={form.subjects}
                      onChange={handleFormChange}
                      placeholder="Maths, English, Chemistry"
                    />
                    <Field label="Goals" name="goals" value={form.goals} onChange={handleFormChange} type="textarea" placeholder="What is this student working towards?" />

                    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                      <p className="text-xs font-bold text-gray-600">👨‍👩‍👧 Parent / Guardian</p>
                      <Field label="Name"  name="parentName"  value={form.parentName}  onChange={handleFormChange} />
                      <Field label="Email" name="parentEmail" value={form.parentEmail} onChange={handleFormChange} type="email" />
                      <Field label="Phone" name="parentPhone" value={form.parentPhone} onChange={handleFormChange} />
                    </div>

                    {profileFlash && (
                      <p className={`text-xs font-medium ${profileFlash.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                        {profileFlash}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex-1 bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition disabled:opacity-50 shadow-sm"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── SESSIONS TAB ── */}
          {tab === 'sessions' && (
            <section>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: '📅', label: 'Upcoming',  val: upcoming.length,  bg: 'bg-blue-50',  num: 'text-blue-700' },
                  { icon: '✅', label: 'Completed', val: completed.length, bg: 'bg-green-50', num: 'text-green-700' },
                  { icon: '🚫', label: 'No Shows',  val: noShows.length,   bg: 'bg-red-50',   num: 'text-red-500' },
                ].map(({ icon, label, val, bg, num }) => (
                  <div key={label} className={`rounded-xl px-3 py-2.5 text-center ${bg}`}>
                    <p className="text-base">{icon}</p>
                    <p className={`text-xl font-extrabold leading-tight ${num}`}>{val}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {loadingSessions ? (
                <p className="text-sm text-gray-400 text-center py-8">Loading sessions…</p>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">
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
                        <p className="font-semibold text-gray-800 text-xs">
                          {s.date} · {s.startTime}–{s.endTime}
                        </p>
                        {s.lessonLength && (
                          <p className="text-xs text-gray-500">{s.lessonLength} min</p>
                        )}
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
          )}

        </div>
      </div>
    </div>
  )
}

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
  const [selected, setSelected]           = useState(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/students`, authHeader)
      setStudents(res.data)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleProgressUpdate = (studentId, newStage) => {
    setStudents(prev => prev.map(s => s._id === studentId ? { ...s, progressStage: newStage } : s))
    setSelected(prev => prev?._id === studentId ? { ...prev, progressStage: newStage } : prev)
  }

  const handleProfileUpdate = (studentId, updated) => {
    setStudents(prev => prev.map(s => s._id === studentId ? { ...s, ...updated } : s))
    setSelected(prev => prev?._id === studentId ? { ...prev, ...updated } : prev)
  }

  const handleStageDropdown = async (studentId, newStage, e) => {
    e.stopPropagation()
    try {
      await axios.patch(`${API}/api/students/${studentId}/progress`, { progressStage: newStage }, authHeader)
      handleProgressUpdate(studentId, newStage)
    } catch { /* modal has its own feedback */ }
  }

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

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">👨‍🎓 Students</h1>
          <p className="text-gray-500 text-sm">
            {students.length} student{students.length !== 1 ? 's' : ''} · click any card for full details
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        )}

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
            {allSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All stages</option>
            {PROGRESS_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

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
              const stage       = student.progressStage || 'just-started'
              const stageColour = getStageColour(stage)
              const stageLabel  = getStageLabel(stage)
              const booked      = student.sessionStats?.booked    ?? 0
              const done        = student.sessionStats?.completed ?? 0
              const noShow      = student.sessionStats?.noShow    ?? 0

              return (
                <div
                  key={student._id}
                  onClick={() => setSelected(student)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                >
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

                  {(student.subjects?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {student.subjects.map(sub => (
                        <span key={sub} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subjectColour(sub)}`}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-blue-700">{booked}</p>
                      <p className="text-xs text-blue-500 leading-tight">Booked</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-green-700">{done}</p>
                      <p className="text-xs text-green-500 leading-tight">Done</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-red-500">{noShow}</p>
                      <p className="text-xs text-red-400 leading-tight">No Show</p>
                    </div>
                  </div>

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

      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onProgressUpdate={handleProgressUpdate}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}

export default Students
