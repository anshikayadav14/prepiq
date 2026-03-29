'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [selected, setSelected] = useState('')

  return (
    <main style={{
      minHeight: '100vh',
      background: '#05050a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        fontFamily: 'sans-serif',
        fontWeight: '800',
        fontSize: '1.3rem',
        letterSpacing: '-0.05em',
        marginBottom: '2rem',
        color: '#f0eeff'
      }}>
        Prep<span style={{color:'#a29bfe'}}>iq</span>
      </div>

      <h1 style={{
        fontSize: '3rem',
        fontWeight: '800',
        marginBottom: '1rem',
        lineHeight: '1.1'
      }}>
        Exam tomorrow?
        <br />
        <span style={{ color: '#a29bfe' }}>
          We've got you.
        </span>
      </h1>

      <p style={{
        fontSize: '1.1rem',
        color: 'rgba(240,238,255,0.6)',
        maxWidth: '500px',
        lineHeight: '1.7',
        marginBottom: '2rem'
      }}>
        Upload your messy notes or PPT — 
        get clean exam-ready answers in 30 seconds.
      </p>

      <div style={{
        background: '#0d0d15',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: '16px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'left'
      }}>
        <p style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(240,238,255,0.38)',
          marginBottom: '0.8rem'
        }}>
          First — which exam are you preparing for?
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '0.7rem'
        }}>
          {['JEE Advanced','JEE Main','NEET',
            'UPSC','CBSE 12th','CBSE 10th',
            'B.Tech','CA','GATE'].map((exam) => (
            <button
              key={exam}
              onClick={() => setSelected(exam)}
              style={{
                padding: '0.6rem 0.5rem',
                borderRadius: '9px',
                border: selected === exam
                  ? '1.5px solid #6c5ce7'
                  : '1.5px solid rgba(255,255,255,0.13)',
                background: selected === exam
                  ? 'rgba(108,92,231,0.12)'
                  : '#13131e',
                color: selected === exam
                  ? '#a29bfe'
                  : 'rgba(240,238,255,0.6)',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
              {exam}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Or type your exam here…"
          onChange={(e) => setSelected(e.target.value)}
          style={{
            width: '100%',
            background: '#13131e',
            border: '1.5px solid rgba(255,255,255,0.07)',
            borderRadius: '9px',
            padding: '0.6rem 0.9rem',
            color: '#f0eeff',
            fontSize: '0.83rem',
            outline: 'none',
            marginBottom: '0.8rem'
          }}
        />

        <button
          onClick={() => {
            if (selected) {
               localStorage.setItem('prepiq_exam', selected)
               router.push('/upload')
            }
}}
          style={{
            width: '100%',
            background: selected
              ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)'
              : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.9rem',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: selected ? 'pointer' : 'not-allowed',
            opacity: selected ? 1 : 0.5
          }}>
          Let's go — upload your notes ⚡
        </button>
      </div>

    </main>
  )
}