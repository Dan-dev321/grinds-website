import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import TopicPanel from '../components/TopicPanel'

const API = import.meta.env.VITE_API_URL

const formatDisplay = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

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

const stripHTML = (html) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html || ''
  return tmp.textContent || tmp.innerText || ''
}

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

const AVATAR_COLOURS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]
const avatarColour = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

const HIGHLIGHTS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Pink',   value: '#fbcfe8' },
  { label: 'Blue',   value: '#bfdbfe' },
]

// ─── Preset tags — tutor can also add their own custom tags alongside these ───
const PRESET_TAGS = ['Homework', 'Test Prep', 'Struggled', 'Went Well', 'Homework Completed']

// Deterministic colour per tag (so a given tag always looks the same)
const TAG_COLOURS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
]
const tagColour = (tag = '') => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLOURS[Math.abs(hash) % TAG_COLOURS.length]
}

const Toolbar = ({ onBold, onBullet, onHighlight, onClearHighlight }) => {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 mb-2 relative">
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

      <div className="relative">
        <button
          onMouseDown={(e) => { e.preventDefault(); setPickerOpen(o => !o) }}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition flex items-center gap-1.5"
          title="Highlight"
        >
          🖍️ Highlight
        </button>
        {pickerOpen && (
          <div className="absolute z-10 top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-md p-2 flex gap-1.5">
            {HIGHLIGHTS.map(h => (
              <button
                key={h.value}
                onMouseDown={(e) => { e.preventDefault(); onHighlight(h.value); setPickerOpen(false) }}
                title={h.label}
                className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: h.value }}
              />
            ))}
            <button
              onMouseDown={(e) => { e.preventDefault(); onClearHighlight(); setPickerOpen(false) }}
              title="Remove highlight"
              className="w-6 h-6 rounded-full border border-gray-300 bg-white text-gray-400 text-xs flex items-center justify-center hover:bg-gray-50"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tag picker: preset chips + custom input ──────────────────────────────────
const TagEditor = ({ tags, onChange }) => {
  const [customInput, setCustomInput] = useState('')

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      onChange(tags.filter(t => t !== tag))
    } else {
      onChange([...tags, tag])
    }
  }

  const addCustomTag = () => {
    const trimmed = customInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setCustomInput('')
  }

  const customTags = tags.filter(t => !PRESET_TAGS.includes(t))

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {PRESET_TAGS.map(tag => {
          const active = tags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                active ? tagColour(tag) : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tag}
            </button>
          )
        })}
        {customTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${tagColour(tag)}`}
          >
            {tag} <span className="text-[10px]">✕</span>
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
          placeholder="+ Custom tag"
          className="text-xs px-2.5 py-1 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400 w-32"
        />
        {customInput.trim() && (
          <button
            onClick={addCustomTag}
            className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

const SessionEntry = ({ entry, studentId, token, onSaved, defaultExpanded }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [tags, setTags]         = useState(entry.tags || [])
  const [pinned, setPinned]     = useState(entry.pinned || false)
  const [pinning, setPinning]   = useState(false)
  const [topicsCovered, setTopicsCovered] = useState(entry.topicsCovered || [])
  const editorRef               = useRef(null)

  const handleBold = () => {
    document.execCommand('bold', false, null)
    editorRef.current?.focus()
  }

  const handleBullet = () => {
    document.execCommand('insertUnorderedList', false, null)
    editorRef.current?.focus()
  }

  const handleHighlight = (colour) => {
    document.execCommand('hiliteColor', false, colour)
    editorRef.current?.focus()
  }

  const handleClearHighlight = () => {
    document.execCommand('hiliteColor', false, 'transparent')
    editorRef.current?.focus()
  }

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || ''
    try {
      setSaving(true)
      await axios.put(
        `${API}/api/notes/student/${studentId}/entry/${entry._id}`,
        { content, tags },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (onSaved) onSaved(entry._id, { content, tags })
    } catch (err) {
      console.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  // Pin toggles immediately on click — it's a quick status flag, not part of
  // the main "Save Notes" flow, so it shouldn't require an explicit save click.
  const handleTogglePin = async () => {
    const newPinned = !pinned
    setPinned(newPinned)
    try {
      setPinning(true)
      await axios.put(
        `${API}/api/notes/student/${studentId}/entry/${entry._id}`,
        { pinned: newPinned },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (onSaved) onSaved(entry._id, { pinned: newPinned })
    } catch (err) {
      console.error('Failed to update pin')
      setPinned(!newPinned) // revert on failure
    } finally {
      setPinning(false)
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

  const previewText = stripHTML(entry.content).trim()

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`w-full text-left mb-2 px-4 py-3 rounded-xl border bg-white hover:bg-blue-50/40 transition flex items-center justify-between gap-4 group ${
          pinned ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100 hover:border-blue-200'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {pinned && <span className="shrink-0 text-sm" title="Pinned">📌</span>}
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap shrink-0">
            {formatDisplay(entry.date)}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {entry.startTime}–{entry.endTime}
          </span>
          {tags.length > 0 && (
            <div className="flex gap-1 shrink-0">
              {tags.slice(0, 2).map(tag => (
                <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${tagColour(tag)}`}>
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[10px] text-gray-400 font-semibold">+{tags.length - 2}</span>
              )}
            </div>
          )}
          {topicsCovered.length > 0 && (
            <span className="text-[10px] text-gray-400 font-semibold shrink-0" title="Topics covered">
              📚 {topicsCovered.length}
            </span>
          )}
          <span className="text-sm text-gray-500 truncate">
            {previewText || <span className="italic text-gray-300">No notes yet</span>}
          </span>
        </div>
        <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition shrink-0">
          Expand →
        </span>
      </button>
    )
  }

  return (
    <div className={`mb-4 border rounded-xl p-4 bg-white ${pinned ? 'border-amber-300' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePin}
            disabled={pinning}
            title={pinned ? 'Unpin this entry' : 'Pin this entry'}
            className={`text-sm transition ${pinned ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
          >
            📌
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {entry.dayOfWeek} — {formatDisplay(entry.date)} · {entry.startTime}–{entry.endTime}
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          Collapse ▲
        </button>
      </div>

      {/* Row starts at the tags/topics level — topic panel's top now aligns
          with TagEditor instead of the toolbar, making it visually taller. */}
      <div className="flex flex-col lg:flex-row gap-6 mb-2 items-stretch">
        <div className="lg:grow lg:basis-3/5 min-w-0 flex flex-col">
          <TagEditor tags={tags} onChange={setTags} />

          <Toolbar
            onBold={handleBold}
            onBullet={handleBullet}
            onHighlight={handleHighlight}
            onClearHighlight={handleClearHighlight}
          />
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: entry.content || '' }}
            className="min-h-[160px] w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            style={{ lineHeight: '1.7' }}
          />
        </div>

        <div className="lg:grow lg:basis-2/5 w-full shrink-0 bg-gray-50 rounded-2xl p-1 flex flex-col lg:min-w-[380px]">
          <TopicPanel
            studentId={studentId}
            entryId={entry._id}
            token={token}
            topicsCovered={topicsCovered}
            onChange={setTopicsCovered}
          />
        </div>
      </div>

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

const Notebook = () => {
  const { user, token } = useAuth()
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const [students, setStudents]         = useState([])
  const [selectedStudent, setSelected]  = useState(null)
  const [notes, setNotes]               = useState(null)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)

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

  // Merges whatever changed (content, tags, pinned — any subset) into local state.
  const handleEntrySaved = (entryId, changes) => {
    setNotes(prev => {
      if (!prev) return prev
      return {
        ...prev,
        entries: prev.entries.map(e =>
          e._id === entryId ? { ...e, ...changes } : e
        ),
      }
    })
    fetchStudents()
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

  // Entries come back from the backend newest-first (completeSession uses
  // unshift), so the most recent entry is entries[0], not the last one.
  // Pinned entries are shown first (in their existing relative order),
  // followed by everything else in original (newest-first) order.
  const rawEntries = notes?.entries || []
  const pinnedEntries = rawEntries.filter(e => e.pinned)
  const unpinnedEntries = rawEntries.filter(e => !e.pinned)
  const sortedEntries = [...pinnedEntries, ...unpinnedEntries]
  const mostRecentId = rawEntries.length > 0 ? rawEntries[0]._id : null

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <aside className="w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <h2 className="text-lg font-extrabold text-gray-800">📓 Notebook</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your students</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingStudents ? (
            <p className="text-xs text-gray-400 px-5 py-3">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-xs text-gray-400 px-5 py-3">
              No students yet — complete a session to get started!
            </p>
          ) : (
            students.map((note, i) => {
              const isActive = selectedStudent?.student._id === note.student._id
              return (
                <button
                  key={note._id}
                  onClick={() => handleSelectStudent(note)}
                  className={`w-full text-left px-4 py-3.5 transition flex items-center gap-3 ${
                    i !== 0 ? 'border-t border-gray-100' : ''
                  } ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-l-blue-700 pl-3'
                      : 'border-l-4 border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColour(note.student.name)}`}>
                    {getInitials(note.student.name)}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                      {note.student.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Last seen: {formatDisplay(note.lastSessionDate)}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

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
          <div className="max-w-6xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-800">
                  {selectedStudent.student.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {notes.entries.length} session{notes.entries.length !== 1 ? 's' : ''} recorded
                  {pinnedEntries.length > 0 && ` · ${pinnedEntries.length} pinned`}
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

            {sortedEntries.map((entry) => (
              <SessionEntry
                key={entry._id}
                entry={entry}
                studentId={selectedStudent.student._id}
                token={token}
                onSaved={handleEntrySaved}
                defaultExpanded={entry._id === mostRecentId || entry.pinned}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Notebook