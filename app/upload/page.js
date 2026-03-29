'use client'
import { useState, useEffect } from 'react'

async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
      }
      return fullText.trim()
    } catch (err) {
      console.error('PDF error:', err)
      return ''
    }
  }

  if (file.type.startsWith('image/')) {
    return `[Image file: ${file.name}]`
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result || '')
    reader.onerror = () => resolve('')
    reader.readAsText(file)
  })
}

function downloadPDF(result, exam) {
  const html = `
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Prepiq Notes — ${result.subject}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; line-height: 1.6; }
        .header { border-bottom: 3px solid #6c5ce7; padding-bottom: 16px; margin-bottom: 28px; }
        .brand { font-size: 22px; font-weight: 800; color: #6c5ce7; }
        .brand span { color: #1a1a2e; }
        .meta { font-size: 12px; color: #666; margin-top: 4px; }
        h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #1a1a2e; }
        .section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #6c5ce7; margin: 28px 0 14px; border-left: 4px solid #6c5ce7; padding-left: 10px; }
        .topic { border: 1px solid #e0dff5; border-radius: 10px; margin-bottom: 18px; overflow: hidden; page-break-inside: avoid; }
        .topic-header { background: #f4f3ff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0dff5; }
        .topic-num { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; }
        .topic-title { font-weight: 700; font-size: 14px; color: #1a1a2e; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; }
        .badge-high { background: #ffe5e5; color: #d63031; }
        .badge-med { background: #fff8e1; color: #e17055; }
        .badge-low { background: #e8f5e9; color: #2d8653; }
        .examiner-tip { background: #e8fffe; border-bottom: 1px solid #b2ebf2; padding: 8px 14px; font-size: 12px; color: #00796b; }
        .tip-label { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; margin-right: 6px; }
        .answer-box { padding: 12px 14px; }
        .answer-label { font-size: 10px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .answer-content { border-left: 3px solid #6c5ce7; padding-left: 12px; }
        .definition { font-weight: 600; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ddd; }
        .point { display: flex; gap: 8px; margin-bottom: 5px; color: #444; font-size: 12px; }
        .point-num { font-weight: 700; color: #6c5ce7; flex-shrink: 0; }
        .formula { display: inline-block; background: #f4f3ff; border: 1px solid #d4d0fa; border-radius: 4px; padding: 2px 10px; font-family: monospace; font-size: 12px; color: #6c5ce7; margin: 6px 0; }
        .conclusion { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd; color: #555; font-style: italic; font-size: 12px; }
        .diagram-cue { background: #fffde7; border: 1px solid #fff176; border-radius: 6px; padding: 8px 12px; margin: 10px 14px 12px; font-size: 12px; color: #795548; }
        .diagram-label { font-size: 10px; font-weight: 700; color: #f57f17; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .question { border: 1px solid #e0dff5; border-radius: 10px; margin-bottom: 14px; overflow: hidden; page-break-inside: avoid; }
        .q-header { background: #f4f3ff; padding: 10px 14px; border-bottom: 1px solid #e0dff5; }
        .q-text { font-weight: 600; font-size: 13px; margin-top: 5px; }
        .q-reason { font-size: 11px; color: #888; }
        .q-body { padding: 12px 14px; }
        .examiner-note { background: #e8fffe; border: 1px solid #b2ebf2; border-radius: 6px; padding: 8px 12px; margin-top: 10px; font-size: 12px; color: #00796b; }
        .en-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .mistake { background: #fff5f5; border: 1px solid #ffcdd2; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; page-break-inside: avoid; }
        .mistake-topic { font-size: 10px; font-weight: 700; color: #c62828; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
        .wrong { color: #bbb; text-decoration: line-through; font-size: 12px; margin-bottom: 4px; padding-left: 8px; }
        .correct { color: #2e7d32; font-weight: 600; font-size: 12px; margin-bottom: 4px; padding-left: 8px; }
        .explanation { color: #666; font-size: 11px; padding-left: 8px; }
        .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">Prep<span>iq</span></div>
        <h1>${result.subject} — ${result.chapter}</h1>
        <div class="meta">🎯 ${exam} &nbsp;|&nbsp; ⚠️ ${result.mistakes?.length || 0} mistakes caught &nbsp;|&nbsp; Generated by Prepiq AI</div>
      </div>

      <div class="section-title">✍️ Exam Notes (${result.topics?.length || 0} Topics)</div>
      ${result.topics?.map((t, i) => `
        <div class="topic">
          <div class="topic-header">
            <div>
              <div class="topic-num">Topic ${String(i+1).padStart(2,'0')}</div>
              <div class="topic-title">${t.title}</div>
            </div>
            <span class="badge ${t.examFrequency === 'High' ? 'badge-high' : t.examFrequency === 'Medium' ? 'badge-med' : 'badge-low'}">
              ${t.examFrequency} Priority
            </span>
          </div>
          ${t.examinerTip ? `<div class="examiner-tip"><span class="tip-label">🎓 Examiner Expects</span>${t.examinerTip}</div>` : ''}
          <div class="answer-box">
            <div class="answer-label">✍️ Write This in Your Exam</div>
            <div class="answer-content">
              ${t.idealAnswer?.definition ? `<div class="definition">${t.idealAnswer.definition}</div>` : ''}
              ${t.idealAnswer?.points?.map((p, j) => `<div class="point"><span class="point-num">${j+1}.</span><span>${p}</span></div>`).join('') || ''}
              ${t.idealAnswer?.formula ? `<div class="formula">📐 ${t.idealAnswer.formula}</div>` : ''}
              ${t.idealAnswer?.conclusion ? `<div class="conclusion">${t.idealAnswer.conclusion}</div>` : ''}
            </div>
          </div>
          ${t.diagramCue ? `<div class="diagram-cue"><div class="diagram-label">✏️ Draw This Diagram</div>${t.diagramCue}</div>` : ''}
        </div>
      `).join('') || ''}

      <div class="section-title">🎯 Important Questions (${result.questions?.length || 0})</div>
      ${result.questions?.map((q, i) => `
        <div class="question">
          <div class="q-header">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
              <span class="badge ${q.priority === 'High' ? 'badge-high' : q.priority === 'Medium' ? 'badge-med' : 'badge-low'}">${q.priority}</span>
              <span class="q-reason">${q.reason}</span>
            </div>
            <div class="q-text">Q${i+1}. ${q.q}</div>
          </div>
          <div class="q-body">
            <div class="answer-label">✍️ Model Answer</div>
            <div class="answer-content">
              ${q.modelAnswer?.definition ? `<div class="definition">${q.modelAnswer.definition}</div>` : ''}
              ${q.modelAnswer?.points?.map((p, j) => `<div class="point"><span class="point-num">${j+1}.</span><span>${p}</span></div>`).join('') || ''}
              ${q.modelAnswer?.formula ? `<div class="formula">📐 ${q.modelAnswer.formula}</div>` : ''}
              ${q.modelAnswer?.conclusion ? `<div class="conclusion">${q.modelAnswer.conclusion}</div>` : ''}
            </div>
            ${q.examinerNote ? `<div class="examiner-note"><div class="en-label">🎓 Examiner Checks</div>${q.examinerNote}</div>` : ''}
          </div>
        </div>
      `).join('') || ''}

      <div class="section-title">⚠️ Common Mistakes (${result.mistakes?.length || 0})</div>
      ${result.mistakes?.length === 0
        ? '<p style="color:#2e7d32;font-size:13px;">✅ No mistakes found!</p>'
        : result.mistakes?.map(m => `
          <div class="mistake">
            <div class="mistake-topic">⚠️ ${m.topic}</div>
            <div class="wrong">✗ ${m.wrong}</div>
            <div class="correct">✓ ${m.correct}</div>
            <div class="explanation">${m.explanation}</div>
          </div>
        `).join('') || ''
      }

      <div class="footer">Generated by Prepiq AI &nbsp;•&nbsp; prepiq.in &nbsp;•&nbsp; Exam-ready notes in seconds</div>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  setTimeout(() => {
    win.print()
    URL.revokeObjectURL(url)
  }, 800)
}

export default function Upload() {
  const [noteFiles, setNoteFiles] = useState([])
  const [sylFile, setSylFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('notes')
  const [exam, setExam] = useState('JEE Advanced')
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('prepiq_exam')
    if (saved) setExam(saved)
  }, [])

  function handleNotes(e) {
    const files = Array.from(e.target.files)
    setNoteFiles(prev => [...prev, ...files])
  }

  function handleSyl(e) {
    setSylFile(e.target.files[0])
  }

  function removeNote(name) {
    setNoteFiles(prev => prev.filter(f => f.name !== name))
  }

  async function generate() {
  if (noteFiles.length === 0) return
  setLoading(true)
  setResult(null)
  setError(null)

  try {
    const formData = new FormData()
    formData.append('exam', exam)

    for (const file of noteFiles) {
      formData.append('notes', file)
    }

    if (sylFile) {
      formData.append('syllabus', sylFile)
    }

    const res = await fetch('/api/process', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    if (data.success) {
      setResult(data.data)
    } else {
      setError(data.error || 'Something went wrong. Please try again.')
    }
  } catch (err) {
    console.error(err)
    setError(err.message || 'Unexpected error. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <main style={{
      minHeight: '100vh',
      background: '#05050a',
      color: '#f0eeff',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.85rem 1.5rem',
        background: '#0d0d15',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.05em' }}>
          Prep<span style={{ color: '#a29bfe' }}>iq</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Upload Your Material</span>
        <span style={{
          marginLeft: '0.5rem',
          background: 'rgba(108,92,231,0.12)',
          border: '1px solid rgba(108,92,231,0.25)',
          color: '#a29bfe',
          fontSize: '0.63rem',
          fontWeight: '700',
          padding: '0.2rem 0.55rem',
          borderRadius: '100px'
        }}>
          🎯 {exam}
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        minHeight: 0
      }}>

        {/* Left Controls */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: '#0d0d15',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto'
        }}>

          <div style={{
            background: 'rgba(108,92,231,0.1)',
            border: '1px solid rgba(108,92,231,0.2)',
            borderRadius: '12px',
            padding: '0.9rem 1rem'
          }}>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
              Here's what to do 👇
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.55' }}>
              Upload whatever you have — messy, incomplete, PPT, PDF, anything. Add your syllabus if you have it. Then generate.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.38rem' }}>
              📑 Notes / PPT / PDF *
            </div>
            <label style={{
              display: 'block',
              border: '2px dashed rgba(108,92,231,0.3)',
              borderRadius: '12px',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(108,92,231,0.03)'
            }}>
              <input type="file" multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg"
                onChange={handleNotes}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📑</div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.22rem' }}>
                Drop files or click to upload
              </div>
              <div style={{ fontSize: '0.71rem', color: 'rgba(240,238,255,0.38)' }}>
                PDF, PPT, Word, TXT — anything works
              </div>
            </label>
          </div>

          {noteFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)' }}>
                Files ready — {noteFiles.length}
              </div>
              {noteFiles.map(f => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#13131e',
                  border: '1px solid rgba(108,92,231,0.25)',
                  borderRadius: '8px', padding: '0.48rem 0.65rem'
                }}>
                  <span>{f.name.endsWith('.pdf') ? '📕' : '📄'}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </span>
                  <button onClick={() => removeNote(f.name)}
                    style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.38)', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.38rem' }}>
              📋 Syllabus (optional)
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              border: '1.5px dashed rgba(0,206,201,0.25)',
              borderRadius: '10px', padding: '0.85rem 1rem',
              cursor: 'pointer',
              background: sylFile ? 'rgba(0,206,201,0.07)' : 'rgba(0,206,201,0.03)'
            }}>
              <input type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                onChange={handleSyl}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.1rem' }}>
                  {sylFile ? sylFile.name : 'Upload Syllabus'}
                </div>
                <div style={{ fontSize: '0.68rem', color: sylFile ? '#00cec9' : 'rgba(240,238,255,0.38)' }}>
                  {sylFile ? '✅ Uploaded!' : "Don't have it? No problem."}
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,118,117,0.1)',
              border: '1px solid rgba(255,118,117,0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontSize: '0.78rem',
              color: '#ff7675',
              lineHeight: '1.5'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={noteFiles.length === 0 || loading}
            style={{
              width: '100%',
              background: noteFiles.length > 0 && !loading
                ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)'
                : 'rgba(255,255,255,0.1)',
              color: 'white', border: 'none',
              borderRadius: '10px', padding: '0.85rem',
              fontWeight: '700', fontSize: '0.95rem',
              cursor: noteFiles.length > 0 && !loading ? 'pointer' : 'not-allowed',
              opacity: noteFiles.length > 0 && !loading ? 1 : 0.5
            }}
          >
            {loading ? '⏳ Processing...' : '⚡ Get Exam-Ready Notes'}
          </button>

        </div>

        {/* Right Output */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {!loading && !result && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '2.5rem', gap: '1rem',
              color: 'rgba(240,238,255,0.38)'
            }}>
              <div style={{ fontSize: '3.5rem', opacity: '0.2' }}>📖</div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'rgba(240,238,255,0.6)' }}>
                Your output will appear here
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.65', maxWidth: '300px' }}>
                Upload your notes and generate — every topic's ideal exam answer will be ready
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '1.2rem', padding: '2rem', textAlign: 'center'
            }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'rgba(240,238,255,0.6)' }}>
                Building your exam-ready notes…
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(240,238,255,0.38)' }}>
                This takes about 20–30 seconds
              </div>
              {['📖 Reading your material', '📋 Checking against syllabus', '🔍 Finding mistakes', '✍️ Writing ideal exam answers', '🎯 Generating questions', '💡 Adding examiner tips'].map((step, i) => (
                <div key={i} style={{
                  padding: '0.55rem 0.9rem',
                  background: 'rgba(108,92,231,0.1)',
                  borderRadius: '8px', fontSize: '0.79rem',
                  color: '#a29bfe', width: '100%', maxWidth: '340px'
                }}>
                  {step}
                </div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

              <div style={{
                padding: '0.85rem 1.2rem',
                background: '#0d0d15',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: '0.8rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                    {result.subject} — {result.chapter}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.42rem', borderRadius: '100px', background: 'rgba(108,92,231,0.12)', color: '#a29bfe' }}>
                      🎯 {exam}
                    </span>
                    <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.42rem', borderRadius: '100px', background: 'rgba(255,118,117,0.1)', color: '#ff7675' }}>
                      ⚠️ {result.mistakes?.length || 0} mistakes
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => downloadPDF(result, exam)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)',
                    color: 'white', border: 'none',
                    borderRadius: '8px', padding: '0.5rem 1rem',
                    fontWeight: '700', fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  ⬇️ Download PDF
                </button>
              </div>

              <div style={{
                display: 'flex',
                background: '#0d0d15',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '0 1.1rem'
              }}>
                {[
                  { id: 'notes', label: `✍️ Exam Notes (${result.topics?.length || 0})` },
                  { id: 'qs', label: `🎯 Questions (${result.questions?.length || 0})` },
                  { id: 'mistakes', label: `⚠️ Mistakes (${result.mistakes?.length || 0})` },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.77rem', fontWeight: '600',
                      color: activeTab === tab.id ? '#a29bfe' : 'rgba(240,238,255,0.38)',
                      borderBottom: activeTab === tab.id ? '2px solid #6c5ce7' : '2px solid transparent',
                      background: 'none', border: 'none',
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.3rem' }}>

                {activeTab === 'notes' && (
                  <div>
                    {result.topics?.map((t, i) => (
                      <div key={i} style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', marginBottom: '1rem', overflow: 'hidden' }}>
                        <div style={{ padding: '0.85rem 1.1rem', background: '#13131e', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(240,238,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Topic {String(i + 1).padStart(2, '0')}</div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t.title}</div>
                          </div>
                          <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '100px', background: t.examFrequency === 'High' ? 'rgba(255,118,117,0.15)' : 'rgba(253,203,110,0.15)', color: t.examFrequency === 'High' ? '#ff7675' : '#fdcb6e' }}>
                            {t.examFrequency} Priority
                          </span>
                        </div>
                        {t.examinerTip && (
                          <div style={{ padding: '0.65rem 1.1rem', background: 'rgba(0,206,201,0.05)', borderBottom: '1px solid rgba(0,206,201,0.1)', fontSize: '0.77rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.55' }}>
                            <span style={{ fontWeight: '700', color: '#00cec9', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '0.5rem' }}>🎓 Examiner Expects</span>
                            {t.examinerTip}
                          </div>
                        )}
                        <div style={{ padding: '1rem 1.1rem' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>✍️ Write This in Your Exam</div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.95rem 1rem 0.95rem 1.3rem', fontSize: '0.83rem', lineHeight: '1.85', borderLeft: '3px solid #6c5ce7' }}>
                            {t.idealAnswer?.definition && <div style={{ fontWeight: '600', marginBottom: '0.55rem', paddingBottom: '0.45rem', borderBottom: '1px dashed rgba(255,255,255,0.07)' }}>{t.idealAnswer.definition}</div>}
                            {t.idealAnswer?.points?.map((p, j) => (
                              <div key={j} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.28rem', color: 'rgba(240,238,255,0.6)', fontSize: '0.82rem' }}>
                                <span style={{ fontWeight: '700', color: '#a29bfe', flexShrink: 0 }}>{j + 1}.</span>
                                <span>{p}</span>
                              </div>
                            ))}
                            {t.idealAnswer?.formula && <div style={{ display: 'inline-block', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: '5px', padding: '0.18rem 0.6rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#a29bfe', margin: '0.3rem 0' }}>📐 {t.idealAnswer.formula}</div>}
                            {t.idealAnswer?.conclusion && <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed rgba(255,255,255,0.07)', color: 'rgba(240,238,255,0.6)', fontStyle: 'italic', fontSize: '0.8rem' }}>{t.idealAnswer.conclusion}</div>}
                          </div>
                          {t.diagramCue && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: 'rgba(253,203,110,0.05)', border: '1px solid rgba(253,203,110,0.15)', borderRadius: '8px', padding: '0.7rem 0.9rem', marginTop: '0.8rem' }}>
                              <span>✏️</span>
                              <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#fdcb6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem' }}>Draw This Diagram</div>
                                <div style={{ fontSize: '0.77rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.5' }}>{t.diagramCue}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'qs' && (
                  <div>
                    {result.questions?.map((q, i) => (
                      <div key={i} style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', marginBottom: '0.85rem', overflow: 'hidden' }}>
                        <div style={{ padding: '0.85rem 1.1rem', background: '#13131e', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '100px', background: q.priority === 'High' ? 'rgba(255,118,117,0.15)' : 'rgba(253,203,110,0.15)', color: q.priority === 'High' ? '#ff7675' : '#fdcb6e' }}>{q.priority}</span>
                            <span style={{ fontSize: '0.63rem', color: 'rgba(240,238,255,0.38)' }}>{q.reason}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: '1.55' }}>Q{i + 1}. {q.q}</div>
                        </div>
                        <div style={{ padding: '0.9rem 1.1rem' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.55rem' }}>✍️ Model Answer</div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.9rem 1rem 0.9rem 1.25rem', fontSize: '0.82rem', lineHeight: '1.82', borderLeft: '3px solid #6c5ce7' }}>
                            {q.modelAnswer?.definition && <div style={{ fontWeight: '600', marginBottom: '0.5rem', paddingBottom: '0.45rem', borderBottom: '1px dashed rgba(255,255,255,0.07)' }}>{q.modelAnswer.definition}</div>}
                            {q.modelAnswer?.points?.map((p, j) => (
                              <div key={j} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.28rem', color: 'rgba(240,238,255,0.6)', fontSize: '0.81rem' }}>
                                <span style={{ fontWeight: '700', color: '#a29bfe', flexShrink: 0 }}>{j + 1}.</span>
                                <span>{p}</span>
                              </div>
                            ))}
                            {q.modelAnswer?.formula && <div style={{ display: 'inline-block', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: '5px', padding: '0.18rem 0.6rem', fontFamily: 'monospace', fontSize: '0.81rem', color: '#a29bfe', margin: '0.3rem 0' }}>📐 {q.modelAnswer.formula}</div>}
                            {q.modelAnswer?.conclusion && <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed rgba(255,255,255,0.07)', color: 'rgba(240,238,255,0.6)', fontStyle: 'italic', fontSize: '0.79rem' }}>{q.modelAnswer.conclusion}</div>}
                          </div>
                          {q.examinerNote && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.1)', borderRadius: '7px', padding: '0.55rem 0.75rem', marginTop: '0.65rem' }}>
                              <div>
                                <div style={{ fontSize: '0.58rem', fontWeight: '700', color: '#00cec9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.12rem' }}>🎓 Examiner Checks</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.5' }}>{q.examinerNote}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'mistakes' && (
                  <div>
                    {result.mistakes?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#00cec9', fontSize: '0.85rem' }}>✅ No mistakes found!</div>
                    ) : (
                      result.mistakes?.map((m, i) => (
                        <div key={i} style={{ background: 'rgba(255,118,117,0.08)', border: '1px solid rgba(255,118,117,0.18)', borderRadius: '10px', padding: '0.9rem', marginBottom: '0.7rem' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#ff7675', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.28rem' }}>⚠️ {m.topic}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.32)', textDecoration: 'line-through', marginBottom: '0.2rem', paddingLeft: '0.5rem' }}>✗ {m.wrong}</div>
                          <div style={{ fontSize: '0.8rem', color: '#00cec9', fontWeight: '600', marginBottom: '0.22rem', paddingLeft: '0.5rem' }}>✓ {m.correct}</div>
                          <div style={{ fontSize: '0.74rem', color: 'rgba(240,238,255,0.38)', lineHeight: '1.52', paddingLeft: '0.5rem' }}>{m.explanation}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}