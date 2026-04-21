'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    generates: '4 generates/month',
    pages: 'Up to 10 pages',
    ai: 'Basic AI',
    color: '#a78bfa',
    features: [
      '4 generates per month',
      'Up to 10 pages per upload',
      'All 5 study modes',
      'PDF download',
      'Basic AI',
      'Smart 24hr caching',
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: '₹49',
    period: 'per week',
    generates: '10 generates/week',
    pages: 'Up to 25 pages',
    ai: 'Advanced AI',
    color: '#60a5fa',
    features: [
      '10 generates per week',
      'Up to 25 pages per upload',
      'All 5 study modes',
      'PDF download',
      'Advanced AI',
      'Smart 24hr caching',
      'Faster output',
    ],
    cta: 'Get Weekly',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹149',
    period: 'per month',
    generates: '30 generates/month',
    pages: 'Up to 50 pages',
    ai: 'Advanced AI',
    color: '#34d399',
    features: [
      '30 generates per month',
      'Up to 50 pages per upload',
      'All 5 study modes',
      'PDF download',
      'Advanced AI',
      'Smart 24hr caching',
      'Faster output',
      'Priority support',
    ],
    cta: 'Get Pro',
    popular: true
  }
]

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        const { data } = await supabase
          .from('users')
          .select('plan')
          .eq('id', session.user.id)
          .single()
        if (data) setCurrentPlan(data.plan)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  async function handleCTA(planId) {
    if (!user) {
      router.push('/auth')
      return
    }
    if (planId === 'free') return
    if (currentPlan === planId) return

    setPaymentLoading(true)
    
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      })
      const data = await res.json()
      console.log('Order response:', data)
      
      if (!data.success) {
        alert('Order failed: ' + data.error)
        setPaymentLoading(false)
        return
      }

      // Open Razorpay checkout
      const options = {
        key: 'rzp_live_SgDfaBjTFUpUdx',
        amount: data.amount,
        currency: 'INR',
        name: 'PrepIQ',
        description: planId === 'weekly' ? 'Weekly Plan - ₹49/week' : 'Pro Plan - ₹149/month',
        order_id: data.orderId,
        prefill: {
          email: user.email,
        },
        theme: {
          color: planId === 'weekly' ? '#60a5fa' : '#34d399'
        },
        handler: async function(response) {
          // Verify payment
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            })
          })
          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            alert(`🎉 Payment successful! ${planId === 'weekly' ? 'Weekly' : 'Pro'} plan activated!`)
            router.push('/dashboard')
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error('Payment error:', err)
      alert('Something went wrong. Please try again.')
    }

    setPaymentLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      fontFamily: "'Inter', sans-serif",
      color: 'white',
      padding: '40px 24px'
    }}>

      {/* Navbar */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '60px'
      }}>
        <h1
          onClick={() => router.push('/')}
          style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            cursor: 'pointer'
          }}>PrepIQ</h1>
        {user ? (
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >Dashboard</button>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >Login</button>
        )}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 16px' }}>
          Simple, Affordable Pricing
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', margin: '0 0 16px' }}>
          Less than a chai per week. Ace your exams with PrepIQ. 🍵
        </p>
        <div style={{
          display: 'inline-block',
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: '12px',
          padding: '10px 20px',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: '1.6'
        }}>
          💡 <strong style={{ color: '#a78bfa' }}>1 mode = 1 generate</strong> &nbsp;·&nbsp;
          Re-uploading the same file won't use a generate for 24 hours &nbsp;·&nbsp;
          ✅ Smart caching saves your generates automatically
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px'
      }}>
        {plans.map(plan => {
          const isCurrentPlan = currentPlan === plan.id
          return (
            <div
              key={plan.id}
              style={{
                background: plan.popular ? `${plan.color}15` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isCurrentPlan ? plan.color : plan.popular ? `${plan.color}60` : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '20px',
                padding: '28px',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%',
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`,
                  color: 'white', padding: '4px 16px', borderRadius: '20px',
                  fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap'
                }}>⭐ Most Popular</div>
              )}

              {isCurrentPlan && (
                <div style={{
                  position: 'absolute', top: '-12px', right: '20px',
                  background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                  padding: '4px 12px', borderRadius: '20px',
                  fontSize: '0.7rem', fontWeight: '600'
                }}>✓ Active</div>
              )}

              <div style={{
                color: plan.color, fontWeight: '700', fontSize: '0.9rem',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{plan.name}</div>

              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>{plan.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginLeft: '6px' }}>/{plan.period}</span>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '0.78rem', color: plan.color, fontWeight: '600' }}>{plan.generates}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{plan.pages} · {plan.ai}</div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: plan.color, fontSize: '0.7rem' }}>✦</span>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCTA(plan.id)}
                disabled={isCurrentPlan || paymentLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  border: isCurrentPlan ? `1px solid ${plan.color}40` : 'none',
                  background: isCurrentPlan
                    ? 'transparent'
                    : plan.popular
                    ? `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`
                    : `${plan.color}20`,
                  color: isCurrentPlan ? plan.color : plan.popular ? 'white' : plan.color,
                  fontWeight: '700',
                  cursor: isCurrentPlan || paymentLoading ? 'default' : 'pointer',
                  fontSize: '0.9rem',
                  opacity: paymentLoading ? 0.7 : 1
                }}
              >
                {isCurrentPlan ? '✓ Current Plan' : paymentLoading ? 'Loading...' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{
        textAlign: 'center', marginTop: '48px',
        color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', lineHeight: '2'
      }}>
        <p>All prices include GST. Secure payments via Razorpay.</p>
        <p>Weekly and Pro plans cannot be active simultaneously.</p>
        <p>Each study mode counts as 1 generate. Switch modes freely within cached results.</p>
      </div>
    </div>
  )
}