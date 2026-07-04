import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const formatDisplay = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ─── Trigger a browser download from a blob response ──────────────────────────
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Minimal Rich Text Toolbar ────────────────────────────────────────────────
const Toolbar = ({ onBold, onBullet }) => (
  <div className="flex gap-2 mb-2">
    <button
      onMouseDown={(e) => { e.preventDefault(); onBold() }}
      className="px-3 py-1 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition"
      title="Bold"
    >
      B
    </button>
    <button
      onMouseDown={(e) => { e.preventDefault(); onBullet() }}
      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition"
      title="Bullet Point"
    >
      • List
    </button>
  </div>
)

// ─── Single Session Entry ─────────────────────────────────────────────────────
const SessionEntry = ({ entry, studentId, token, onSaved }) => {
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const editorRef               = useRef(null)

  const handleBold = () => {
    document.execCommand('bold', false, null)
    editorRef.current?.focus()
  }

  const handleBullet = () => {
    document.execCommand('insertUnorderedList', false, null)
    editorRef.current?.focus()
  }

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || ''
    try {
      setSaving(true)
      await axios.put(
        `${API}/api/notes/student/${studentId}/entry/${entry._id}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (onSaved) onSaved()
    } catch (err) {
      console.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const res = await axios.get(
        `${API}/api/notes/student/${studentId}/entry/${entry._id}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      )
      downloadBlob(res.data, `session_${entry.date}.pdf`)
    } catch (err) {
      console.error('Failed to export session PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mb-6">
      {/* Date Divider */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          {entry.dayOfWeek} — {formatDisplay(entry.date)} · {entry.startTime}–{entry.endTime}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Toolbar */}
      <Toolbar onBold={handleBold} onBullet={handleBullet} />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: entry.content || '' }}
        className="min-h-[100px] w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        style={{ lineHeight: '1.7' }}
      />

      {/* Actions */}
      <div className="flex justify-end items-center gap-2 mt-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-xs px-4 py-1.5 rounded-full font-semibold transition disabled:opacity-50 bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          {exporting ? 'Exporting…' : '📄 Export PDF'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-4 py-1.5 rounded-full font-semibold transition disabled:opacity-50 bg-blue-700 text-white hover:bg-blue-800"
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Notebook Component ──────────────────────────────────────────────────
const Notebook = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [students, setStudents]         = useState([])
  const [selectedStudent, setSelected]  = useState(null)
  const [notes, setNotes]               = useState(null)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)

  // ── Fetch sidebar students ──────────────────────────────────
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const res = await axios.get(`${API}/api/notes/students`, authHeader)
      setStudents(res.data)
    } catch (err) {
      console.error('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  // ── Fetch selected student's notes ──────────────────────────
  const fetchNotes = async (studentId) => {
    try {
      setLoadingNotes(true)
      const res = await axios.get(`${API}/api/notes/student/${studentId}`, authHeader)
      setNotes(res.data)
    } catch (err) {
      console.error('Failed to load notes')
      setNotes(null)
    } finally {
      setLoadingNotes(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleSelectStudent = (note) => {
    setSelected(note)
    fetchNotes(note.student._id)
  }

  const handleExportAll = async () => {
    if (!selectedStudent) return
    try {
      setExportingAll(true)
      const res = await axios.get(
        `${API}/api/notes/student/${selectedStudent.student._id}/export`,
        { ...authHeader, responseType: 'blob' }
      )
      const safeName = selectedStudent.student.name.replace(/[^a-z0-9]/gi, '_')
      downloadBlob(res.data, `${safeName}_session_notes.pdf`)
    } catch (err) {
      console.error('Failed to export notebook PDF')
    } finally {
      setExportingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-800">📓 Notebook</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your students</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {loadingStudents ? (
            <p className="text-xs text-gray-400 px-5 py-3">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-xs text-gray-400 px-5 py-3">
              No students yet — complete a session to get started!
            </p>
          ) : (
            students.map((note) => {
              const isActive = selectedStudent?.student._id === note.student._id
              return (
                <button
                  key={note._id}
                  onClick={() => handleSelectStudent(note)}
                  className={`w-full text-left px-5 py-3 transition border-l-4 ${
                    isActive
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                    {note.student.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last seen: {formatDisplay(note.lastSessionDate)}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main Notes Area ──────────────────────────────────── */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        {!selectedStudent ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-lg font-semibold">Select a student from the sidebar</p>
            <p className="text-sm mt-1">Your session notes will appear here</p>
          </div>
        ) : loadingNotes ? (
          <div className="text-center text-gray-400 py-24">
            <div className="text-5xl mb-3">⏳</div>
            <p>Loading notes...</p>
          </div>
        ) : !notes || notes.entries.length === 0 ? (
          <div className="text-center text-gray-400 py-24">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-medium">No session entries yet for {selectedStudent.student.name}</p>
            <p className="text-sm mt-1">Mark a session as complete to create the first entry</p>
          </div>
        ) : (
          <div>
            {/* Student Header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-800">
                  {selectedStudent.student.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {notes.entries.length} session{notes.entries.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={exportingAll}
                className="text-sm px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 whitespace-nowrap"
              >
                {exportingAll ? 'Exporting…' : '📄 Export Full History'}
              </button>
            </div>

            {/* Session Entries */}
            {notes.entries.map((entry) => (
              <SessionEntry
                key={entry._id}
                entry={entry}
                studentId={selectedStudent.student._id}
                token={token}
                onSaved={() => fetchStudents()}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Notebook
