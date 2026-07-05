import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const PROGRESS_STAGES = [
  { value: 'just-started',         label: 'Just Started',         colour: 'bg-gray-100 text-gray-600'    },
  { value: 'building-foundations', label: 'Building Foundations', colour: 'bg-blue-100 text-blue-700'    },
  { value: 'making-progress',      label: 'Making Progress',      colour: 'bg-yellow-100 text-yellow-700' },
  { value: 'on-track',             label: 'On Track',             colour: 'bg-green-100 text-green-700'  },
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

const fmtMonth = (key) => {
  const [y, m] = key.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]} ${y.slice(2)}`
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const SvgBarChart = ({ data, labelKey, countKey, barColour = '#3b82f6', labelShort, height = 140 }) => {
  const max    = Math.max(...data.map(d => d[countKey]), 1)
  const W      = 500
  const H      = height
  const padL   = 28
  const padB   = 32
  const padT   = 10
  const padR   = 8
  const chartW = W - padL - padR
  const chartH = H - padB - padT
  const barW   = Math.max(4, (chartW / data.length) * 0.55)
  const gap    = chartW / data.length

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {gridLines.map(f => {
        const y = padT + chartH - f * chartH
        return (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(f * max)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(2, (d[countKey] / max) * chartH)
        const x    = padL + i * gap + gap / 2 - barW / 2
        const y    = padT + chartH - barH
        const label = labelShort ? labelShort(d) : d[labelKey]
        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx="3"
              fill={barColour}
              opacity="0.85"
            />
            {d[countKey] > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="9" fill="#6b7280">
                {d[countKey]}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={padT + chartH + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* X axis */}
      <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
const SvgLineChart = ({ data, labelKey, countKey, lineColour = '#3b82f6', labelShort, height = 140, ySuffix = '' }) => {
  if (!data || data.length < 2) return (
    <p className="text-sm text-gray-400 text-center py-6">Not enough data yet</p>
  )

  const max    = Math.max(...data.map(d => d[countKey]), 1)
  const W      = 500
  const H      = height
  const padL   = 28
  const padB   = 32
  const padT   = 10
  const padR   = 8
  const chartW = W - padL - padR
  const chartH = H - padB - padT

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + chartH - (d[countKey] / max) * chartH,
    d,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  // Filled area path
  const areaPath = [
    `M ${pts[0].x} ${padT + chartH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${padT + chartH}`,
    'Z',
  ].join(' ')

  const gridLines = [0, 0.5, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${lineColour.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={lineColour} stopOpacity="0.18" />
          <stop offset="100%" stopColor={lineColour} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map(f => {
        const y = padT + chartH - f * chartH
        return (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(f * max)}{ySuffix}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${lineColour.replace('#','')})`} />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={lineColour} strokeWidth="2" strokeLinejoin="round" />

      {/* Dots + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={lineColour} />
          {p.d[countKey] > 0 && (
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="9" fill="#6b7280">
              {p.d[countKey]}
            </text>
          )}
          <text
            x={p.x}
            y={padT + chartH + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
          >
            {labelShort ? labelShort(p.d) : p.d[labelKey]}
          </text>
        </g>
      ))}

      <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

// ─── Field component for view mode ───────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-28 shrink-0 text-xs">{label}</span>
    <span className="text-gray-700 font-medium text-xs">{value}</span>
  </div>
)

// ─── Field component for edit mode ───────────────────────────────────────────
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

// ─── Student Modal ────────────────────────────────────────────────────────────
const StudentModal = ({ student, onClose, onProgressUpdate, onProfileUpdate }) => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const [tab, setTab] = useState('overview')

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

  const [stage, setStage]             = useState(student.progressStage || 'just-started')
  const [savingStage, setSavingStage] = useState(false)
  const [stageFlash, setStageFlash]   = useState('')

  const [sessions, setSessions]               = useState([])
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

  const totalHours = +(
    completed.reduce((acc, s) => acc + (s.lessonLength ?? 60), 0) / 60
  ).toFixed(1)

  const decided        = sessions.filter(s => s.status !== 'upcoming')
  const completionRate = decided.length
    ? Math.round((completed.length / decided.length) * 100)
    : null

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
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-gray-800 leading-tight truncate">
                {student.name}
              </h2>
              <p className="text-xs text-gray-400 truncate">{student.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">

          {tab === 'overview' && (
            <>
              {/* Stat pills */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📅', label: 'Upcoming',     val: upcoming.length,  bg: 'bg-blue-50',  num: 'text-blue-700'  },
                  { icon: '✅', label: 'Completed',    val: completed.length, bg: 'bg-green-50', num: 'text-green-700' },
                  { icon: '🚫', label: 'No Shows',     val: noShows.length,   bg: 'bg-red-50',   num: 'text-red-500'   },
                  { icon: '🕐', label: 'Hours Taught', val: totalHours,       bg: 'bg-amber-50', num: 'text-amber-600' },
                ].map(({ icon, label, val, bg, num }) => (
                  <div key={label} className={`rounded-xl px-3 py-2.5 text-center ${bg}`}>
                    <p className="text-base">{icon}</p>
                    <p className={`text-xl font-extrabold leading-tight ${num}`}>{val}</p>
                    <p className="text-xs text-gray-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* Completion rate */}
              {completionRate !== null && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-600">🎯 Completion Rate</span>
                    <span className={`text-xs font-extrabold ${
                      completionRate >= 80 ? 'text-green-600' :
                      completionRate >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        completionRate >= 80 ? 'bg-green-500' :
                        completionRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {completed.length} completed · {noShows.length} no-show{noShows.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

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

              {/* Profile VIEW */}
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
                    {student.phone     && <Row label="Phone"      value={student.phone} />}
                    {student.school    && <Row label="School"     value={student.school} />}
                    {student.yearGroup && <Row label="Year Group" value={student.yearGroup} />}
                    {student.examBoard && <Row label="Exam Board" value={student.examBoard} />}
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
                      <p className="text-xs text-gray-400 text-center py-2">
                        No profile details yet — click Edit Profile to add some
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Profile EDIT */}
              {editing && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">✏️ Edit Profile</h3>
                    <button onClick={handleCancelEdit} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
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

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <section>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: '📅', label: 'Upcoming',  val: upcoming.length,  bg: 'bg-blue-50',  num: 'text-blue-700'  },
                  { icon: '✅', label: 'Completed', val: completed.length, bg: 'bg-green-50', num: 'text-green-700' },
                  { icon: '🚫', label: 'No Shows',  val: noShows.length,   bg: 'bg-red-50',   num: 'text-red-500'   },
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

// ─── Main Students Page ───────────────────────────────────────────────────────
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
  const [pageTab, setPageTab]             = useState('overview')

  // ── Analytics ─────────────────────────────────────────────────────────────
  const [analytics, setAnalytics]               = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [analyticsError, setAnalyticsError]     = useState('')
  const [timeRange, setTimeRange]               = useState('all')

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

  const fetchAnalytics = async (range = 'all') => {
    try {
      setLoadingAnalytics(true)
      setAnalyticsError('')
      const params = range !== 'all' ? `?days=${range}` : ''
      const res = await axios.get(`${API}/api/students/analytics${params}`, authHeader)
      setAnalytics(res.data)
    } catch {
      setAnalyticsError('Failed to load analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => { fetchStudents(); fetchAnalytics('all') }, [])

  const handleTimeRange = (range) => {
    setTimeRange(range)
    fetchAnalytics(range)
  }

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
    } catch { }
  }

  const allSubjects = [...new Set(students.flatMap(s => s.subjects || []))].sort()

  const filtered = students.filter(s => {
    const matchSearch  = s.name.toLowerCase().includes(search.toLowerCase()) ||
                         s.email.toLowerCase().includes(search.toLowerCase())
    const matchSubject = filterSubject === 'all' || (s.subjects || []).includes(filterSubject)
    const matchStage   = filterStage === 'all'   || (s.progressStage || 'just-started') === filterStage
    return matchSearch && matchSubject && matchStage
  })

  const stageBreakdown = PROGRESS_STAGES.map(s => ({
    ...s,
    count: students.filter(st => (st.progressStage || 'just-started') === s.value).length,
  }))

  const subjectBreakdown = allSubjects
    .map(sub => ({
      name:   sub,
      count:  students.filter(s => (s.subjects || []).includes(sub)).length,
      colour: subjectColour(sub),
    }))
    .sort((a, b) => b.count - a.count)

  const noShowStudents = students
    .filter(s => (s.sessionStats?.noShow ?? 0) > 0)
    .sort((a, b) => (b.sessionStats?.noShow ?? 0) - (a.sessionStats?.noShow ?? 0))

  const last6 = (arr = []) => arr.slice(-6)

  const daysBetweenData = analytics?.daysBetweenLastLesson ?? []

  // Colour coding for days since last lesson
  const riskColour = (days) => {
    if (days >= 30) return { bg: 'bg-red-50 border-red-200',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    }
    if (days >= 14) return { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  }
    return               { bg: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500'  }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">👨‍🎓 Students</h1>
          <p className="text-gray-500 text-sm">
            {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Page Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 shadow-sm max-w-sm mx-auto">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'students', label: '🎓 Students' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPageTab(key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                pageTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════════════════ */}
        {pageTab === 'overview' && (
          <>
            {loading || loadingAnalytics ? (
              <div className="text-center py-24 text-gray-400">
                <div className="text-5xl mb-3">⏳</div>
                <p>Loading…</p>
              </div>
            ) : (
              <>
                {analyticsError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                    {analyticsError}
                  </div>
                )}

                {/* Time range filter */}
                <div className="flex justify-end mb-6">
                  <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    {[
                      { key: '30',  label: '30d'  },
                      { key: '90',  label: '90d'  },
                      { key: '180', label: '6m'   },
                      { key: 'all', label: 'All'  },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleTimeRange(key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          timeRange === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Hero stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: '👨‍🎓', label: 'Total Students',    val: students.length,                        bg: 'bg-blue-50',   num: 'text-blue-700'   },
                    { icon: '🕐', label: 'Total Hours Taught', val: analytics?.totalHours         ?? '—',   bg: 'bg-amber-50',  num: 'text-amber-600'  },
                    { icon: '✅', label: 'Sessions Completed', val: analytics?.completedCount      ?? '—',   bg: 'bg-green-50',  num: 'text-green-700'  },
                    { icon: '📐', label: 'Avg Lesson Length',  val: analytics?.avgLessonLength ? `${analytics.avgLessonLength}m` : '—', bg: 'bg-violet-50', num: 'text-violet-700' },
                  ].map(({ icon, label, val, bg, num }) => (
                    <div key={label} className={`rounded-2xl p-5 text-center ${bg} border border-white shadow-sm`}>
                      <p className="text-2xl mb-1">{icon}</p>
                      <p className={`text-3xl font-extrabold leading-tight ${num}`}>{val}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                {/* ── Upcoming session load ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <h2 className="text-base font-bold text-gray-700 mb-4">📅 Upcoming Session Load</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Next 7 days',  val: analytics?.upcomingNext7,  bg: 'bg-blue-50',   num: 'text-blue-700'   },
                      { label: 'Next 14 days', val: analytics?.upcomingNext14, bg: 'bg-indigo-50', num: 'text-indigo-700' },
                      { label: 'Next 30 days', val: analytics?.upcomingNext30, bg: 'bg-violet-50', num: 'text-violet-700' },
                    ].map(({ label, val, bg, num }) => (
                      <div key={label} className={`rounded-xl p-4 text-center ${bg}`}>
                        <p className={`text-3xl font-extrabold ${num}`}>{val ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Completion rate + busiest day + busiest time ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-700 mb-2">🎯 Completion Rate</p>
                    {analytics?.completionRate != null ? (
                      <>
                        <p className={`text-4xl font-extrabold mb-2 ${
                          analytics.completionRate >= 80 ? 'text-green-600' :
                          analytics.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {analytics.completionRate}%
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${
                              analytics.completionRate >= 80 ? 'bg-green-500' :
                              analytics.completionRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${analytics.completionRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">
                          {analytics.completedCount} completed · {analytics.noShowCount} no-show{analytics.noShowCount !== 1 ? 's' : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">No decided sessions yet</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-700 mb-2">📆 Busiest Day</p>
                    {(() => {
                      const best = analytics?.sessionsByDay?.reduce((b, d) => d.count > (b?.count ?? -1) ? d : b, null)
                      return best && best.count > 0 ? (
                        <>
                          <p className="text-3xl font-extrabold text-blue-700 mb-1">{best.day}</p>
                          <p className="text-xs text-gray-400">{best.count} session{best.count !== 1 ? 's' : ''} booked</p>
                        </>
                      ) : <p className="text-sm text-gray-400">No data yet</p>
                    })()}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-700 mb-2">🕑 Busiest Time</p>
                    {(() => {
                      const best = analytics?.sessionsByHour?.reduce((b, d) => d.count > (b?.count ?? -1) ? d : b, null)
                      return best && best.count > 0 ? (
                        <>
                          <p className="text-3xl font-extrabold text-violet-700 mb-1">{best.label}</p>
                          <p className="text-xs text-gray-400">{best.count} session{best.count !== 1 ? 's' : ''} at this hour</p>
                        </>
                      ) : <p className="text-sm text-gray-400">No data yet</p>
                    })()}
                  </div>
                </div>

                {/* ── Avg sessions per student ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm font-bold text-gray-700 mb-1">📊 Avg Sessions Per Student</p>
                    <p className="text-xs text-gray-400 mb-3">Completed sessions ÷ total students</p>
                    <p className="text-4xl font-extrabold text-blue-700">
                      {analytics?.avgSessionsPerStudent ?? '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm font-bold text-gray-700 mb-1">🚫 Total No-Shows</p>
                    <p className="text-xs text-gray-400 mb-3">Across all students in selected range</p>
                    <p className="text-4xl font-extrabold text-red-500">
                      {analytics?.noShowCount ?? '—'}
                    </p>
                  </div>
                </div>

                {/* ── Sessions by day + sessions by hour ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-5">📅 Sessions by Day of Week</h2>
                    {(analytics?.sessionsByDay ?? []).every(d => d.count === 0) ? (
                      <p className="text-sm text-gray-400 text-center py-6">No session data yet</p>
                    ) : (
                      <SvgBarChart
                        data={analytics.sessionsByDay}
                        labelKey="day"
                        countKey="count"
                        barColour="#3b82f6"
                        labelShort={d => d.day.slice(0, 3)}
                      />
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-5">🕐 Sessions by Time of Day</h2>
                    {(analytics?.sessionsByHour ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No session data yet</p>
                    ) : (
                      <SvgBarChart
                        data={analytics.sessionsByHour}
                        labelKey="label"
                        countKey="count"
                        barColour="#8b5cf6"
                      />
                    )}
                  </div>
                </div>

                {/* ── Completed sessions by month + no-show rate by month ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-1">📈 Completed Sessions by Month</h2>
                    <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
                    {(analytics?.sessionsByMonth ?? []).length < 2 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Not enough data yet</p>
                    ) : (
                      <SvgLineChart
                        data={last6(analytics.sessionsByMonth)}
                        labelKey="month"
                        countKey="count"
                        lineColour="#22c55e"
                        labelShort={d => fmtMonth(d.month)}
                      />
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-1">🚫 No-Show Rate by Month</h2>
                    <p className="text-xs text-gray-400 mb-4">% of decided sessions that were no-shows</p>
                    {(analytics?.noShowRateByMonth ?? []).length < 2 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Not enough data yet</p>
                    ) : (
                      <SvgLineChart
                        data={last6(analytics.noShowRateByMonth)}
                        labelKey="month"
                        countKey="rate"
                        lineColour="#ef4444"
                        labelShort={d => fmtMonth(d.month)}
                        ySuffix="%"
                      />
                    )}
                  </div>
                </div>

                {/* ── New students by month + year group breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-1">🆕 New Students by Month</h2>
                    <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
                    {(analytics?.newStudentsByMonth ?? []).length < 2 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Not enough data yet</p>
                    ) : (
                      <SvgLineChart
                        data={last6(analytics.newStudentsByMonth)}
                        labelKey="month"
                        countKey="count"
                        lineColour="#14b8a6"
                        labelShort={d => fmtMonth(d.month)}
                      />
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-5">🏫 Year Group Breakdown</h2>
                    {(analytics?.yearGroupBreakdown ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No year group data yet</p>
                    ) : (
                      <SvgBarChart
                        data={analytics.yearGroupBreakdown}
                        labelKey="yearGroup"
                        countKey="count"
                        barColour="#f59e0b"
                        labelShort={d => d.yearGroup.length > 6 ? d.yearGroup.slice(0, 6) + '…' : d.yearGroup}
                      />
                    )}
                  </div>
                </div>

                {/* ── Progress & Subject breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-5">📊 Progress Breakdown</h2>
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No students yet</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {stageBreakdown.map(s => (
                          <div key={s.value} className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 w-44 text-center ${s.colour}`}>
                              {s.label}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${students.length ? (s.count / students.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-5 text-right shrink-0">
                              {s.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-5">📚 Subject Breakdown</h2>
                    {subjectBreakdown.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No subjects added yet</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {subjectBreakdown.map(({ name, count, colour }) => (
                          <div key={name} className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 w-44 text-center ${colour}`}>
                              {name}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-violet-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${students.length ? (count / students.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-5 text-right shrink-0">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Most active students leaderboard ── */}
                {(analytics?.mostActiveStudents ?? []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-base font-bold text-gray-700 mb-4">🏆 Most Active Students</h2>
                    <div className="flex flex-col gap-2">
                      {analytics.mostActiveStudents.map((s, i) => (
                        <div
                          key={s._id}
                          onClick={() => setSelected(students.find(st => st._id === s._id))}
                          className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition group"
                        >
                          <span className={`text-sm font-extrabold w-6 text-center shrink-0 ${
                            i === 0 ? 'text-amber-500' :
                            i === 1 ? 'text-gray-400'  :
                            i === 2 ? 'text-amber-700' : 'text-gray-300'
                          }`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 transition">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            {s.sessions} session{s.sessions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Days between last lesson panel ── */}
                {daysBetweenData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-bold text-gray-700">📆 Days Since Last Lesson</h2>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt;14d</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 14–29d</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 30d+</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">Students sorted by longest gap first</p>
                    <div className="flex flex-col gap-2">
                      {daysBetweenData.map(s => {
                        const { bg, badge, dot } = riskColour(s.daysSince)
                        return (
                          <div
                            key={s._id}
                            onClick={() => setSelected(students.find(st => st._id === s._id))}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer hover:opacity-80 transition group ${bg}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 transition">
                                  {s.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Last lesson: {s.lastDate}
                                </p>
                              </div>
                            </div>
                            <span className={`ml-3 shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${badge}`}>
                              {s.daysSince}d ago
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── No-show attention panel ── */}
                {noShowStudents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-base font-bold text-gray-700 mb-4">⚠️ Students with No-Shows</h2>
                    <div className="flex flex-col gap-2">
                      {noShowStudents.map(s => (
                        <div
                          key={s._id}
                          onClick={() => setSelected(s)}
                          className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 transition">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          </div>
                          <span className="ml-3 shrink-0 text-xs font-bold text-red-700 bg-red-200 px-2.5 py-1 rounded-full">
                            {s.sessionStats.noShow} no-show{s.sessionStats.noShow !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {students.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                    <div className="text-5xl mb-3">🎒</div>
                    <p className="font-medium text-gray-500">No students yet</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STUDENTS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {pageTab === 'students' && (
          <>
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
          </>
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