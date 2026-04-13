'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────
function downloadPDF(result, exam, mode) {
  const modeLabel = { 'exam-notes': 'Exam Notes', 'mcq': 'MCQ Practice', 'last-minute': 'Last Minute Notes', 'quick-revision': 'Quick Revision', 'pyq': 'PYQ Analysis' }[mode] || 'Notes'
  let bodyHTML = ''
  if (mode === 'exam-notes') {
    if (result.poems) {
      bodyHTML = `
        <div class="section-title">📖 Poetry Analysis (${result.poems?.length || 0} Poems)</div>
        ${result.poems?.map((poem, pi) => `
          <div class="topic">
            <div class="topic-header">
              <div><div class="topic-num">Poem ${String(pi+1).padStart(2,'0')}</div><div class="topic-title">${poem.title}</div><div style="font-size:11px;color:#888">by ${poem.poet}</div></div>
              <span class="badge ${poem.examFrequency === 'High' ? 'badge-high' : 'badge-med'}">${poem.examFrequency}</span>
            </div>
            ${poem.examinerTip ? `<div class="examiner-tip"><span class="tip-label">🎓 Examiner</span>${poem.examinerTip}</div>` : ''}
            <div class="answer-box">
              <div class="answer-label">📖 Overview</div>
              <div class="answer-content">
                <div class="definition">Theme: ${poem.overview?.theme}</div>
                <div class="point"><span class="point-num">Tone:</span><span>${poem.overview?.tone}</span></div>
                <div class="point"><span class="point-num">Rhyme:</span><span>${poem.overview?.rhymeScheme}</span></div>
              </div>
            </div>
            ${poem.poeticDevices?.length ? `<div class="answer-box"><div class="answer-label">🎭 Poetic Devices</div>${poem.poeticDevices.map(d => `<div class="point"><span class="point-num">${d.device}:</span><span>"${d.line}" — ${d.effect}</span></div>`).join('')}</div>` : ''}
            ${poem.importantLines?.length ? `<div class="answer-box"><div class="answer-label">⭐ Important Lines</div>${poem.importantLines.map(l => `<div class="point"><span class="point-num">📌</span><span>"${l.line}" — ${l.meaning}</span></div>`).join('')}</div>` : ''}
            ${poem.examQuestions?.length ? `<div class="answer-box"><div class="answer-label">🎯 Exam Questions</div>${poem.examQuestions.map((q,qi) => `<div class="question"><div class="q-header"><div class="q-text">Q${qi+1}. ${q.q} (${q.marks} marks)</div></div><div class="q-body"><div class="answer-content">${q.modelAnswer}</div></div></div>`).join('')}</div>` : ''}
          </div>
        `).join('') || ''}
      `
    } else if (result.passages) {
      bodyHTML = `
        <div class="section-title">📖 Prose Analysis (${result.passages?.length || 0} Passages)</div>
        ${result.passages?.map((p, pi) => `
          <div class="topic">
            <div class="topic-header">
              <div><div class="topic-num">Passage ${String(pi+1).padStart(2,'0')}</div><div class="topic-title">${p.title}</div><div style="font-size:11px;color:#888">by ${p.author}</div></div>
              <span class="badge ${p.examFrequency === 'High' ? 'badge-high' : 'badge-med'}">${p.examFrequency}</span>
            </div>
            ${p.examinerTip ? `<div class="examiner-tip"><span class="tip-label">🎓 Examiner</span>${p.examinerTip}</div>` : ''}
            <div class="answer-box">
              <div class="answer-label">📖 Overview</div>
              <div class="answer-content">
                <div class="definition">Theme: ${p.overview?.theme}</div>
                <div class="point"><span class="point-num">Tone:</span><span>${p.overview?.tone}</span></div>
                <div class="point"><span class="point-num">Setting:</span><span>${p.overview?.setting}</span></div>
                <div class="conclusion">${p.overview?.authorMessage}</div>
              </div>
            </div>
            ${p.characters?.length ? `<div class="answer-box"><div class="answer-label">👥 Characters</div>${p.characters.map(c => `<div class="point"><span class="point-num">${c.name} (${c.role}):</span><span>${c.traits?.join(', ')}</span></div>`).join('')}</div>` : ''}
            ${p.importantQuotes?.length ? `<div class="answer-box"><div class="answer-label">⭐ Important Quotes</div>${p.importantQuotes.map(q => `<div class="point"><span class="point-num">📌</span><span>"${q.quote}" — ${q.significance}</span></div>`).join('')}</div>` : ''}
            ${p.examQuestions?.length ? `<div class="answer-box"><div class="answer-label">🎯 Exam Questions</div>${p.examQuestions.map((q,qi) => `<div class="question"><div class="q-header"><div class="q-text">Q${qi+1}. ${q.q} (${q.marks} marks)</div></div><div class="q-body"><div class="answer-content">${q.modelAnswer}</div></div></div>`).join('')}</div>` : ''}
          </div>
        `).join('') || ''}
      `
    } else {
      bodyHTML = `
        <div class="section-title">✍️ Exam Notes (${result.topics?.length || 0} Topics)</div>
        ${result.topics?.map((t, i) => `
          <div class="topic">
            <div class="topic-header">
              <div><div class="topic-num">Topic ${String(i+1).padStart(2,'0')}</div><div class="topic-title">${t.title}</div></div>
              <span class="badge ${t.examFrequency === 'High' ? 'badge-high' : t.examFrequency === 'Medium' ? 'badge-med' : 'badge-low'}">${t.examFrequency} Priority</span>
            </div>
            ${t.examinerTip ? `<div class="examiner-tip"><span class="tip-label">🎓 Examiner Expects</span>${t.examinerTip}</div>` : ''}
            <div class="answer-box">
              <div class="answer-label">✍️ Write This in Your Exam</div>
              <div class="answer-content">
                ${t.idealAnswer?.definition ? `<div class="definition">${t.idealAnswer.definition}</div>` : ''}
                ${Array.isArray(t.idealAnswer?.points) ? t.idealAnswer.points.map((p, j) => `<div class="point"><span class="point-num">${j+1}.</span><span>${p}</span></div>`).join('') : t.idealAnswer?.points ? `<div class="point"><span>${t.idealAnswer.points}</span></div>` : ''}
                ${t.idealAnswer?.formula ? `<div class="formula">📐 ${t.idealAnswer.formula}</div>` : ''}
                ${t.idealAnswer?.conclusion ? `<div class="conclusion">${t.idealAnswer.conclusion}</div>` : ''}
              </div>
            </div>
            ${t.diagramCue ? `<div class="diagram-cue"><div class="diagram-label">✏️ Draw This</div>${t.diagramCue}</div>` : ''}
          </div>
        `).join('') || ''}
        <div class="section-title">🎯 Important Questions (${result.questions?.length || 0})</div>
        ${result.questions?.map((q, i) => `
          <div class="question">
            <div class="q-header"><span class="badge ${q.priority === 'High' ? 'badge-high' : 'badge-med'}">${q.priority}</span><div class="q-text">Q${i+1}. ${q.q}</div></div>
            <div class="q-body"><div class="answer-content">
              ${q.modelAnswer?.definition ? `<div class="definition">${q.modelAnswer.definition}</div>` : ''}
              ${Array.isArray(q.modelAnswer?.points) ? q.modelAnswer.points.map((p, j) => `<div class="point"><span class="point-num">${j+1}.</span><span>${p}</span></div>`).join('') : q.modelAnswer?.points ? `<div class="point"><span>${q.modelAnswer.points}</span></div>` : ''}
              ${q.modelAnswer?.conclusion ? `<div class="conclusion">${q.modelAnswer.conclusion}</div>` : ''}
            </div></div>
          </div>
        `).join('') || ''}
        <div class="section-title">⚠️ Mistakes (${result.mistakes?.length || 0})</div>
        ${result.mistakes?.length === 0 ? '<p style="color:#2e7d32">✅ No mistakes found!</p>' : result.mistakes?.map(m => `
          <div class="mistake"><div class="mistake-topic">⚠️ ${m.topic}</div><div class="wrong">✗ ${m.wrong}</div><div class="correct">✓ ${m.correct}</div><div class="explanation">${m.explanation}</div></div>
        `).join('') || ''}
      `
    }
  } else if (mode === 'mcq') {
    bodyHTML = `
      <div class="section-title">📝 MCQ Practice (${result.mcqs?.length || 0} Questions)</div>
      ${result.mcqs?.map((q, i) => `
        <div class="topic">
          <div class="topic-header"><div><div class="topic-num">Q${i+1} · ${q.topic}</div><div class="topic-title">${q.question}</div></div><span class="badge ${q.difficulty === 'Hard' ? 'badge-high' : q.difficulty === 'Medium' ? 'badge-med' : 'badge-low'}">${q.difficulty}</span></div>
          <div class="answer-box">
            ${['A','B','C','D'].map(opt => `<div style="display:flex;gap:10px;margin-bottom:6px;${opt === q.correct ? 'color:#2e7d32;font-weight:600' : 'color:#555'}"><span style="font-weight:700;min-width:20px">${opt}.</span><span>${q.options[opt]}</span>${opt === q.correct ? '<span style="margin-left:auto">✓</span>' : ''}</div>`).join('')}
            <div class="examiner-tip" style="margin-top:8px"><span class="tip-label">💡 Explanation</span>${q.explanation}</div>
          </div>
        </div>
      `).join('') || ''}
    `
  } else if (mode === 'last-minute') {
    bodyHTML = `
      <div class="section-title">⚡ Last Minute Notes (${result.topics?.length || 0} Topics)</div>
      ${result.topics?.map((t, i) => `
        <div class="topic">
          <div class="topic-header"><div><div class="topic-num">Topic ${String(i+1).padStart(2,'0')} · ${t.examFrequency} Priority</div><div class="topic-title">${t.title}</div></div></div>
          <div class="answer-box">
            <div class="definition">${t.mustKnow}</div>
            ${t.keyPoints?.map(p => `<div class="point"><span class="point-num">→</span><span>${p}</span></div>`).join('') || ''}
            ${t.formula ? `<div class="formula">📐 ${t.formula}</div>` : ''}
            ${t.memoryTrick ? `<div class="examiner-tip" style="margin-top:8px"><span class="tip-label">🧠 Trick</span>${t.memoryTrick}</div>` : ''}
          </div>
        </div>
      `).join('') || ''}
      ${result.quickFacts?.length ? `<div class="section-title">⚡ Quick Facts</div>${result.quickFacts.map(f => `<div class="point" style="margin-bottom:4px"><span class="point-num">•</span><span>${f}</span></div>`).join('')}` : ''}
      ${result.doNotForget?.length ? `<div class="section-title">🚫 Don't Forget</div>${result.doNotForget.map(f => `<div class="mistake" style="padding:8px 12px;margin-bottom:6px"><span>⚠️ ${f}</span></div>`).join('')}` : ''}
    `
  } else if (mode === 'quick-revision') {
    bodyHTML = `
      <div class="section-title">🃏 Flashcards (${result.flashcards?.length || 0})</div>
      ${result.flashcards?.map((f) => `<div class="topic" style="margin-bottom:10px"><div class="topic-header"><div class="topic-title">Q: ${f.front}</div></div><div class="answer-box"><div class="definition">A: ${f.back}</div></div></div>`).join('') || ''}
      ${result.oneLiners?.length ? `<div class="section-title">💡 One-Liners</div>${result.oneLiners.map(o => `<div class="point" style="margin-bottom:5px"><span class="point-num" style="min-width:140px;flex-shrink:0">${o.concept}:</span><span>${o.oneLiner}</span></div>`).join('')}` : ''}
      ${result.formulas?.length ? `<div class="section-title">📐 Formulas</div>${result.formulas.map(f => `<div class="topic"><div class="topic-header"><div class="topic-title">${f.name}</div></div><div class="answer-box"><div class="formula">📐 ${f.formula}</div><div class="conclusion" style="margin-top:6px">${f.usedFor}</div></div></div>`).join('')}` : ''}
    `
  } else if (mode === 'pyq') {
    bodyHTML = `
      ${result.paperInsights ? `<div class="section-title">📊 Paper Insights</div><div class="topic"><div class="answer-box"><div class="definition">Most Asked: ${result.paperInsights.mostAskedTopic}</div><div class="point"><span class="point-num">💡</span><span>${result.paperInsights.recommendedFocus}</span></div></div></div>` : ''}
      ${result.hotTopics?.length ? `<div class="section-title">🔥 Hot Topics</div>${result.hotTopics.map((h, i) => `<div class="topic"><div class="topic-header"><div><div class="topic-num">#${i+1} Most Asked</div><div class="topic-title">${h.topic}</div></div><span class="badge badge-high">Asked ${h.count}x · ${h.totalMarks} marks</span></div></div>`).join('')}` : ''}
      <div class="section-title">📋 PYQ Analysis (${result.pyqAnalysis?.length || 0} Topics)</div>
      ${result.pyqAnalysis?.map((t, i) => `
        <div class="topic">
          <div class="topic-header"><div><div class="topic-num">Topic ${String(i+1).padStart(2,'0')}</div><div class="topic-title">${t.topic}</div></div><span class="badge ${t.importance === 'High' ? 'badge-high' : t.importance === 'Medium' ? 'badge-med' : 'badge-low'}">${t.importance} · ${t.pyqMatches?.length || 0} Qs</span></div>
          <div class="answer-box">${t.pyqMatches?.length ? t.pyqMatches.map(q => `<div style="border:1px solid #e0dff5;border-radius:8px;padding:10px;margin-bottom:8px"><div style="font-weight:600;font-size:13px;margin-bottom:5px">${q.question}</div><div style="font-size:12px;color:#00796b;background:#e8fffe;padding:6px 10px;border-radius:5px">💡 ${q.howToAnswer}</div></div>`).join('') : '<div style="color:#aaa;font-size:12px">No direct match found.</div>'}</div>
        </div>
      `).join('') || ''}
    `
  }

  const html = `<html><head><meta charset="utf-8"/><title>PrepIQ — ${result.subject}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px;font-size:13px;line-height:1.6}
      .header{border-bottom:3px solid #6c5ce7;padding-bottom:16px;margin-bottom:28px}.brand{font-size:22px;font-weight:800;color:#6c5ce7}.brand span{color:#1a1a2e}
      .section-title{font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6c5ce7;margin:28px 0 14px;border-left:4px solid #6c5ce7;padding-left:10px}
      .topic{border:1px solid #e0dff5;border-radius:10px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid}
      .topic-header{background:#f4f3ff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e0dff5}
      .topic-num{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.08em}.topic-title{font-weight:700;font-size:14px}
      .badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px}.badge-high{background:#ffe5e5;color:#d63031}.badge-med{background:#fff8e1;color:#e17055}.badge-low{background:#e8f5e9;color:#2d8653}
      .examiner-tip{background:#e8fffe;padding:8px 14px;font-size:12px;color:#00796b}.tip-label{font-weight:700;font-size:10px;text-transform:uppercase;margin-right:6px}
      .answer-box{padding:12px 14px}.answer-label{font-size:10px;font-weight:700;color:#6c5ce7;text-transform:uppercase;margin-bottom:8px}.answer-content{border-left:3px solid #6c5ce7;padding-left:12px}
      .definition{font-weight:600;margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #ddd}.point{display:flex;gap:8px;margin-bottom:5px;color:#444;font-size:12px}.point-num{font-weight:700;color:#6c5ce7;flex-shrink:0}
      .formula{display:inline-block;background:#f4f3ff;border:1px solid #d4d0fa;border-radius:4px;padding:2px 10px;font-family:monospace;font-size:12px;color:#6c5ce7;margin:6px 0}
      .conclusion{margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;color:#555;font-style:italic;font-size:12px}
      .diagram-cue{background:#fffde7;border:1px solid #fff176;border-radius:6px;padding:8px 12px;margin:8px 14px;font-size:12px}.diagram-label{font-size:10px;font-weight:700;color:#f57f17;text-transform:uppercase;margin-bottom:3px}
      .question{border:1px solid #e0dff5;border-radius:10px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid}.q-header{background:#f4f3ff;padding:10px 14px;border-bottom:1px solid #e0dff5}.q-text{font-weight:600;font-size:13px;margin-top:5px}.q-body{padding:12px 14px}
      .mistake{background:#fff5f5;border:1px solid #ffcdd2;border-radius:8px;padding:10px 14px;margin-bottom:8px}.mistake-topic{font-size:10px;font-weight:700;color:#c62828;text-transform:uppercase;margin-bottom:5px}.wrong{color:#bbb;text-decoration:line-through;font-size:12px;margin-bottom:3px}.correct{color:#2e7d32;font-weight:600;font-size:12px;margin-bottom:3px}.explanation{color:#666;font-size:11px}
      .footer{margin-top:40px;padding-top:14px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa}
    </style></head><body>
    <div class="header"><div class="brand">Prep<span>iq</span></div><h1 style="font-size:18px;font-weight:700;margin:4px 0">${result.subject} — ${result.chapter}</h1><div style="font-size:12px;color:#666">🎯 ${exam} &nbsp;|&nbsp; ${modeLabel} &nbsp;|&nbsp; Generated by PrepIQ AI</div></div>
    ${bodyHTML}
    <div class="footer">Generated by PrepIQ AI • prepiq.in • Exam-ready notes in seconds</div>
  </body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 800)
}

// ─── PLAN LIMITS ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:    { generates: 4,  pages: 10  },
  weekly:  { generates: 10, pages: 25  },
  pro:     { generates: 30, pages: 50  },
  promax:  { generates: 50, pages: 150 },
}

// ─── MODES CONFIG ─────────────────────────────────────────────────────────────
const MODES = [
  { id: 'exam-notes',     icon: '✍️', label: 'Exam Notes',     desc: 'Detailed topper-style answers with model answers & examiner tips', color: '#a29bfe' },
  { id: 'mcq',            icon: '📝', label: 'MCQ Practice',   desc: 'Multiple choice questions with explanations for every concept',    color: '#fd79a8' },
  { id: 'last-minute',    icon: '⚡', label: 'Last Minute',    desc: 'Ultra-compressed notes for 1-2 hours before your exam',           color: '#fdcb6e' },
  { id: 'quick-revision', icon: '🃏', label: 'Quick Revision', desc: 'Flashcards, one-liners, comparisons and formulas at a glance',    color: '#55efc4' },
  { id: 'pyq',            icon: '🎯', label: 'PYQ Analysis',   desc: 'Match your notes with PYQ / sample paper',                       color: '#fd79a8' },
]

// ─── MCQ CARD ─────────────────────────────────────────────────────────────────
function MCQCard({ q, i }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  return (
    <div style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', marginBottom: '1rem', overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.1rem', background: '#13131e', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: '0.5rem' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(240,238,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Q{i + 1} · {q.topic}</div>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', lineHeight: '1.5', marginTop: '0.2rem' }}>{q.question}</div>
        </div>
      </div>
      <div style={{ padding: '1rem 1.1rem' }}>
        {['A', 'B', 'C', 'D'].map(opt => {
          const isCorrect = opt === q.correct
          const isSelected = opt === selected
          let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)', color = 'rgba(240,238,255,0.7)'
          if (answered && isCorrect) { bg = 'rgba(85,239,196,0.1)'; border = 'rgba(85,239,196,0.4)'; color = '#55efc4' }
          else if (answered && isSelected && !isCorrect) { bg = 'rgba(255,118,117,0.1)'; border = 'rgba(255,118,117,0.4)'; color = '#ff7675' }
          return (
            <button key={opt}
              onClick={() => !answered && setSelected(opt)}
              onTouchEnd={(e) => { e.preventDefault(); if (!answered) setSelected(opt) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: `1.5px solid ${border}`, background: bg, color, fontSize: '0.82rem', fontWeight: isCorrect && answered ? '700' : '500', cursor: answered ? 'default' : 'pointer', marginBottom: '0.4rem', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontWeight: '800', minWidth: '1.2rem' }}>{opt}.</span>
              <span style={{ flex: 1 }}>{q.options[opt]}</span>
              {answered && isCorrect && <span>✓</span>}
              {answered && isSelected && !isCorrect && <span>✗</span>}
            </button>
          )
        })}
        {answered && (
          <div style={{ marginTop: '0.7rem', background: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.15)', borderRadius: '8px', padding: '0.7rem 0.85rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#00cec9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>💡 Explanation</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(240,238,255,0.65)', lineHeight: '1.6' }}>{q.explanation}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────
const CACHE_EXPIRY = 24 * 60 * 60 * 1000
function getCacheKey(noteFiles, urls, mode) {
  const fileHash = noteFiles.map(f => f.name + '_' + f.size).join('|')
  const urlHash = urls.filter(u => u.trim()).join('|')
  return `prepiq_cache_${fileHash}_${urlHash}_${mode}`
}
function getFromCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) { localStorage.removeItem(key); return null }
    return cached.result
  } catch { return null }
}
function saveToCache(key, result) {
  try { localStorage.setItem(key, JSON.stringify({ result, timestamp: Date.now() })) } catch {}
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Upload() {
  const [noteFiles, setNoteFiles]         = useState([])
  const [sylFile, setSylFile]             = useState(null)
  const [pyqFiles, setPyqFiles]           = useState([])
  const [loading, setLoading]             = useState(false)
  const [result, setResult]               = useState(null)
  const [fromCache, setFromCache]         = useState(false)
  const [activeTab, setActiveTab]         = useState('main')
  const [exam, setExam]                   = useState('JEE Advanced')
  const [mode, setMode]                   = useState('exam-notes')
  const [subjectType, setSubjectType]     = useState('general')
  const [error, setError]                 = useState(null)
  const [urls, setUrls]                   = useState([''])
  const [progress, setProgress]           = useState({ step: 0, total: 0, label: '' })
  const [flipped, setFlipped]             = useState({})
  const [pageLimitData, setPageLimitData] = useState(null)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoved, setFeedbackLoved] = useState([])
  const [feedbackBetter, setFeedbackBetter] = useState([])
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [userPlan, setUserPlan]           = useState('free')
  const [userEmail, setUserEmail]         = useState('')
  const [generatesUsed, setGeneratesUsed] = useState(0)
  const [generatesLimit, setGeneratesLimit] = useState(4)
  const [planLoading, setPlanLoading]     = useState(true)
  const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL

  useEffect(() => {
    const saved = localStorage.getItem('prepiq_exam')
    if (saved) setExam(saved)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchPlan() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setPlanLoading(false); return }
        const email = session.user.email
        setUserEmail(email)
        if (email === DEV_EMAIL) {
          setUserPlan('free'); setGeneratesUsed(0); setGeneratesLimit(50)
          setPlanLoading(false); return
        }
        const { data } = await supabase.from('users').select('plan, generates_used').eq('id', session.user.id).single()
        if (data) {
          const plan = data.plan || 'free'
          setUserPlan(plan)
          setGeneratesUsed(data.generates_used || 0)
          setGeneratesLimit(PLAN_LIMITS[plan]?.generates || 4)
        }
      } catch (err) { console.error('Plan fetch error:', err) }
      finally { setPlanLoading(false) }
    }
    fetchPlan()
  }, [])

  function handleNotes(e) { setNoteFiles(prev => [...prev, ...Array.from(e.target.files)]) }
  function handleSyl(e) { setSylFile(e.target.files[0]) }
  function handlePyq(e) { setPyqFiles(prev => [...prev, ...Array.from(e.target.files)]) }
  function removeNote(name) { setNoteFiles(prev => prev.filter(f => f.name !== name)) }
  function removePyq(name) { setPyqFiles(prev => prev.filter(f => f.name !== name)) }
  function updateUrl(i, value) { const n = [...urls]; n[i] = value; setUrls(n) }
  function removeUrl(i) { setUrls(urls.filter((_, j) => j !== i)) }
  function addUrl() { setUrls([...urls, '']) }
  function toggleFlip(i) { setFlipped(prev => ({ ...prev, [i]: !prev[i] })) }

  const hasValidUrl = urls.some(u => u.trim().length > 0)
  const canGenerate = (mode === 'pyq' ? (pyqFiles.length > 0 && (noteFiles.length > 0 || hasValidUrl)) : (noteFiles.length > 0 || hasValidUrl)) && !loading && !planLoading
  const generatesLeft = generatesLimit - generatesUsed
  const limitReached = generatesLeft <= 0 && userEmail !== DEV_EMAIL

  const LOADING_STEPS = {
    'exam-notes':     ['📖 Reading your material…', '🔍 Identifying all topics…', '✍️ Writing ideal exam answers…', '🎯 Generating important questions…', '⚠️ Checking for mistakes…'],
    'mcq':            ['📖 Reading your material…', '🔍 Scanning every concept…', '📝 Generating MCQs…', '✅ Writing explanations…'],
    'last-minute':    ['📖 Reading your material…', '⚡ Compressing key points…', '🧠 Creating memory tricks…', '🎯 Finding likely questions…'],
    'quick-revision': ['📖 Reading your material…', '🃏 Creating flashcards…', '💡 Writing one-liners…', '⚖️ Building comparisons…'],
    'pyq':            ['📖 Reading your notes…', '📋 Reading PYQ / sample paper…', '🔍 Matching topics…', '📊 Calculating frequency…', '🎯 Generating exam strategy…'],
  }

  async function generate(forcePartial = false, forceRegenerate = false) {
    if (!canGenerate) return
    if (mode === 'pyq' && pyqFiles.length === 0) { setError('Please upload a PYQ or sample paper.'); return }
if (mode === 'pyq' && noteFiles.length === 0 && !hasValidUrl) { setError('Please upload your notes too — PYQ Analysis needs both notes and PYQ paper.'); return }
    if (limitReached) { setError(`You've used all ${generatesLimit} generates. Upgrade your plan!`); return }

    if (!forceRegenerate) {
      const cacheKey = getCacheKey(noteFiles, urls, mode)
      const cached = getFromCache(cacheKey)
      if (cached) { setResult(cached); setFromCache(true); setActiveTab('main'); setError(null); setPageLimitData(null); if (isMobile) setSidebarOpen(false); return }
    }

    setFromCache(false); setLoading(true); setResult(null); setError(null); setPageLimitData(null); setFlipped({})
    if (isMobile) setSidebarOpen(false)

    const steps = LOADING_STEPS[mode]
    let stepIdx = 0
    setProgress({ step: 1, total: steps.length, label: steps[0] })
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setProgress({ step: stepIdx + 1, total: steps.length, label: steps[stepIdx] })
    }, 8000)

    try {
      const formData = new FormData()
      formData.append('exam', exam)
      formData.append('mode', mode)
      formData.append('plan', userPlan)
      formData.append('processPages', forcePartial ? 'partial' : 'full')
      for (const file of noteFiles) formData.append('notes', file)
      if (sylFile) { const text = await sylFile.text(); formData.append('syllabus', text) }
      for (const url of urls) { if (url.trim()) formData.append('urls', url.trim()) }
      for (const file of pyqFiles) formData.append('pyqFiles', file)

      const res = await fetch('/api/process', { method: 'POST', body: formData })
      const data = await res.json()
      clearInterval(interval)

      if (data.success) {
        setResult(data.data); setActiveTab('main')
        setSubjectType(data.subjectType || 'general')
        const cacheKey = getCacheKey(noteFiles, urls, mode)
        saveToCache(cacheKey, data.data)
        if (userEmail !== DEV_EMAIL) {
  setGeneratesUsed(prev => prev + 1)
}
      } else if (data.error === 'page_limit_exceeded') {
        setPageLimitData({ estimatedPages: data.estimatedPages, pageLimit: data.pageLimit })
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      clearInterval(interval)
      setError(err.message || 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  async function submitFeedback() {
    if (feedbackLoading) return
    setFeedbackLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('feedback').insert({
        user_id: session?.user?.id || null,
        email: userEmail || null,
        mode, exam,
        subject: result?.subject || '',
        loved: feedbackLoved,
        better: feedbackBetter,
        message: feedbackText,
      })
    } catch (err) { console.error('Feedback error:', err) }
    setFeedbackSubmitted(true)
    setFeedbackLoading(false)
  }

  function getTabsForMode(r) {
    if (!r) return []
    if (subjectType === 'poetry') {
      if (mode === 'exam-notes') return [{ id: 'main', label: `📖 Poems (${r.poems?.length || 0})` }]
      if (mode === 'mcq') return [{ id: 'main', label: `📝 MCQs (${r.mcqs?.length || 0})` }]
      if (mode === 'last-minute') return [{ id: 'main', label: `⚡ Poems (${r.poems?.length || 0})` }, { id: 'dont', label: `🚫 Don't Forget` }]
      if (mode === 'quick-revision') return [{ id: 'main', label: `🃏 Flashcards (${r.flashcards?.length || 0})` }, { id: 'devices', label: `🎭 Devices (${r.devicesList?.length || 0})` }, { id: 'oneliners', label: `💡 One-Liners` }]
    }
    if (subjectType === 'prose') {
      if (mode === 'exam-notes') return [{ id: 'main', label: `📖 Passages (${r.passages?.length || 0})` }]
      if (mode === 'mcq') return [{ id: 'main', label: `📝 MCQs (${r.mcqs?.length || 0})` }]
      if (mode === 'last-minute') return [{ id: 'main', label: `⚡ Passages (${r.passages?.length || 0})` }, { id: 'dont', label: `🚫 Don't Forget` }]
      if (mode === 'quick-revision') return [{ id: 'main', label: `🃏 Flashcards (${r.flashcards?.length || 0})` }, { id: 'oneliners', label: `💡 One-Liners` }]
    }
    if (mode === 'exam-notes') return [{ id: 'main', label: `✍️ Notes (${r.topics?.length || 0})` }, { id: 'qs', label: `🎯 Qs (${r.questions?.length || 0})` }, { id: 'mistakes', label: `⚠️ Mistakes (${r.mistakes?.length || 0})` }]
    if (mode === 'mcq') return [{ id: 'main', label: `📝 MCQs (${r.mcqs?.length || 0})` }]
    if (mode === 'last-minute') return [{ id: 'main', label: `⚡ Topics (${r.topics?.length || 0})` }, { id: 'facts', label: `💡 Facts (${r.quickFacts?.length || 0})` }, { id: 'dont', label: `🚫 Don't Forget` }]
    if (mode === 'quick-revision') return [{ id: 'main', label: `🃏 Cards (${r.flashcards?.length || 0})` }, { id: 'oneliners', label: `💡 One-Liners` }, { id: 'compare', label: `⚖️ Compare` }, { id: 'formulas', label: `📐 Formulas` }]
    if (mode === 'pyq') return [{ id: 'main', label: `📋 Analysis (${r.pyqAnalysis?.length || 0})` }, { id: 'hot', label: `🔥 Hot Topics` }, { id: 'insights', label: '📊 Insights' }]
    return []
  }

  const S = {
    card: { background: '#0d0d15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', marginBottom: '1rem', overflow: 'hidden' },
    cardHeader: { padding: '0.85rem 1.1rem', background: '#13131e', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    topicNum: { fontSize: '0.62rem', color: 'rgba(240,238,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' },
    topicTitle: { fontWeight: '700', fontSize: '0.95rem' },
    answerBox: { padding: '1rem 1.1rem' },
    answerContent: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.95rem 1rem 0.95rem 1.3rem', fontSize: '0.83rem', lineHeight: '1.85', borderLeft: '3px solid #6c5ce7' },
    definition: { fontWeight: '600', marginBottom: '0.55rem', paddingBottom: '0.45rem', borderBottom: '1px dashed rgba(255,255,255,0.07)' },
    point: { display: 'flex', gap: '0.45rem', marginBottom: '0.28rem', color: 'rgba(240,238,255,0.6)', fontSize: '0.82rem' },
    pointNum: { fontWeight: '700', color: '#a29bfe', flexShrink: 0 },
    formula: { display: 'inline-block', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: '5px', padding: '0.18rem 0.6rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#a29bfe', margin: '0.3rem 0' },
    conclusion: { marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed rgba(255,255,255,0.07)', color: 'rgba(240,238,255,0.6)', fontStyle: 'italic', fontSize: '0.8rem' },
    badge: (freq) => ({ fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '100px', background: freq === 'High' ? 'rgba(255,118,117,0.15)' : freq === 'Medium' ? 'rgba(253,203,110,0.15)' : 'rgba(85,239,196,0.15)', color: freq === 'High' ? '#ff7675' : freq === 'Medium' ? '#fdcb6e' : '#55efc4' }),
    tip: { padding: '0.65rem 1.1rem', background: 'rgba(0,206,201,0.05)', borderBottom: '1px solid rgba(0,206,201,0.1)', fontSize: '0.77rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.55' },
    tipLabel: { fontWeight: '700', color: '#00cec9', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '0.5rem' },
    diagramCue: { display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: 'rgba(253,203,110,0.05)', border: '1px solid rgba(253,203,110,0.15)', borderRadius: '8px', padding: '0.7rem 0.9rem', margin: '0 1.1rem 0.9rem' },
  }

  const currentMode = MODES.find(m2 => m2.id === mode)

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: isMobile ? '1rem' : '1.2rem', overflowY: 'auto', flex: 1 }}>
      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.5rem' }}>Choose Mode</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {MODES.map(m => (
            <button key={m.id}
              onClick={() => { setMode(m.id); setResult(null); setError(null); setPageLimitData(null); setFromCache(false) }}
              onTouchEnd={(e) => { e.preventDefault(); setMode(m.id); setResult(null); setError(null); setPageLimitData(null); setFromCache(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 0.85rem', borderRadius: '10px', border: mode === m.id ? `1.5px solid ${m.color}40` : '1.5px solid rgba(255,255,255,0.07)', background: mode === m.id ? `${m.color}10` : '#13131e', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '0.82rem', color: mode === m.id ? m.color : '#f0eeff' }}>{m.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(240,238,255,0.38)', lineHeight: '1.4', marginTop: '0.08rem' }}>{m.desc}</div>
              </div>
              {mode === m.id && <span style={{ color: m.color, fontSize: '0.7rem' }}>●</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.38rem' }}>📑 Notes / PDF</div>
        <label style={{ display: 'block', border: '2px dashed rgba(108,92,231,0.3)', borderRadius: '12px', padding: '1.1rem 1rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(108,92,231,0.03)', touchAction: 'manipulation' }}>
          <input type="file" multiple accept=".pdf,.txt,.docx,.pptx" onChange={handleNotes} style={{ display: 'none' }} />
          <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>📑</div>
          <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.15rem' }}>Tap to upload</div>
          <div style={{ fontSize: '0.67rem', color: 'rgba(240,238,255,0.38)' }}>PDF, TXT, Word, PPT supported</div>
        </label>
      </div>

      {noteFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)' }}>Files — {noteFiles.length}</div>
          {noteFiles.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#13131e', border: '1px solid rgba(108,92,231,0.25)', borderRadius: '8px', padding: '0.45rem 0.65rem' }}>
              <span>{f.name.endsWith('.pdf') ? '📕' : '📄'}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={() => removeNote(f.name)} onTouchEnd={(e) => { e.preventDefault(); removeNote(f.name) }} style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.38)', cursor: 'pointer', fontSize: '0.8rem', touchAction: 'manipulation', padding: '0.3rem' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {mode === 'pyq' && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#fd79a8', marginBottom: '0.38rem' }}>🎯 PYQ / Sample Paper <span style={{ color: 'rgba(240,238,255,0.3)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(required)</span></div>
          <label style={{ display: 'block', border: '2px dashed rgba(253,121,168,0.3)', borderRadius: '12px', padding: '1.1rem 1rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(253,121,168,0.03)', touchAction: 'manipulation' }}>
            <input type="file" multiple accept=".pdf,.txt,.docx,.pptx" onChange={handlePyq} style={{ display: 'none' }} />
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>🎯</div>
            <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.15rem', color: '#fd79a8' }}>Upload PYQ or Sample Paper</div>
            <div style={{ fontSize: '0.67rem', color: 'rgba(240,238,255,0.38)' }}>PDF, TXT, Word, PPT supported</div>
          </label>
          {pyqFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
              {pyqFiles.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#13131e', border: '1px solid rgba(253,121,168,0.25)', borderRadius: '8px', padding: '0.45rem 0.65rem' }}>
                  <span>🎯</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => removePyq(f.name)} onTouchEnd={(e) => { e.preventDefault(); removePyq(f.name) }} style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.38)', cursor: 'pointer', fontSize: '0.8rem', touchAction: 'manipulation', padding: '0.3rem' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.38rem' }}>🔗 Website Links (optional)</div>
        {urls.map((url, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <input type="text" placeholder="https://geeksforgeeks.org/…" value={url} onChange={(e) => updateUrl(i, e.target.value)}
              style={{ flex: 1, background: '#13131e', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.52rem 0.75rem', color: '#f0eeff', fontSize: '0.75rem', outline: 'none' }} />
            {urls.length > 1 && <button onClick={() => removeUrl(i)} onTouchEnd={(e) => { e.preventDefault(); removeUrl(i) }} style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.38)', cursor: 'pointer', touchAction: 'manipulation', padding: '0.3rem' }}>✕</button>}
          </div>
        ))}
        <button onClick={addUrl} onTouchEnd={(e) => { e.preventDefault(); addUrl() }} style={{ fontSize: '0.71rem', fontWeight: '600', color: '#a29bfe', background: 'none', border: '1px solid rgba(108,92,231,0.25)', borderRadius: '6px', padding: '0.28rem 0.65rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>+ Add link</button>
      </div>

      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(240,238,255,0.38)', marginBottom: '0.38rem' }}>📋 Syllabus (optional)</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', border: '1.5px dashed rgba(0,206,201,0.25)', borderRadius: '10px', padding: '0.8rem 1rem', cursor: 'pointer', background: sylFile ? 'rgba(0,206,201,0.07)' : 'rgba(0,206,201,0.03)', touchAction: 'manipulation' }}>
          <input type="file" accept=".pdf,.txt" onChange={handleSyl} style={{ display: 'none' }} />
          <span style={{ fontSize: '1.3rem' }}>📋</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.78rem', marginBottom: '0.08rem' }}>{sylFile ? sylFile.name : 'Upload Syllabus'}</div>
            <div style={{ fontSize: '0.67rem', color: sylFile ? '#00cec9' : 'rgba(240,238,255,0.38)' }}>{sylFile ? '✅ Uploaded!' : "Don't have it? No problem."}</div>
          </div>
        </label>
      </div>

      {pageLimitData && (
        <div style={{ background: 'rgba(253,203,110,0.08)', border: '1px solid rgba(253,203,110,0.3)', borderRadius: '12px', padding: '0.9rem 1rem', fontSize: '0.77rem', color: '#fdcb6e', lineHeight: '1.6' }}>
          <div style={{ fontWeight: '700', marginBottom: '0.3rem' }}>⚠️ File too large!</div>
          <div style={{ color: 'rgba(240,238,255,0.6)', marginBottom: '0.65rem' }}>~{pageLimitData.estimatedPages} pages found. Your plan supports {pageLimitData.pageLimit} pages.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button onClick={() => generate(true)} onTouchEnd={(e) => { e.preventDefault(); generate(true) }} style={{ padding: '0.55rem', borderRadius: '8px', border: 'none', background: '#fdcb6e', color: '#1a1a2e', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>✂️ Process first {pageLimitData.pageLimit} pages →</button>
            <button onClick={() => window.location.href = '/pricing'} onTouchEnd={(e) => { e.preventDefault(); window.location.href = '/pricing' }} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(253,203,110,0.4)', background: 'transparent', color: '#fdcb6e', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>⚡ Upgrade Plan</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255,118,117,0.1)', border: '1px solid rgba(255,118,117,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.77rem', color: '#ff7675', lineHeight: '1.5' }}>
          ⚠️ {error}
          {limitReached && <button onClick={() => window.location.href = '/pricing'} style={{ display: 'block', marginTop: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: '#ff7675', color: 'white', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer' }}>⚡ Upgrade Plan</button>}
        </div>
      )}

      <button
        onClick={() => generate(false)}
        onTouchEnd={(e) => { e.preventDefault(); generate(false) }}
        disabled={!canGenerate || limitReached}
        style={{ width: '100%', background: canGenerate && !limitReached ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.85rem', fontWeight: '700', fontSize: '0.95rem', cursor: canGenerate && !limitReached ? 'pointer' : 'not-allowed', opacity: canGenerate && !limitReached ? 1 : 0.5, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        {loading ? '⏳ Generating…' : limitReached ? '🔒 Limit Reached — Upgrade' : `${currentMode?.icon} Generate ${currentMode?.label}`}
      </button>

      <div style={{ fontSize: '0.62rem', color: 'rgba(240,238,255,0.25)', textAlign: 'center', lineHeight: '1.6' }}>
        💾 Results saved for 24 hours — re-uploading the same file won't use a generate
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#05050a', color: '#f0eeff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.85rem 1rem', background: '#0d0d15', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.05em' }}>Prep<span style={{ color: '#a29bfe' }}>iq</span></span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Study Material</span>
        {!planLoading && (
          <span style={{ background: generatesLeft <= 1 ? 'rgba(255,118,117,0.12)' : 'rgba(85,239,196,0.08)', border: `1px solid ${generatesLeft <= 1 ? 'rgba(255,118,117,0.3)' : 'rgba(85,239,196,0.2)'}`, color: generatesLeft <= 1 ? '#ff7675' : '#55efc4', fontSize: '0.6rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '100px' }}>
            {userEmail === DEV_EMAIL ? '🛠 DEV' : `${generatesLeft} left`}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} onTouchEnd={(e) => { e.preventDefault(); setSidebarOpen(true) }}
              style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(108,92,231,0.4)', background: 'rgba(108,92,231,0.1)', color: '#a29bfe', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              ⚙️ Settings
            </button>
          )}
          <button onClick={() => window.location.href = '/dashboard'} onTouchEnd={(e) => { e.preventDefault(); window.location.href = '/dashboard' }}
            style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            Dashboard
          </button>
        </div>
      </div>

      {isMobile && (
        <div style={{ background: '#0d0d15', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: currentMode?.color }}>{currentMode?.icon} {currentMode?.label}</span>
          <button onClick={() => generate(false)} onTouchEnd={(e) => { e.preventDefault(); generate(false) }} disabled={!canGenerate || limitReached}
            style={{ background: canGenerate && !limitReached ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.45rem 1rem', fontWeight: '700', fontSize: '0.8rem', cursor: canGenerate && !limitReached ? 'pointer' : 'not-allowed', opacity: canGenerate && !limitReached ? 1 : 0.5, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {loading ? '⏳ Generating…' : `Generate ⚡`}
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? undefined : '310px 1fr', minHeight: 0 }}>
        {!isMobile && (
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', background: '#0d0d15', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <SidebarContent />
          </div>
        )}

        {isMobile && sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0d0d15', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', zIndex: 201, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1rem 0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>⚙️ Settings</span>
                <button onClick={() => setSidebarOpen(false)} onTouchEnd={(e) => { e.preventDefault(); setSidebarOpen(false) }}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f0eeff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.8rem', touchAction: 'manipulation' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}><SidebarContent /></div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? 'calc(100vh - 120px)' : undefined }}>
          {isMobile && (pageLimitData || error) && (
            <div style={{ padding: '1rem' }}>
              {pageLimitData && (
                <div style={{ background: 'rgba(253,203,110,0.08)', border: '1px solid rgba(253,203,110,0.3)', borderRadius: '12px', padding: '0.9rem 1rem', fontSize: '0.77rem', color: '#fdcb6e', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: '700', marginBottom: '0.3rem' }}>⚠️ File too large!</div>
                  <div style={{ color: 'rgba(240,238,255,0.6)', marginBottom: '0.65rem' }}>~{pageLimitData.estimatedPages} pages found. Your plan supports {pageLimitData.pageLimit} pages.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button onClick={() => generate(true)} onTouchEnd={(e) => { e.preventDefault(); generate(true) }} style={{ padding: '0.55rem', borderRadius: '8px', border: 'none', background: '#fdcb6e', color: '#1a1a2e', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>✂️ Process first {pageLimitData.pageLimit} pages →</button>
                    <button onClick={() => window.location.href = '/pricing'} onTouchEnd={(e) => { e.preventDefault(); window.location.href = '/pricing' }} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(253,203,110,0.4)', background: 'transparent', color: '#fdcb6e', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>⚡ Upgrade Plan</button>
                  </div>
                </div>
              )}
              {error && (
                <div style={{ background: 'rgba(255,118,117,0.1)', border: '1px solid rgba(255,118,117,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.77rem', color: '#ff7675', lineHeight: '1.5', marginTop: pageLimitData ? '0.75rem' : 0 }}>
                  ⚠️ {error}
                  {limitReached && <button onClick={() => window.location.href = '/pricing'} onTouchEnd={(e) => { e.preventDefault(); window.location.href = '/pricing' }} style={{ display: 'block', marginTop: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: '#ff7675', color: 'white', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer', touchAction: 'manipulation' }}>⚡ Upgrade Plan</button>}
                </div>
              )}
            </div>
          )}

          {!loading && !result && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', gap: '1rem', color: 'rgba(240,238,255,0.38)' }}>
              <div style={{ fontSize: '3rem', opacity: '0.2' }}>{currentMode?.icon || '📖'}</div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'rgba(240,238,255,0.6)' }}>{currentMode?.label} output will appear here</div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.65', maxWidth: '280px' }}>{mode === 'pyq' ? 'Upload your notes + PYQ, then generate' : 'Upload notes or paste a website link'}</div>
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} onTouchEnd={(e) => { e.preventDefault(); setSidebarOpen(true) }}
                  style={{ marginTop: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(108,92,231,0.4)', background: 'rgba(108,92,231,0.1)', color: '#a29bfe', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  ⚙️ Upload & Settings
                </button>
              )}
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.4rem', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'rgba(240,238,255,0.7)' }}>{progress.step === progress.total ? '⚙️ Finalizing your notes...' : progress.label}</div>
              <div style={{ width: '100%', maxWidth: '320px', background: 'rgba(255,255,255,0.07)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '100px', background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)', width: `${progress.step === progress.total ? 90 : (progress.step / progress.total) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.3)' }}>{progress.step === progress.total ? 'This may take a moment for large files...' : `Step ${progress.step} of ${progress.total}`}</div>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#0d0d15', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.subject} — {result.chapter}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={S.badge('High')}>🎯 {exam}</span>
                    <span style={{ ...S.badge('Medium'), background: `${currentMode?.color}20`, color: currentMode?.color }}>{currentMode?.icon} {currentMode?.label}</span>
                    {fromCache && <span style={{ fontSize: '0.6rem', color: '#55efc4', background: 'rgba(85,239,196,0.1)', border: '1px solid rgba(85,239,196,0.2)', borderRadius: '100px', padding: '0.1rem 0.45rem', fontWeight: '700' }}>⚡ Cache</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
                  <button onClick={() => downloadPDF(result, exam, mode)} onTouchEnd={(e) => { e.preventDefault(); downloadPDF(result, exam, mode) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.45rem 0.8rem', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    ⬇️ Download PDF
                  </button>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(240,238,255,0.3)', textAlign: 'right' }}>⬇️ Download — results saved for 24 hours only</div>
                  {fromCache && (
                    <button onClick={() => generate(false, true)} onTouchEnd={(e) => { e.preventDefault(); generate(false, true) }} style={{ fontSize: '0.62rem', color: 'rgba(240,238,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', touchAction: 'manipulation' }}>
                      🔄 Regenerate (1 generate)
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.62rem', color: 'rgba(240,238,255,0.25)' }}>
                💡 PrepIQ can make mistakes — please double-check responses.
              </div>

              <div style={{ display: 'flex', background: '#0d0d15', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 0.8rem', overflowX: 'auto' }}>
                {getTabsForMode(result).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} onTouchEnd={(e) => { e.preventDefault(); setActiveTab(tab.id) }}
                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: '600', color: activeTab === tab.id ? '#a29bfe' : 'rgba(240,238,255,0.38)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: activeTab === tab.id ? '2px solid #6c5ce7' : '2px solid transparent', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

                {/* ── POETRY EXAM NOTES ── */}
                {subjectType === 'poetry' && mode === 'exam-notes' && activeTab === 'main' && result.poems?.map((poem, pi) => (
                  <div key={pi} style={S.card}>
                    <div style={S.cardHeader}>
                      <div>
                        <div style={S.topicNum}>POEM {String(pi+1).padStart(2,'0')}</div>
                        <div style={S.topicTitle}>{poem.title}</div>
                        <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.5)', marginTop:'0.15rem'}}>by {poem.poet}</div>
                      </div>
                      <span style={S.badge(poem.examFrequency)}>{poem.examFrequency}</span>
                    </div>
                    {poem.examinerTip && <div style={S.tip}><span style={S.tipLabel}>🎓 Examiner</span>{poem.examinerTip}</div>}
                    <div style={S.answerBox}>
                      <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#a29bfe', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>📖 Overview</div>
                      <div style={S.answerContent}>
                        <div style={S.definition}>Theme: {poem.overview?.theme}</div>
                        <div style={S.point}><span style={S.pointNum}>Tone:</span><span>{poem.overview?.tone}</span></div>
                        <div style={S.point}><span style={S.pointNum}>Mood:</span><span>{poem.overview?.mood}</span></div>
                        <div style={S.point}><span style={S.pointNum}>Rhyme:</span><span>{poem.overview?.rhymeScheme}</span></div>
                        <div style={{...S.conclusion, marginTop:'0.5rem'}}>{poem.overview?.poetsIntent}</div>
                      </div>
                    </div>
                    {poem.poeticDevices?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#fd79a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>🎭 Poetic Devices</div>
                        {poem.poeticDevices.map((d, di) => (
                          <div key={di} style={{background:'rgba(253,121,168,0.05)', border:'1px solid rgba(253,121,168,0.15)', borderRadius:'8px', padding:'0.7rem 0.9rem', marginBottom:'0.5rem'}}>
                            <div style={{fontWeight:'700', fontSize:'0.8rem', color:'#fd79a8', marginBottom:'0.25rem'}}>{d.device}</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.5)', fontStyle:'italic', marginBottom:'0.2rem'}}>"{d.line}"</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.7)'}}>{d.effect}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {poem.stanzaAnalysis?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#55efc4', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>📝 Stanza Analysis</div>
                        {poem.stanzaAnalysis.map((s, si) => (
                          <div key={si} style={{background:'rgba(85,239,196,0.05)', border:'1px solid rgba(85,239,196,0.12)', borderRadius:'8px', padding:'0.7rem 0.9rem', marginBottom:'0.5rem'}}>
                            <div style={{fontWeight:'700', fontSize:'0.78rem', color:'#55efc4', marginBottom:'0.2rem'}}>{s.stanza}</div>
                            <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.45)', fontStyle:'italic', marginBottom:'0.3rem'}}>"{s.lines}"</div>
                            <div style={{fontSize:'0.8rem', color:'rgba(240,238,255,0.7)', lineHeight:'1.6'}}>{s.meaning}</div>
                            {s.keyImage && <div style={{fontSize:'0.73rem', color:'#fdcb6e', marginTop:'0.3rem'}}>🔑 {s.keyImage}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {poem.importantLines?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#fdcb6e', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>⭐ Important Lines</div>
                        {poem.importantLines.map((l, li) => (
                          <div key={li} style={{borderLeft:'3px solid #fdcb6e', paddingLeft:'0.75rem', marginBottom:'0.65rem'}}>
                            <div style={{fontSize:'0.82rem', fontStyle:'italic', color:'#f0eeff', marginBottom:'0.2rem'}}>"{l.line}"</div>
                            <div style={{fontSize:'0.77rem', color:'rgba(240,238,255,0.6)'}}>{l.meaning}</div>
                            <div style={{fontSize:'0.7rem', color:'#fdcb6e', marginTop:'0.15rem'}}>📌 {l.whyImportant}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {poem.examQuestions?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#a29bfe', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>🎯 Exam Questions</div>
                        {poem.examQuestions.map((q, qi) => (
                          <div key={qi} style={{background:'rgba(108,92,231,0.08)', border:'1px solid rgba(108,92,231,0.2)', borderRadius:'9px', padding:'0.85rem', marginBottom:'0.65rem'}}>
                            <div style={{display:'flex', gap:'0.4rem', marginBottom:'0.4rem'}}>
                              <span style={S.badge(q.priority)}>{q.priority}</span>
                              <span style={{fontSize:'0.63rem', color:'rgba(240,238,255,0.38)'}}>{q.marks} marks</span>
                            </div>
                            <div style={{fontSize:'0.85rem', fontWeight:'600', marginBottom:'0.5rem'}}>{q.q}</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.65)', lineHeight:'1.65', borderLeft:'2px solid #a29bfe', paddingLeft:'0.75rem'}}>{q.modelAnswer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {poem.commonMistakes?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#ff7675', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>⚠️ Common Mistakes</div>
                        {poem.commonMistakes.map((m, mi) => (
                          <div key={mi} style={{background:'rgba(255,118,117,0.08)', border:'1px solid rgba(255,118,117,0.18)', borderRadius:'8px', padding:'0.75rem', marginBottom:'0.5rem'}}>
                            <div style={{fontSize:'0.78rem', color:'rgba(255,255,255,0.32)', textDecoration:'line-through', marginBottom:'0.2rem'}}>✗ {m.wrong}</div>
                            <div style={{fontSize:'0.78rem', color:'#00cec9', fontWeight:'600', marginBottom:'0.2rem'}}>✓ {m.correct}</div>
                            <div style={{fontSize:'0.73rem', color:'rgba(240,238,255,0.4)'}}>{m.explanation}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* ── POETRY LAST MINUTE ── */}
                {subjectType === 'poetry' && mode === 'last-minute' && activeTab === 'main' && result.poems?.map((poem, pi) => (
                  <div key={pi} style={S.card}>
                    <div style={S.cardHeader}>
                      <div>
                        <div style={S.topicNum}>POEM {String(pi+1).padStart(2,'0')}</div>
                        <div style={S.topicTitle}>{poem.title} — by {poem.poet}</div>
                      </div>
                      <span style={S.badge(poem.examFrequency)}>{poem.examFrequency}</span>
                    </div>
                    <div style={S.answerBox}>
                      <div style={{fontWeight:'600', fontSize:'0.84rem', color:'#f0eeff', background:'rgba(108,92,231,0.08)', border:'1px solid rgba(108,92,231,0.15)', borderRadius:'8px', padding:'0.6rem 0.85rem', marginBottom:'0.65rem'}}>{poem.mustKnow}</div>
                      {poem.keyDevices?.map((d, di) => (
                        <div key={di} style={{display:'flex', gap:'0.5rem', marginBottom:'0.4rem', fontSize:'0.8rem'}}>
                          <span style={{color:'#fd79a8', fontWeight:'700', flexShrink:0}}>🎭</span>
                          <span><span style={{fontWeight:'700', color:'#fd79a8'}}>{d.device}:</span> "{d.line}" — {d.effect}</span>
                        </div>
                      ))}
                      {poem.rhymeScheme && <div style={{...S.formula, marginTop:'0.5rem'}}>Rhyme: {poem.rhymeScheme}</div>}
                      {poem.importantLines?.map((l, li) => (
                        <div key={li} style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.6)', fontStyle:'italic', margin:'0.25rem 0'}}>📌 "{l}"</div>
                      ))}
                      {poem.memoryTrick && <div style={{background:'rgba(253,203,110,0.07)', border:'1px solid rgba(253,203,110,0.2)', borderRadius:'8px', padding:'0.55rem 0.8rem', marginTop:'0.65rem', fontSize:'0.78rem', color:'#fdcb6e'}}>🧠 <span style={{fontWeight:'700'}}>Trick:</span> {poem.memoryTrick}</div>}
                      {poem.likelyQuestion && <div style={{background:'rgba(255,118,117,0.07)', border:'1px solid rgba(255,118,117,0.2)', borderRadius:'8px', padding:'0.55rem 0.8rem', marginTop:'0.5rem', fontSize:'0.78rem', color:'#ff7675'}}>🎯 <span style={{fontWeight:'700'}}>Likely Q:</span> {poem.likelyQuestion}</div>}
                    </div>
                  </div>
                ))}

                {/* ── POETRY QUICK REVISION devices tab ── */}
                {subjectType === 'poetry' && mode === 'quick-revision' && activeTab === 'devices' && (
                  <div style={S.card}>
                    <div style={S.cardHeader}><div style={S.topicTitle}>🎭 All Poetic Devices</div></div>
                    <div style={S.answerBox}>
                      {result.devicesList?.map((d, i) => (
                        <div key={i} style={{padding:'0.6rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                          <div style={{display:'flex', gap:'0.5rem', alignItems:'flex-start'}}>
                            <span style={{fontWeight:'700', color:'#fd79a8', fontSize:'0.78rem', minWidth:'100px', flexShrink:0}}>{d.device}</span>
                            <div>
                              <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.45)', fontStyle:'italic', marginBottom:'0.15rem'}}>"{d.line}"</div>
                              <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.65)'}}>{d.meaning}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PROSE EXAM NOTES ── */}
                {subjectType === 'prose' && mode === 'exam-notes' && activeTab === 'main' && result.passages?.map((p, pi) => (
                  <div key={pi} style={S.card}>
                    <div style={S.cardHeader}>
                      <div>
                        <div style={S.topicNum}>PASSAGE {String(pi+1).padStart(2,'00')}</div>
                        <div style={S.topicTitle}>{p.title}</div>
                        <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.5)', marginTop:'0.15rem'}}>by {p.author}</div>
                      </div>
                      <span style={S.badge(p.examFrequency)}>{p.examFrequency}</span>
                    </div>
                    {p.examinerTip && <div style={S.tip}><span style={S.tipLabel}>🎓 Examiner</span>{p.examinerTip}</div>}
                    <div style={S.answerBox}>
                      <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#a29bfe', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>📖 Overview</div>
                      <div style={S.answerContent}>
                        <div style={S.definition}>Theme: {p.overview?.theme}</div>
                        <div style={S.point}><span style={S.pointNum}>Tone:</span><span>{p.overview?.tone}</span></div>
                        <div style={S.point}><span style={S.pointNum}>Setting:</span><span>{p.overview?.setting}</span></div>
                        <div style={{...S.conclusion, marginTop:'0.5rem'}}>{p.overview?.authorMessage}</div>
                      </div>
                    </div>
                    {p.characters?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#fd79a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>👥 Characters</div>
                        {p.characters.map((c, ci) => (
                          <div key={ci} style={{background:'rgba(253,121,168,0.05)', border:'1px solid rgba(253,121,168,0.15)', borderRadius:'8px', padding:'0.7rem 0.9rem', marginBottom:'0.5rem'}}>
                            <div style={{fontWeight:'700', fontSize:'0.8rem', color:'#fd79a8', marginBottom:'0.2rem'}}>{c.name} — {c.role}</div>
                            {c.traits?.map((t, ti) => <div key={ti} style={S.point}><span style={S.pointNum}>→</span><span>{t}</span></div>)}
                            {c.significance && <div style={{fontSize:'0.75rem', color:'rgba(240,238,255,0.5)', marginTop:'0.3rem', fontStyle:'italic'}}>{c.significance}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {p.literaryDevices?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#55efc4', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>✏️ Literary Devices</div>
                        {p.literaryDevices.map((d, di) => (
                          <div key={di} style={{background:'rgba(85,239,196,0.05)', border:'1px solid rgba(85,239,196,0.12)', borderRadius:'8px', padding:'0.7rem 0.9rem', marginBottom:'0.5rem'}}>
                            <div style={{fontWeight:'700', fontSize:'0.8rem', color:'#55efc4', marginBottom:'0.2rem'}}>{d.device}</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.5)', fontStyle:'italic', marginBottom:'0.2rem'}}>"{d.example}"</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.7)'}}>{d.effect}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.importantQuotes?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#fdcb6e', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>⭐ Important Quotes</div>
                        {p.importantQuotes.map((q, qi) => (
                          <div key={qi} style={{borderLeft:'3px solid #fdcb6e', paddingLeft:'0.75rem', marginBottom:'0.65rem'}}>
                            <div style={{fontSize:'0.82rem', fontStyle:'italic', color:'#f0eeff', marginBottom:'0.15rem'}}>"{q.quote}"</div>
                            <div style={{fontSize:'0.72rem', color:'#fdcb6e', marginBottom:'0.1rem'}}>— {q.speaker}</div>
                            <div style={{fontSize:'0.77rem', color:'rgba(240,238,255,0.6)'}}>{q.significance}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.examQuestions?.length > 0 && (
                      <div style={S.answerBox}>
                        <div style={{fontSize:'0.62rem', fontWeight:'700', color:'#a29bfe', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.65rem'}}>🎯 Exam Questions</div>
                        {p.examQuestions.map((q, qi) => (
                          <div key={qi} style={{background:'rgba(108,92,231,0.08)', border:'1px solid rgba(108,92,231,0.2)', borderRadius:'9px', padding:'0.85rem', marginBottom:'0.65rem'}}>
                            <div style={{display:'flex', gap:'0.4rem', marginBottom:'0.4rem'}}>
                              <span style={S.badge(q.priority)}>{q.priority}</span>
                              <span style={{fontSize:'0.63rem', color:'rgba(240,238,255,0.38)'}}>{q.marks} marks</span>
                            </div>
                            <div style={{fontSize:'0.85rem', fontWeight:'600', marginBottom:'0.5rem'}}>{q.q}</div>
                            <div style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.65)', lineHeight:'1.65', borderLeft:'2px solid #a29bfe', paddingLeft:'0.75rem'}}>{q.modelAnswer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* ── PROSE LAST MINUTE ── */}
                {subjectType === 'prose' && mode === 'last-minute' && activeTab === 'main' && result.passages?.map((p, pi) => (
                  <div key={pi} style={S.card}>
                    <div style={S.cardHeader}>
                      <div>
                        <div style={S.topicNum}>PASSAGE {String(pi+1).padStart(2,'00')}</div>
                        <div style={S.topicTitle}>{p.title} — by {p.author}</div>
                      </div>
                      <span style={S.badge(p.examFrequency)}>{p.examFrequency}</span>
                    </div>
                    <div style={S.answerBox}>
                      <div style={{fontWeight:'600', fontSize:'0.84rem', color:'#f0eeff', background:'rgba(108,92,231,0.08)', border:'1px solid rgba(108,92,231,0.15)', borderRadius:'8px', padding:'0.6rem 0.85rem', marginBottom:'0.65rem'}}>{p.mustKnow}</div>
                      {p.keyCharacters?.map((c, ci) => (
                        <div key={ci} style={{display:'flex', gap:'0.5rem', marginBottom:'0.3rem', fontSize:'0.8rem'}}>
                          <span style={{color:'#fd79a8', fontWeight:'700', flexShrink:0}}>👤</span>
                          <span>{c}</span>
                        </div>
                      ))}
                      {p.plotInPoints?.map((pt, pti) => (
                        <div key={pti} style={{display:'flex', gap:'0.5rem', marginBottom:'0.28rem', fontSize:'0.8rem', color:'rgba(240,238,255,0.65)'}}>
                          <span style={{color:'#a29bfe', fontWeight:'700', flexShrink:0}}>→</span><span>{pt}</span>
                        </div>
                      ))}
                      {p.importantQuotes?.map((q, qi) => (
                        <div key={qi} style={{fontSize:'0.78rem', color:'rgba(240,238,255,0.6)', fontStyle:'italic', margin:'0.25rem 0'}}>📌 "{q}"</div>
                      ))}
                      {p.memoryTrick && <div style={{background:'rgba(253,203,110,0.07)', border:'1px solid rgba(253,203,110,0.2)', borderRadius:'8px', padding:'0.55rem 0.8rem', marginTop:'0.65rem', fontSize:'0.78rem', color:'#fdcb6e'}}>🧠 <span style={{fontWeight:'700'}}>Trick:</span> {p.memoryTrick}</div>}
                      {p.likelyQuestion && <div style={{background:'rgba(255,118,117,0.07)', border:'1px solid rgba(255,118,117,0.2)', borderRadius:'8px', padding:'0.55rem 0.8rem', marginTop:'0.5rem', fontSize:'0.78rem', color:'#ff7675'}}>🎯 <span style={{fontWeight:'700'}}>Likely Q:</span> {p.likelyQuestion}</div>}
                    </div>
                  </div>
                ))}

                {/* ── GENERAL EXAM NOTES ── */}
                {mode === 'exam-notes' && activeTab === 'main' && subjectType !== 'poetry' && subjectType !== 'prose' && result.topics?.map((t, i) => (
                  <div key={i} style={S.card}>
                    <div style={S.cardHeader}>
                      <div><div style={S.topicNum}>Topic {String(i + 1).padStart(2, '0')}</div><div style={S.topicTitle}>{t.title}</div></div>
                      <span style={S.badge(t.examFrequency)}>{t.examFrequency}</span>
                    </div>
                    {t.examinerTip && <div style={S.tip}><span style={S.tipLabel}>🎓 Examiner</span>{t.examinerTip}</div>}
                    <div style={S.answerBox}>
                      <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>✍️ Write This in Exam</div>
                      <div style={S.answerContent}>
                        {t.idealAnswer?.definition && <div style={S.definition}>{t.idealAnswer.definition}</div>}
                        {(Array.isArray(t.idealAnswer?.points) ? t.idealAnswer.points : typeof t.idealAnswer?.points === 'string' ? [t.idealAnswer.points] : []).map((p, j) => <div key={j} style={S.point}><span style={S.pointNum}>{j + 1}.</span><span>{p}</span></div>)}
                        {t.idealAnswer?.formula && <div style={S.formula}>📐 {t.idealAnswer.formula}</div>}
                        {t.idealAnswer?.conclusion && <div style={S.conclusion}>{t.idealAnswer.conclusion}</div>}
                      </div>
                    </div>
                    {t.diagramCue && <div style={S.diagramCue}><span>✏️</span><div><div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#fdcb6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem' }}>Draw This</div><div style={{ fontSize: '0.77rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.5' }}>{t.diagramCue}</div></div></div>}
                  </div>
                ))}

                {mode === 'exam-notes' && activeTab === 'qs' && result.questions?.map((q, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ ...S.cardHeader, flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}><span style={S.badge(q.priority)}>{q.priority}</span><span style={{ fontSize: '0.63rem', color: 'rgba(240,238,255,0.38)' }}>{q.reason}</span></div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: '1.55' }}>Q{i + 1}. {q.q}</div>
                    </div>
                    <div style={S.answerBox}>
                      <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.55rem' }}>✍️ Model Answer</div>
                      <div style={S.answerContent}>
                        {q.modelAnswer?.definition && <div style={S.definition}>{q.modelAnswer.definition}</div>}
                        {(Array.isArray(q.modelAnswer?.points) ? q.modelAnswer.points : [q.modelAnswer?.points]).filter(Boolean).map((p, j) => <div key={j} style={S.point}><span style={S.pointNum}>{j + 1}.</span> {p}</div>)}
                        {q.modelAnswer?.formula && <div style={S.formula}>📐 {q.modelAnswer.formula}</div>}
                        {q.modelAnswer?.conclusion && <div style={S.conclusion}>{q.modelAnswer.conclusion}</div>}
                      </div>
                    </div>
                  </div>
                ))}

                {mode === 'exam-notes' && activeTab === 'mistakes' && (
                  result.mistakes?.length === 0
                    ? <div style={{ textAlign: 'center', padding: '2rem', color: '#00cec9', fontSize: '0.85rem' }}>✅ No mistakes found!</div>
                    : result.mistakes?.map((m, i) => (
                      <div key={i} style={{ background: 'rgba(255,118,117,0.08)', border: '1px solid rgba(255,118,117,0.18)', borderRadius: '10px', padding: '0.9rem', marginBottom: '0.7rem' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#ff7675', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.28rem' }}>⚠️ {m.topic}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.32)', textDecoration: 'line-through', marginBottom: '0.2rem' }}>✗ {m.wrong}</div>
                        <div style={{ fontSize: '0.8rem', color: '#00cec9', fontWeight: '600', marginBottom: '0.22rem' }}>✓ {m.correct}</div>
                        <div style={{ fontSize: '0.74rem', color: 'rgba(240,238,255,0.38)', lineHeight: '1.52' }}>{m.explanation}</div>
                      </div>
                    ))
                )}

                {mode === 'mcq' && activeTab === 'main' && result.mcqs?.map((q, i) => <MCQCard key={i} q={q} i={i} />)}

                {mode === 'last-minute' && activeTab === 'main' && subjectType !== 'poetry' && subjectType !== 'prose' && result.topics?.map((t, i) => (
                  <div key={i} style={S.card}>
                    <div style={S.cardHeader}>
                      <div><div style={S.topicNum}>Topic {String(i + 1).padStart(2, '0')} · {t.examFrequency}</div><div style={S.topicTitle}>{t.title}</div></div>
                    </div>
                    <div style={S.answerBox}>
                      <div style={{ fontWeight: '600', fontSize: '0.84rem', color: '#f0eeff', lineHeight: '1.6', marginBottom: '0.65rem', background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.15)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>{t.mustKnow}</div>
                      {t.keyPoints?.map((p, j) => <div key={j} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.28rem', fontSize: '0.81rem', color: 'rgba(240,238,255,0.65)' }}><span style={{ color: '#a29bfe', fontWeight: '700', flexShrink: 0 }}>→</span><span>{p}</span></div>)}
                      {t.formula && <div style={{ ...S.formula, marginTop: '0.5rem' }}>📐 {t.formula}</div>}
                      {t.memoryTrick && <div style={{ background: 'rgba(253,203,110,0.07)', border: '1px solid rgba(253,203,110,0.2)', borderRadius: '8px', padding: '0.55rem 0.8rem', marginTop: '0.65rem', fontSize: '0.78rem', color: '#fdcb6e' }}>🧠 <span style={{ fontWeight: '700' }}>Trick:</span> {t.memoryTrick}</div>}
                      {t.likelyQuestion && <div style={{ background: 'rgba(255,118,117,0.07)', border: '1px solid rgba(255,118,117,0.2)', borderRadius: '8px', padding: '0.55rem 0.8rem', marginTop: '0.5rem', fontSize: '0.78rem', color: '#ff7675' }}>🎯 <span style={{ fontWeight: '700' }}>Likely Q:</span> {t.likelyQuestion}</div>}
                    </div>
                  </div>
                ))}

                {mode === 'last-minute' && activeTab === 'facts' && (
                  <div style={S.card}>
                    <div style={S.cardHeader}><div style={S.topicTitle}>⚡ Quick Facts</div></div>
                    <div style={S.answerBox}>
                      {result.quickFacts?.map((f, i) => <div key={i} style={{ display: 'flex', gap: '0.55rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', color: 'rgba(240,238,255,0.7)' }}><span style={{ color: '#55efc4', fontWeight: '700', flexShrink: 0 }}>✓</span><span>{f}</span></div>)}
                    </div>
                  </div>
                )}

                {mode === 'last-minute' && activeTab === 'dont' && result.doNotForget?.map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,118,117,0.08)', border: '1px solid rgba(255,118,117,0.18)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.6rem', display: 'flex', gap: '0.6rem' }}>
                    <span style={{ color: '#ff7675', fontWeight: '700', flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(240,238,255,0.7)', lineHeight: '1.55' }}>{f}</span>
                  </div>
                ))}

                {mode === 'quick-revision' && activeTab === 'main' && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                    {result.flashcards?.map((f, i) => (
                      <div key={i} onClick={() => toggleFlip(i)} onTouchEnd={(e) => { e.preventDefault(); toggleFlip(i) }} style={{ cursor: 'pointer', perspective: '800px', height: '160px', touchAction: 'manipulation' }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform 0.4s ease' }}>
                          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: '#13131e', border: '1px solid rgba(108,92,231,0.25)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.topic}</div>
                            <div style={{ fontSize: '0.87rem', fontWeight: '600', color: '#f0eeff', lineHeight: '1.5', flex: 1, display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>{f.front}</div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(240,238,255,0.25)', textAlign: 'right' }}>Tap to reveal →</div>
                          </div>
                          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.35)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.82rem', color: '#f0eeff', lineHeight: '1.6' }}>{f.back}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mode === 'quick-revision' && activeTab === 'oneliners' && (
                  <div style={S.card}>
                    <div style={S.cardHeader}><div style={S.topicTitle}>💡 One-Line Definitions</div></div>
                    <div style={S.answerBox}>
                      {result.oneLiners?.map((o, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                          <span style={{ fontWeight: '700', color: '#a29bfe', fontSize: '0.8rem', minWidth: isMobile ? 'auto' : '130px', flexShrink: 0 }}>{o.concept}:</span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(240,238,255,0.65)', lineHeight: '1.5' }}>{o.oneLiner}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'quick-revision' && activeTab === 'compare' && (
                  result.comparisons?.length === 0
                    ? <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(240,238,255,0.38)', fontSize: '0.85rem' }}>No comparisons found.</div>
                    : result.comparisons?.map((c, i) => (
                      <div key={i} style={S.card}>
                        <div style={S.cardHeader}><div style={S.topicTitle}>⚖️ {c.title}</div></div>
                        <div style={S.answerBox}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(240,238,255,0.38)', textTransform: 'uppercase' }}>Aspect</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a29bfe' }}>{c.itemA}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fd79a8' }}>{c.itemB}</div>
                          </div>
                          {c.points?.map((p, j) => (
                            <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '0.45rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(240,238,255,0.5)' }}>{p.aspect}</div>
                              <div style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.7)' }}>{p.a}</div>
                              <div style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.7)' }}>{p.b}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}

                {mode === 'quick-revision' && activeTab === 'formulas' && (
                  result.formulas?.length === 0
                    ? <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(240,238,255,0.38)', fontSize: '0.85rem' }}>No formulas found.</div>
                    : result.formulas?.map((f, i) => (
                      <div key={i} style={S.card}>
                        <div style={S.cardHeader}><div style={S.topicTitle}>{f.name}</div></div>
                        <div style={S.answerBox}>
                          <div style={{ ...S.formula, fontSize: '1rem', padding: '0.5rem 1rem', margin: '0 0 0.65rem' }}>📐 {f.formula}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(240,238,255,0.6)', lineHeight: '1.55' }}>{f.usedFor}</div>
                        </div>
                      </div>
                    ))
                )}

                {mode === 'pyq' && activeTab === 'main' && result.pyqAnalysis?.map((t, i) => (
                  <div key={i} style={S.card}>
                    <div style={S.cardHeader}>
                      <div><div style={S.topicNum}>Topic {String(i + 1).padStart(2, '0')} · {t.pyqMatches?.length || 0} Qs</div><div style={S.topicTitle}>{t.topic}</div></div>
                      <span style={S.badge(t.importance)}>{t.importance}</span>
                    </div>
                    {t.importanceReason && <div style={S.tip}><span style={S.tipLabel}>📊 Why</span>{t.importanceReason}</div>}
                    <div style={S.answerBox}>
                      {t.pyqMatches?.length > 0 ? t.pyqMatches.map((q, j) => (
                        <div key={j} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.85rem', marginBottom: '0.65rem', borderLeft: '3px solid #fd79a8' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ ...S.badge('High'), background: 'rgba(253,121,168,0.12)', color: '#fd79a8' }}>{q.year}</span>
                            <span style={S.badge('Medium')}>{q.questionType}</span>
                            <span style={{ ...S.badge('Low'), background: 'rgba(85,239,196,0.1)', color: '#55efc4' }}>{q.marks} marks</span>
                          </div>
                          <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#f0eeff', lineHeight: '1.55', marginBottom: '0.5rem' }}>{q.question}</div>
                          <div style={{ background: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.12)', borderRadius: '7px', padding: '0.5rem 0.75rem', fontSize: '0.76rem', color: 'rgba(240,238,255,0.65)', lineHeight: '1.55' }}>
                            <span style={{ fontWeight: '700', color: '#00cec9', fontSize: '0.6rem', textTransform: 'uppercase', marginRight: '0.4rem' }}>💡 How to Answer</span>{q.howToAnswer}
                          </div>
                        </div>
                      )) : <div style={{ fontSize: '0.78rem', color: 'rgba(240,238,255,0.3)', fontStyle: 'italic' }}>No direct match found.</div>}
                      {t.topicTip && <div style={{ marginTop: '0.75rem', background: 'rgba(253,203,110,0.05)', border: '1px solid rgba(253,203,110,0.15)', borderRadius: '8px', padding: '0.55rem 0.8rem', fontSize: '0.77rem', color: '#fdcb6e' }}>🎯 <span style={{ fontWeight: '700' }}>Tip:</span> {t.topicTip}</div>}
                    </div>
                  </div>
                ))}

                {mode === 'pyq' && activeTab === 'hot' && (
                  result.hotTopics?.length === 0
                    ? <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(240,238,255,0.38)', fontSize: '0.85rem' }}>No hot topics found.</div>
                    : result.hotTopics?.map((h, i) => (
                      <div key={i} style={{ ...S.card, borderLeft: i < 3 ? '3px solid #fd79a8' : undefined }}>
                        <div style={S.cardHeader}>
                          <div><div style={S.topicNum}>#{i + 1} Most Asked</div><div style={S.topicTitle}>{h.topic}</div></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                            <span style={{ ...S.badge('High'), background: 'rgba(253,121,168,0.12)', color: '#fd79a8' }}>Asked {h.count}x</span>
                            <span style={{ ...S.badge('Low'), background: 'rgba(85,239,196,0.1)', color: '#55efc4' }}>{h.totalMarks} marks</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}

                {mode === 'pyq' && activeTab === 'insights' && result.paperInsights && (
                  <div style={{ ...S.card, borderLeft: '3px solid #a29bfe' }}>
                    <div style={S.cardHeader}><div style={S.topicTitle}>📊 Paper Overview</div></div>
                    <div style={S.answerBox}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[{ label: 'Total Questions Found', value: result.paperInsights.totalQuestionsFound }, { label: 'Most Asked Topic', value: result.paperInsights.mostAskedTopic }].map((item, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(240,238,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{item.label}</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f0eeff' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.18)', borderRadius: '9px', padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#a29bfe', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>🎯 Recommended Strategy</div>
                        <div style={{ fontSize: '0.83rem', color: 'rgba(240,238,255,0.75)', lineHeight: '1.65' }}>{result.paperInsights.recommendedFocus}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FEEDBACK ── */}
                {result && (
                  <div style={{ margin: '1.5rem 0 2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
                    {!feedbackSubmitted ? (
                      <>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Make PrepIQ yours 🚀</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(240,238,255,0.4)' }}>We read every message 👀</div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#55efc4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>❤️ What you loved</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {['⚡ Super fast results', '🎯 Exactly what I needed', '📖 Easy to understand', '💡 Examples were great', '🔥 Better than my teacher\'s notes'].map(opt => (
                              <button key={opt} onClick={() => setFeedbackLoved(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '100px', border: `1px solid ${feedbackLoved.includes(opt) ? 'rgba(85,239,196,0.5)' : 'rgba(255,255,255,0.1)'}`, background: feedbackLoved.includes(opt) ? 'rgba(85,239,196,0.1)' : 'transparent', color: feedbackLoved.includes(opt) ? '#55efc4' : 'rgba(240,238,255,0.5)', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fd79a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>💬 What could be better</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {['📝 Notes too short', '🔍 Missing important topics', '💡 Need more examples', '❌ Something was wrong'].map(opt => (
                              <button key={opt} onClick={() => setFeedbackBetter(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '100px', border: `1px solid ${feedbackBetter.includes(opt) ? 'rgba(253,121,168,0.5)' : 'rgba(255,255,255,0.1)'}`, background: feedbackBetter.includes(opt) ? 'rgba(253,121,168,0.1)' : 'transparent', color: feedbackBetter.includes(opt) ? '#fd79a8' : 'rgba(240,238,255,0.5)', fontSize: '0.75rem', cursor: 'pointer', touchAction: 'manipulation' }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder='e.g. "Photosynthesis definition was wrong" or "MCQs were too easy"'
                            rows={2}
                            style={{ width: '100%', background: '#13131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#f0eeff', fontSize: '0.78rem', resize: 'none', outline: 'none', lineHeight: '1.5', boxSizing: 'border-box' }} />
                        </div>
                        <button onClick={submitFeedback} disabled={feedbackLoading || (feedbackLoved.length === 0 && feedbackBetter.length === 0 && !feedbackText.trim())}
                          style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', opacity: feedbackLoading || (feedbackLoved.length === 0 && feedbackBetter.length === 0 && !feedbackText.trim()) ? 0.5 : 1, touchAction: 'manipulation' }}>
                          {feedbackLoading ? '⏳ Sending...' : 'Send to PrepIQ team →'}
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀</div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.3rem' }}>We read every message — we'll make it happen!</div>
                      </div>
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