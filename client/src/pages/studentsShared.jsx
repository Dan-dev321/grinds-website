import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export const API = import.meta.env.VITE_API_URL

export const PROGRESS_STAGES = [
  { value: 'just-started',         label: 'Just Started',         colour: 'bg-gray-100 text-gray-600'    },
  { value: 'building-foundations', label: 'Building Foundations', colour: 'bg-blue-100 text-blue-700'    },
  { value: 'making-progress',      label: 'Making Progress',      colour: 'bg-yellow-100 text-yellow-700' },
  { value: 'on-track',             label: 'On Track',             colour: 'bg-green-100 text-green-700'  },
  { value: 'exam-ready',           label: 'Exam Ready',           colour: 'bg-purple-100 text-purple-700' },
  { value: 'completed',            label: 'Completed',            colour: 'bg-emerald-100 text-emerald-700' },
]

export const SUBJECT_COLOURS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
]

export const subjectColour = (subject) => {
  let hash = 0
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash)
  return SUBJECT_COLOURS[Math.abs(hash) % SUBJECT_COLOURS.length]
}

export const getStageColour = (value) =>
  PROGRESS_STAGES.find(s => s.value === value)?.colour ?? 'bg-gray-100 text-gray-600'

export const getStageLabel = (value) =>
  PROGRESS_STAGES.find(s => s.value === value)?.label ?? 'Just Started'

export const fmtMonth = (key) => {
  const [y, m] = key.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]} ${y.slice(2)}`
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
export const SvgBarChart = ({ data, labelKey, countKey, barColour = '#4f46e5', labelShort, height = 140 }) => {
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
export const SvgLineChart = ({ data, labelKey, countKey, lineColour = '#4f46e5', labelShort, height = 140, ySuffix = '' }) => {
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
export const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-28 shrink-0 text-xs">{label}</span>
    <span className="text-gray-700 font-medium text-xs">{value}</span>
  </div>
)

// ─── Field component for edit mode ───────────────────────────────────────────
export const Field = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500">{label}</label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    )}
  </div>
)

// ─── Student Modal ────────────────────────────────────────────────────────────
export const StudentModal = ({ student, onClose, onProgressUpdate, onProfileUpdate }) => {
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
                  className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
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
                  { icon: '📅', label: 'Upcoming',     val: upcoming.length,  bg: 'bg-brand-50', num: 'text-brand-700' },
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
                        i <= stageIndex ? 'bg-brand-700' : 'bg-gray-200'
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
                          ? 'bg-brand-700 text-white border-brand-700'
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
                  className="bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition disabled:opacity-50"
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
                        className="flex-1 bg-brand-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-brand-800 transition disabled:opacity-50 shadow-sm"
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
                  { icon: '📅', label: 'Upcoming',  val: upcoming.length,  bg: 'bg-brand-50', num: 'text-brand-700' },
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
                                                   'bg-brand-50 border-brand-200'
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
                                                   'bg-brand-200 text-brand-800'
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