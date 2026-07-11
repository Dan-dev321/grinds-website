import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  API,
  PROGRESS_STAGES,
  subjectColour,
  fmtMonth,
  SvgBarChart,
  SvgLineChart,
  StudentModal,
} from './studentsShared'

// ─── Box wrapper ──────────────────────────────────────────────────────────────
// Wraps a panel so that, in customise mode, it grows a hide/unhide button in
// the corner. Outside customise mode, hidden panels simply don't render.
const Box = ({ id, customizing, hidden, toggleHide, className = '', children }) => {
  if (!customizing && hidden) return null

  return (
    <div className={`relative ${className} ${customizing && hidden ? 'opacity-40' : ''}`}>
      {customizing && (
        <button
          onClick={() => toggleHide(id)}
          className={`absolute top-2 right-2 z-10 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm transition ${
            hidden
              ? 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              : 'bg-gray-800/85 text-white hover:bg-gray-900'
          }`}
        >
          {hidden ? '👁️ Unhide' : '🙈 Hide'}
        </button>
      )}
      {children}
    </div>
  )
}

const StudentsOverview = () => {
  const { token } = useAuth()
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  const [analytics, setAnalytics]               = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [analyticsError, setAnalyticsError]     = useState('')
  const [timeRange, setTimeRange]               = useState('all')

  // ── Customise mode ────────────────────────────────────────────────────────
  const [customizing, setCustomizing] = useState(false)
  const [hiddenBoxes, setHiddenBoxes] = useState(new Set())

  const toggleHide = (id) => {
    setHiddenBoxes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/students`, authHeader)
      setStudents(res.data)
    } catch {
      // silently ignore - analytics error banner covers the important failure
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

  const allSubjects = [...new Set(students.flatMap(s => s.subjects || []))].sort()

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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">📊 Students Overview</h1>
          <p className="text-gray-500 text-sm">
            {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
        </div>

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

            {/* Customise + Time range filter */}
            <div className="flex justify-end items-center gap-3 mb-6">
              <button
                onClick={() => setCustomizing(c => !c)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-sm border transition ${
                  customizing
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {customizing ? '✅ Done' : '🛠️ Customise'}
              </button>
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
                      timeRange === key ? 'bg-brand-700 text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {customizing && (
              <div className="mb-6 bg-brand-50 border border-brand-100 text-brand-700 px-4 py-3 rounded-xl text-sm text-center">
                Customise mode — hide any panels you don't need. Hit "Done" to apply.
              </div>
            )}

            {/* ── Hero stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { id: 'hero-total-students',     icon: '👨‍🎓', label: 'Total Students',    val: students.length,                        bg: 'bg-brand-50',  num: 'text-brand-700'  },
                { id: 'hero-total-hours',        icon: '🕐', label: 'Total Hours Taught', val: analytics?.totalHours         ?? '—',   bg: 'bg-amber-50',  num: 'text-amber-600'  },
                { id: 'hero-sessions-completed', icon: '✅', label: 'Sessions Completed', val: analytics?.completedCount      ?? '—',   bg: 'bg-green-50',  num: 'text-green-700'  },
                { id: 'hero-avg-lesson-length',  icon: '📐', label: 'Avg Lesson Length',  val: analytics?.avgLessonLength ? `${analytics.avgLessonLength}m` : '—', bg: 'bg-violet-50', num: 'text-violet-700' },
              ].map(({ id, icon, label, val, bg, num }) => (
                <Box
                  key={id}
                  id={id}
                  customizing={customizing}
                  hidden={hiddenBoxes.has(id)}
                  toggleHide={toggleHide}
                  className={`rounded-2xl p-5 text-center ${bg} border border-white shadow-sm`}
                >
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className={`text-3xl font-extrabold leading-tight ${num}`}>{val}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                </Box>
              ))}
            </div>

            {/* ── Upcoming session load ── */}
            <Box
              id="upcoming-session-load"
              customizing={customizing}
              hidden={hiddenBoxes.has('upcoming-session-load')}
              toggleHide={toggleHide}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
            >
              <h2 className="text-base font-bold text-gray-700 mb-4">📅 Upcoming Session Load</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Next 7 days',  val: analytics?.upcomingNext7,  bg: 'bg-brand-50',  num: 'text-brand-700'  },
                  { label: 'Next 14 days', val: analytics?.upcomingNext14, bg: 'bg-brand-100', num: 'text-brand-800'  },
                  { label: 'Next 30 days', val: analytics?.upcomingNext30, bg: 'bg-violet-50', num: 'text-violet-700' },
                ].map(({ label, val, bg, num }) => (
                  <div key={label} className={`rounded-xl p-4 text-center ${bg}`}>
                    <p className={`text-3xl font-extrabold ${num}`}>{val ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </Box>

            {/* ── Completion rate + busiest day + busiest time ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

              <Box
                id="completion-rate"
                customizing={customizing}
                hidden={hiddenBoxes.has('completion-rate')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center"
              >
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
              </Box>

              <Box
                id="busiest-day"
                customizing={customizing}
                hidden={hiddenBoxes.has('busiest-day')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center"
              >
                <p className="text-sm font-bold text-gray-700 mb-2">📆 Busiest Day</p>
                {(() => {
                  const best = analytics?.sessionsByDay?.reduce((b, d) => d.count > (b?.count ?? -1) ? d : b, null)
                  return best && best.count > 0 ? (
                    <>
                      <p className="text-3xl font-extrabold text-brand-700 mb-1">{best.day}</p>
                      <p className="text-xs text-gray-400">{best.count} session{best.count !== 1 ? 's' : ''} booked</p>
                    </>
                  ) : <p className="text-sm text-gray-400">No data yet</p>
                })()}
              </Box>

              <Box
                id="busiest-time"
                customizing={customizing}
                hidden={hiddenBoxes.has('busiest-time')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-center"
              >
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
              </Box>
            </div>

            {/* ── Avg sessions per student ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Box
                id="avg-sessions-per-student"
                customizing={customizing}
                hidden={hiddenBoxes.has('avg-sessions-per-student')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-sm font-bold text-gray-700 mb-1">📊 Avg Sessions Per Student</p>
                <p className="text-xs text-gray-400 mb-3">Completed sessions ÷ total students</p>
                <p className="text-4xl font-extrabold text-brand-700">
                  {analytics?.avgSessionsPerStudent ?? '—'}
                </p>
              </Box>
              <Box
                id="total-no-shows"
                customizing={customizing}
                hidden={hiddenBoxes.has('total-no-shows')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-sm font-bold text-gray-700 mb-1">🚫 Total No-Shows</p>
                <p className="text-xs text-gray-400 mb-3">Across all students in selected range</p>
                <p className="text-4xl font-extrabold text-red-500">
                  {analytics?.noShowCount ?? '—'}
                </p>
              </Box>
            </div>

            {/* ── Sessions by day + sessions by hour ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Box
                id="sessions-by-day"
                customizing={customizing}
                hidden={hiddenBoxes.has('sessions-by-day')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-gray-700 mb-5">📅 Sessions by Day of Week</h2>
                {(analytics?.sessionsByDay ?? []).every(d => d.count === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-6">No session data yet</p>
                ) : (
                  <SvgBarChart
                    data={analytics.sessionsByDay}
                    labelKey="day"
                    countKey="count"
                    barColour="#4f46e5"
                    labelShort={d => d.day.slice(0, 3)}
                  />
                )}
              </Box>

              <Box
                id="sessions-by-hour"
                customizing={customizing}
                hidden={hiddenBoxes.has('sessions-by-hour')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>
            </div>

            {/* ── Completed sessions by month + no-show rate by month ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Box
                id="completed-sessions-by-month"
                customizing={customizing}
                hidden={hiddenBoxes.has('completed-sessions-by-month')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>

              <Box
                id="no-show-rate-by-month"
                customizing={customizing}
                hidden={hiddenBoxes.has('no-show-rate-by-month')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>
            </div>

            {/* ── New students by month + year group breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Box
                id="new-students-by-month"
                customizing={customizing}
                hidden={hiddenBoxes.has('new-students-by-month')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>

              <Box
                id="year-group-breakdown"
                customizing={customizing}
                hidden={hiddenBoxes.has('year-group-breakdown')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>
            </div>

            {/* ── Progress & Subject breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Box
                id="progress-breakdown"
                customizing={customizing}
                hidden={hiddenBoxes.has('progress-breakdown')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
                            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
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
              </Box>

              <Box
                id="subject-breakdown"
                customizing={customizing}
                hidden={hiddenBoxes.has('subject-breakdown')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
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
              </Box>
            </div>

            {/* ── Most active students leaderboard ── */}
            {(analytics?.mostActiveStudents ?? []).length > 0 && (
              <Box
                id="most-active-students"
                customizing={customizing}
                hidden={hiddenBoxes.has('most-active-students')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
              >
                <h2 className="text-base font-bold text-gray-700 mb-4">🏆 Most Active Students</h2>
                <div className="flex flex-col gap-2">
                  {analytics.mostActiveStudents.map((s, i) => (
                    <div
                      key={s._id}
                      onClick={() => setSelected(students.find(st => st._id === s._id))}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition group"
                    >
                      <span className={`text-sm font-extrabold w-6 text-center shrink-0 ${
                        i === 0 ? 'text-amber-500' :
                        i === 1 ? 'text-gray-400'  :
                        i === 2 ? 'text-amber-700' : 'text-gray-300'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-brand-700 transition">
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
              </Box>
            )}

            {/* ── Days between last lesson panel ── */}
            {daysBetweenData.length > 0 && (
              <Box
                id="days-since-last-lesson"
                customizing={customizing}
                hidden={hiddenBoxes.has('days-since-last-lesson')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
              >
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
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-brand-700 transition">
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
              </Box>
            )}

            {/* ── No-show attention panel ── */}
            {noShowStudents.length > 0 && (
              <Box
                id="students-no-shows"
                customizing={customizing}
                hidden={hiddenBoxes.has('students-no-shows')}
                toggleHide={toggleHide}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
              >
                <h2 className="text-base font-bold text-gray-700 mb-4">⚠️ Students with No-Shows</h2>
                <div className="flex flex-col gap-2">
                  {noShowStudents.map(s => (
                    <div
                      key={s._id}
                      onClick={() => setSelected(s)}
                      className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-brand-700 transition">
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
              </Box>
            )}

            {students.length === 0 && (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                <div className="text-5xl mb-3">🎒</div>
                <p className="font-medium text-gray-500">No students yet</p>
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

export default StudentsOverview