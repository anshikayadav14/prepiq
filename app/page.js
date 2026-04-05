'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const EXAMS = [
  'JEE Advanced', 'JEE Main', 'NEET',
  'UPSC', 'CBSE 12th', 'CBSE 10th',
  'B.Tech', 'CA', 'GATE'
]

const FEATURES = [
  { icon: '✍️', title: 'Exam Notes', desc: 'Topper-style 10-15 mark answers with examiner tips' },
  { icon: '📝', title: 'MCQ Practice', desc: 'Auto-generated MCQs with full explanations' },
  { icon: '⚡', title: 'Last Minute', desc: 'Ultra-compressed notes for 1-2 hours before exam' },
  { icon: '🃏', title: 'Quick Revision', desc: 'Flashcards, one-liners, comparisons & formulas' },
]

export default function Home() {
  const router = useRouter()
  const [selected, setSelected] = useState('')

  function go() {
    if (!selected.trim()) return
    localStorage.setItem('prepiq_exam', selected)
    router.push('/upload')
  }

  function selectExam(exam) {
    setSelected(exam)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05050a', color: '#f0eeff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.05em' }}>
          Prep<span style={{ color: '#a29bfe' }}>iq</span>
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.4)', fontWeight: '600' }}>AI-powered exam notes</span>
          <span style={{ background: 'rgba(85,239,196,0.1)', border: '1px solid rgba(85,239,196,0.25)', color: '#55efc4', fontSize: '0.62rem', fontWeight: '700', padding: '0.18rem 0.5rem', borderRadius: '100px' }}>FREE</span>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>

        <div style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.25)', color: '#a29bfe', fontSize: '0.7rem', fontWeight: '700', padding: '0.3rem 0.85rem', borderRadius: '100px', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          MADE FOR INDIAN STUDENTS
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.2rem', maxWidth: '700px' }}>
          Upload your notes.
          <br />
          <span style={{ color: '#a29bfe' }}>Get exam-ready in 30 seconds.</span>
        </h1>

        <p style={{ fontSize: '1rem', color: 'rgba(240,238,255,0.5)', maxWidth: '480px', lineHeight: '1.75', marginBottom: '2.5rem' }}>
          Messy PDF, random notes, or a website link — Prepiq converts it into detailed topper-style answers, MCQs, flashcards, and last-minute notes.
        </p>

        {/* Exam Selector Card */}
        <div style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1.5rem', width: '100%', maxWidth: '520px', textAlign: 'left' }}>

          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,238,255,0.35)', marginBottom: '0.75rem' }}>
            Which exam are you preparing for?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.65rem' }}>
            {EXAMS.map(exam => (
              <button
                key={exam}
                onClick={() => selectExam(exam)}
                onTouchEnd={(e) => { e.preventDefault(); selectExam(exam) }}
                style={{
                  padding: '0.58rem 0.4rem',
                  borderRadius: '9px',
                  border: selected === exam ? '1.5px solid #6c5ce7' : '1.5px solid rgba(255,255,255,0.1)',
                  background: selected === exam ? 'rgba(108,92,231,0.15)' : '#13131e',
                  color: selected === exam ? '#a29bfe' : 'rgba(240,238,255,0.55)',
                  fontSize: '0.77rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                }}>
                {exam}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or type your exam / university / subject…"
            onChange={(e) => setSelected(e.target.value)}
            value={EXAMS.includes(selected) ? '' : selected}
            style={{ width: '100%', background: '#13131e', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.62rem 0.9rem', color: '#f0eeff', fontSize: '0.82rem', outline: 'none', marginBottom: '0.75rem', touchAction: 'manipulation' }}
          />

          <button
            onClick={go}
            onTouchEnd={(e) => { e.preventDefault(); go() }}
            disabled={!selected.trim()}
            style={{
              width: '100%',
              background: selected.trim() ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)' : 'rgba(255,255,255,0.08)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.9rem',
              fontSize: '0.97rem',
              fontWeight: '700',
              cursor: selected.trim() ? 'pointer' : 'not-allowed',
              opacity: selected.trim() ? 1 : 0.45,
              transition: 'all 0.15s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}>
            Upload my notes ⚡
          </button>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['PDF, TXT supported', 'Website links work too', 'Download as PDF', 'Syllabus-aware'].map((tag, i) => (
            <span key={i} style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: '#55efc4' }}>✓</span> {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Feature Strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.4)', lineHeight: '1.5' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.68rem', color: 'rgba(240,238,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        Prepiq · prepiq.in · For personal study use only
      </div>

    </main>
  )
}