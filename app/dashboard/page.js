'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const PLAN_LIMITS = { free: 4, weekly: 10, pro: 30, promax: 50 }
const PLAN_LABELS = { free: 'Free', weekly: 'Weekly', pro: 'Pro', promax: 'Pro Max' }
const PLAN_COLORS = { free: '#a78bfa', weekly: '#60a5fa', pro: '#34d399', promax: '#f59e0b' }

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/auth'
          return
        }

        setUser(user)

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setUserData(data)
        } else {
          const newUser = {
            id: user.id,
            email: user.email,
            plan: 'free',
            generates_used: 0,
            generates_reset_date: new Date().toISOString()
          }
          await supabase.from('users').upsert(newUser)
          setUserData(newUser)
        }
      } catch (err) {
        console.error('Dashboard error:', err)
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: "'Inter', sans-serif"
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading dashboard...</p>
      </div>
    )
  }

  const plan = userData?.plan || 'free'
  const used = userData?.generates_used || 0
  const limit = PLAN_LIMITS[plan] || 2
  const remaining = Math.max(0, limit - used)
  const percentage = Math.min(100, (used / limit) * 100)
  const name = user?.email?.split('@')[0] || 'Student'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      fontFamily: "'Inter', sans-serif", color: 'white', padding: '24px'
    }}>
      {/* Navbar */}
      <div style={{
        maxWidth: '800px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '1.5rem', fontWeight: '800',
          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0
        }}>PrepIQ</h1>
        <button onClick={handleLogout} style={{
          padding: '8px 16px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', fontSize: '0.85rem'
        }}>Logout</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 8px' }}>
            Namaste, {name} 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Ready to ace your exams today?
          </p>
        </div>

        {/* Plan Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${PLAN_COLORS[plan]}40`,
          borderRadius: '20px', padding: '28px', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <span style={{
                background: `${PLAN_COLORS[plan]}20`, color: PLAN_COLORS[plan],
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem',
                fontWeight: '700', border: `1px solid ${PLAN_COLORS[plan]}40`
              }}>{PLAN_LABELS[plan]} Plan</span>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: '0.9rem' }}>
                {plan === 'promax' ? 'Unlimited generates' : `${remaining} of ${limit} generates remaining`}
              </p>
            </div>
            {plan === 'free' && (
              <button onClick={() => window.location.href = '/pricing'} style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem'
              }}>Upgrade →</button>
            )}
          </div>

          {plan !== 'promax' && (
            <div>
              <div style={{
                height: '8px', background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: `${percentage}%`,
                  background: percentage >= 100
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : `linear-gradient(135deg, ${PLAN_COLORS[plan]}, ${PLAN_COLORS[plan]}99)`,
                  borderRadius: '10px', transition: 'width 0.5s ease'
                }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: '8px 0 0', textAlign: 'right' }}>
                {used}/{limit} used this month
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => window.location.href = '/upload'} style={{
            padding: '20px', borderRadius: '16px',
            border: '1px solid rgba(167,139,250,0.3)',
            background: 'rgba(167,139,250,0.1)', color: 'white',
            cursor: 'pointer', textAlign: 'left'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📄</div>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>Generate Notes</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Upload PDF or paste URL</div>
          </button>

          <button onClick={() => window.location.href = '/pricing'} style={{
            padding: '20px', borderRadius: '16px',
            border: '1px solid rgba(96,165,250,0.3)',
            background: 'rgba(96,165,250,0.1)', color: 'white',
            cursor: 'pointer', textAlign: 'left'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>Upgrade Plan</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Get more generates</div>
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center'
        }}>
      
        </div>
      </div>
    </div>
  )
}