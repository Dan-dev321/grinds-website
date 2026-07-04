const puppeteer = require('puppeteer')
const Note = require('../models/Note')

// ─── Shared styles for generated PDFs ─────────────────────────────────────────
const PDF_STYLES = `
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #374151;
      padding: 40px 48px;
      margin: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #1d4ed8;
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .header .meta {
      font-size: 12px;
      color: #9ca3af;
    }
    .header .exported {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }
    .entry {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .entry-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .entry-divider .line {
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
    .entry-divider .label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .entry-content {
      font-size: 13px;
      line-height: 1.7;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      background: #fafafa;
    }
    .entry-content ul {
      margin: 4px 0;
      padding-left: 20px;
    }
    .entry-content:empty::before {
      content: 'No notes recorded for this session.';
      color: #9ca3af;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      font-size: 10px;
      color: #d1d5db;
      text-align: center;
    }
  </style>
`

const formatDisplay = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const exportedOn = () =>
  new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })

const entryHTML = (entry) => `
  <div class="entry">
    <div class="entry-divider">
      <div class="line"></div>
      <span class="label">
        ${entry.dayOfWeek} — ${formatDisplay(entry.date)} · ${entry.startTime}–${entry.endTime}
      </span>
      <div class="line"></div>
    </div>
    <div class="entry-content">${entry.content || ''}</div>
  </div>
`

const buildPDFBuffer = async (html) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '0px', right: '0px' },
    })
    return buffer
  } finally {
    await browser.close()
  }
}

const sendPDF = (res, buffer, filename) => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  })
  res.send(buffer)
}

// ─── Export full session history for a student ────────────────────────────────
const exportStudentPDF = async (req, res) => {
  try {
    const note = await Note.findOne({
      tutor: req.user.id,
      student: req.params.studentId,
    }).populate('student', 'name')

    if (!note) return res.status(404).json({ message: 'No notes found for this student' })

    const entriesHTML = note.entries.length
      ? note.entries.map(entryHTML).join('')
      : `<p style="color:#9ca3af; font-style:italic;">No sessions recorded yet.</p>`

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" />${PDF_STYLES}</head>
        <body>
          <div class="header">
            <div>
              <h1>${note.student.name} — Session Notes</h1>
              <div class="meta">${note.entries.length} session${note.entries.length !== 1 ? 's' : ''} recorded</div>
            </div>
            <div class="exported">Exported ${exportedOn()}</div>
          </div>
          ${entriesHTML}
          <div class="footer">Generated automatically · Confidential</div>
        </body>
      </html>
    `

    const buffer = await buildPDFBuffer(html)
    const safeName = note.student.name.replace(/[^a-z0-9]/gi, '_')
    sendPDF(res, buffer, `${safeName}_session_notes.pdf`)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ─── Export a single session entry ─────────────────────────────────────────────
const exportEntryPDF = async (req, res) => {
  try {
    const { studentId, entryId } = req.params

    const note = await Note.findOne({
      tutor: req.user.id,
      student: studentId,
    }).populate('student', 'name')

    if (!note) return res.status(404).json({ message: 'Notebook not found' })

    const entry = note.entries.id(entryId)
    if (!entry) return res.status(404).json({ message: 'Entry not found' })

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" />${PDF_STYLES}</head>
        <body>
          <div class="header">
            <div>
              <h1>${note.student.name} — Session Note</h1>
              <div class="meta">${entry.dayOfWeek}, ${formatDisplay(entry.date)}</div>
            </div>
            <div class="exported">Exported ${exportedOn()}</div>
          </div>
          ${entryHTML(entry)}
          <div class="footer">Generated automatically · Confidential</div>
        </body>
      </html>
    `

    const buffer = await buildPDFBuffer(html)
    const safeName = note.student.name.replace(/[^a-z0-9]/gi, '_')
    sendPDF(res, buffer, `${safeName}_${entry.date}.pdf`)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = {
  exportStudentPDF,
  exportEntryPDF,
}