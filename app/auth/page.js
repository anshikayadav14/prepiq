'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

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

    const supabase = createClient()

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email first. Check your inbox!')
        } else {
          setError(error.message)
        }
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            plan: 'free',
            generates_used: 0,
            generates_reset_date: new Date().toISOString()
          })
          setMessage('✅ Check your email to verify your account! Click the link we sent you.')
          setIsLogin(true)
          setLoading(false)
        } else if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            plan: 'free',
            generates_used: 0,
            generates_reset_date: new Date().toISOString()
          })
          window.location.href = '/dashboard'
        }
        setLoading(false)
      }
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://prepiqai.in/auth/callback'
      }
    })
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button onClick={handleGoogleLogin} style={{
            padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)', color: 'white',
            fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
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