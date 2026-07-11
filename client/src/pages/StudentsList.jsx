import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  API,
  PROGRESS_STAGES,
  subjectColour,
  getStageColour,
  getStageLabel,
  StudentModal,
} from './studentsShared'

const StudentsList = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">👨‍🎓 Students</h1>
          <p className="text-gray-500 text-sm">
            {students.length} student{students.length !== 1 ? 's' : ''}
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
            className="flex-1 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All subjects</option>
            {allSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-800 text-base truncate group-hover:text-brand-700 transition">
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
                    <div className="bg-brand-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-extrabold text-brand-700">{booked}</p>
                      <p className="text-xs text-brand-500 leading-tight">Booked</p>
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      {PROGRESS_STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{student.school || student.yearGroup || '—'}</span>
                    <span className="text-brand-600 font-medium group-hover:underline">View details →</span>
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

export default StudentsList