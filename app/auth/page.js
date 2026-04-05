'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
const supabase = createClient()

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleAuth() {
    setLoading(true)
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Please enter email and password.')
      setLoading(false)
      return
    }

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('Login data:', data)
      console.log('Login error:', error)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      console.log('Signup data:', data)
      console.log('Signup error:', error)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            plan: 'free',
            generates_used: 0,
            generates_reset_date: new Date().toISOString()
          })
        }
        setMessage('Account created! You can now login.')
        setIsLogin(true)
        setLoading(false)
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: '800',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0
          }}>PrepIQ</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '0.9rem' }}>
            AI-powered exam notes for Indian students
          </p>
        </div>

        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px', padding: '4px', marginBottom: '24px'
        }}>
          <button onClick={() => setIsLogin(true)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.9rem',
            background: isLogin ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'transparent',
            color: isLogin ? 'white' : 'rgba(255,255,255,0.5)'
          }}>Login</button>
          <button onClick={() => setIsLogin(false)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.9rem',
            background: !isLogin ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'transparent',
            color: !isLogin ? 'white' : 'rgba(255,255,255,0.5)'
          }}>Sign Up</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{
              padding: '14px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white', fontSize: '0.95rem', outline: 'none'
            }} />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{
              padding: '14px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white', fontSize: '0.95rem', outline: 'none'
            }} />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px', color: '#f87171', fontSize: '0.85rem'
            }}>{error}</div>
          )}

          {message && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '10px', padding: '12px', color: '#4ade80', fontSize: '0.85rem'
            }}>{message}</div>
          )}

          <button onClick={handleAuth} disabled={loading} style={{
            padding: '14px', borderRadius: '12px', border: 'none',
            background: loading ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: 'white', fontSize: '1rem', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </div>

        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.3)',
          fontSize: '0.8rem', marginTop: '24px', marginBottom: 0
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setMessage('') }}
            style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: '600' }}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}