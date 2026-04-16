'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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
  const [splashDone, setSplashDone] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1900)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (splashDone) {
      const t = setTimeout(() => setVisible(true), 80)
      return () => clearTimeout(t)
    }
  }, [splashDone])

  function go() {
    if (!selected.trim()) return
    localStorage.setItem('prepiq_exam', selected)
    router.push('/upload')
  }

  function selectExam(exam) {
    setSelected(exam)
  }

  return (
    <>
      {/* ── SPLASH ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#05050a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        perspective: '600px',
        perspectiveOrigin: '50% 50%',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        opacity: splashDone ? 0 : 1,
        visibility: splashDone ? 'hidden' : 'visible',
      }}>
        <div style={{
          fontSize: 'clamp(4rem, 15vw, 8rem)',
          fontWeight: '800',
          letterSpacing: '-0.05em',
          transformStyle: 'preserve-3d',
          animation: 'burstOut 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}>
          <span style={{ color: '#f0eeff' }}>Prep</span>
          <span style={{ color: '#a29bfe' }}>IQ</span>
        </div>
      </div>

      <style>{`
        @keyframes burstOut {
          0%   { transform: translateZ(-400px) scale(0.3); opacity: 0; filter: blur(8px); }
          35%  { opacity: 1; filter: blur(0px); transform: translateZ(0px) scale(1); }
          60%  { transform: translateZ(60px) scale(1.05); opacity: 1; filter: blur(0px); }
          100% { transform: translateZ(800px) scale(3); opacity: 0; filter: blur(16px); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes examPop {
          0%   { transform: scale(0.88); opacity: 0; }
          65%  { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }

        .hero-badge {
          opacity: 0;
        }
        .hero-badge.in {
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s forwards;
        }

        .hero-h1 {
          opacity: 0;
        }
        .hero-h1.in {
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s forwards;
        }

        .hero-p {
          opacity: 0;
        }
        .hero-p.in {
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.25s forwards;
        }

        .exam-card {
          opacity: 0;
        }
        .exam-card.in {
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.35s forwards;
        }

        .social-tag {
          opacity: 0;
        }
        .social-tag.in-0 { animation: fadeIn 0.4s ease 0.5s forwards; }
        .social-tag.in-1 { animation: fadeIn 0.4s ease 0.62s forwards; }
        .social-tag.in-2 { animation: fadeIn 0.4s ease 0.74s forwards; }
        .social-tag.in-3 { animation: fadeIn 0.4s ease 0.86s forwards; }

        .feature-card {
          opacity: 0;
        }
        .feature-card.in-0 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.55s forwards; }
        .feature-card.in-1 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.65s forwards; }
        .feature-card.in-2 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.75s forwards; }
        .feature-card.in-3 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.85s forwards; }

        .feature-card:hover {
          transform: translateY(-3px) scale(1.01) !important;
          border-color: rgba(108,92,231,0.35) !important;
          border-left: 2px solid #6c5ce7 !important;
          background: rgba(108,92,231,0.06) !important;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease !important;
        }

        .exam-btn {
          transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .exam-btn:hover {
          transform: scale(1.04) !important;
          border-color: rgba(162,155,254,0.5) !important;
        }
        .exam-btn.selected-pop {
          animation: examPop 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        .cta-btn {
          transition: all 0.18s ease !important;
          position: relative;
          overflow: hidden;
        }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          box-shadow: 0 0 0 0px rgba(108,92,231,0.5);
          transition: box-shadow 0.2s ease;
          pointer-events: none;
        }
        .cta-btn:hover::after {
          box-shadow: 0 0 0 3px rgba(108,92,231,0.3);
        }
        .cta-btn:hover {
          transform: translateY(-1px) !important;
          filter: brightness(1.1);
        }
        .cta-btn:active {
          transform: scale(0.98) !important;
        }

        .upload-zone-anim {
          transition: border-color 0.2s, background 0.2s, transform 0.18s !important;
        }
        .upload-zone-anim:hover {
          border-color: rgba(108,92,231,0.7) !important;
          background: rgba(108,92,231,0.05) !important;
          transform: scale(1.01) !important;
        }
      `}</style>

      {/* ── MAIN PAGE ── */}
      <main style={{ minHeight: '100vh', background: '#05050a', color: '#f0eeff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.05em' }}>
            Prep<span style={{ color: '#a29bfe' }}>IQ</span>
          </span>
        </nav>

        {/* Hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>

          <div
            className={`hero-badge${visible ? ' in' : ''}`}
            style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.25)', color: '#a29bfe', fontSize: '0.7rem', fontWeight: '700', padding: '0.3rem 0.85rem', borderRadius: '100px', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            MADE FOR INDIAN STUDENTS
          </div>

          <h1
            className={`hero-h1${visible ? ' in' : ''}`}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.2rem', maxWidth: '700px' }}>
            Upload your notes.
            <br />
            <span style={{ color: '#a29bfe' }}>Get exam-ready in 30 seconds.</span>
          </h1>

          <p
            className={`hero-p${visible ? ' in' : ''}`}
            style={{ fontSize: '1rem', color: 'rgba(240,238,255,0.5)', maxWidth: '480px', lineHeight: '1.75', marginBottom: '2.5rem' }}>
            Messy PDF, random notes, or a website link — PrepIQ converts it into detailed topper-style answers, MCQs, flashcards, and last-minute notes.
          </p>

          {/* Exam Selector Card */}
          <div
            className={`exam-card${visible ? ' in' : ''}`}
            style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1.5rem', width: '100%', maxWidth: '520px', textAlign: 'left' }}>

            <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,238,255,0.35)', marginBottom: '0.75rem' }}>
              Which exam are you preparing for?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.65rem' }}>
              {EXAMS.map(exam => (
                <button
                  key={exam}
                  onClick={() => selectExam(exam)}
                  onTouchEnd={(e) => { e.preventDefault(); selectExam(exam) }}
                  className="exam-btn"
                  style={{
                    padding: '0.58rem 0.4rem',
                    borderRadius: '9px',
                    border: selected === exam ? '1.5px solid #6c5ce7' : '1.5px solid rgba(255,255,255,0.1)',
                    background: selected === exam ? 'rgba(108,92,231,0.15)' : '#13131e',
                    color: selected === exam ? '#a29bfe' : 'rgba(240,238,255,0.55)',
                    fontSize: '0.77rem',
                    fontWeight: '600',
                    cursor: 'pointer',
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
              style={{ width: '100%', background: '#13131e', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '0.62rem 0.9rem', color: '#f0eeff', fontSize: '0.82rem', outline: 'none', marginBottom: '0.75rem', touchAction: 'manipulation', transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = 'rgba(108,92,231,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />

            <button
              onClick={go}
              onTouchEnd={(e) => { e.preventDefault(); go() }}
              disabled={!selected.trim()}
              className="cta-btn"
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
              <span
                key={i}
                className={`social-tag${visible ? ` in-${i}` : ''}`}
                style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: '#55efc4' }}>✓</span> {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card${visible ? ` in-${i}` : ''}`}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(240,238,255,0.4)', lineHeight: '1.5' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.68rem', color: 'rgba(240,238,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          PrepIQ · prepiq.in · For personal study use only
        </div>

      </main>
    </>
  )
}