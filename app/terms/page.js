export default function TermsOfService() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px', margin: '0 auto', padding: '60px 24px',
        fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.8)', lineHeight: '1.8'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'white' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Last updated: April 2026</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>1. Acceptance of Terms</h2>
        <p>By using PrepIQ, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>2. Service Description</h2>
        <p>PrepIQ is an AI-powered exam preparation platform that generates study notes, MCQs, and revision material from uploaded documents.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>3. User Responsibilities</h2>
        <p>You are responsible for the content you upload. Do not upload copyrighted material without permission. Use PrepIQ only for personal, non-commercial study purposes.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>4. Payment & Refunds</h2>
        <p>Payments are processed securely via Razorpay. Plans are non-refundable once activated. Weekly plans expire after 7 days, Pro plans after 30 days.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>5. Limitation of Liability</h2>
        <p>PrepIQ provides AI-generated content for study assistance only. We are not responsible for any errors in generated content. Always verify important information.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>6. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of PrepIQ after changes means you accept the new terms.</p>

        <h2 style={{ color: '#a78bfa', marginTop: '32px' }}>7. Contact</h2>
        <p>For any questions, contact us at: anshika.yadav14206@gmail.com</p>
      </div>
    </div>
  )
}