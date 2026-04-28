export default function PrivacyPolicy() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px', margin: '0 auto', padding: '60px 24px',
        fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.8)', lineHeight: '1.8'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'white' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Last updated: April 2026</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>1. Information We Collect</h2>
        <p>We collect your email address and name when you sign in with Google. We also collect the study materials you upload to generate notes.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>2. How We Use Your Information</h2>
        <p>Your information is used solely to provide PrepIQ services — generating study notes, tracking your usage limits, and managing your account.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>3. Data Storage</h2>
        <p>Your account data is stored securely using Supabase. Uploaded files are processed temporarily and not stored permanently.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>4. Third Party Services</h2>
        <p>We use Google OAuth for authentication, OpenAI for AI-powered note generation, and Razorpay for payment processing.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>5. Data Sharing</h2>
        <p>We do not sell or share your personal data with third parties except as required to provide our services.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>6. Contact</h2>
        <p>For any privacy concerns, contact us at: anshika.yadav14206@gmail.com</p>
      </div>
    </div>
  )
}