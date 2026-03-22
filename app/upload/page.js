export default function Upload() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#05050a',
      color: '#f0eeff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.85rem 1.5rem',
        background: '#0d0d15',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <span style={{
          fontFamily: 'sans-serif',
          fontWeight: '800',
          fontSize: '1.2rem',
          letterSpacing: '-0.05em'
        }}>
          Prep<span style={{color:'#a29bfe'}}>iq</span>
        </span>
        <span style={{color:'rgba(255,255,255,0.3)'}}>|</span>
        <span style={{fontWeight:'700', fontSize:'0.9rem'}}>
          Upload Your Material
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        overflow: 'hidden'
      }}>

        {/* Left Controls */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: '#0d0d15',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto'
        }}>

          {/* Context box */}
          <div style={{
            background: 'rgba(108,92,231,0.1)',
            border: '1px solid rgba(108,92,231,0.2)',
            borderRadius: '12px',
            padding: '0.9rem 1rem'
          }}>
            <div style={{fontWeight:'700', fontSize:'0.85rem', marginBottom:'0.3rem'}}>
              Here's what to do 👇
            </div>
            <div style={{fontSize:'0.74rem', color:'rgba(240,238,255,0.6)', lineHeight:'1.55'}}>
              Upload whatever you have — messy, incomplete, PPT, anything. Add your syllabus if you have it. Then generate.
            </div>
          </div>

          {/* Notes Upload */}
          <div>
            <div style={{fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.09em', color:'rgba(240,238,255,0.38)', marginBottom:'0.38rem'}}>
              📑 Notes / PPT *
            </div>
            <div style={{
              border: '2px dashed rgba(108,92,231,0.3)',
              borderRadius: '12px',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(108,92,231,0.03)'
            }}>
              <div style={{fontSize:'1.8rem', marginBottom:'0.5rem'}}>📑</div>
              <div style={{fontWeight:'700', fontSize:'0.85rem', marginBottom:'0.22rem'}}>
                Drop files or click to upload
              </div>
              <div style={{fontSize:'0.71rem', color:'rgba(240,238,255,0.38)'}}>
                Messy is fine — that's exactly what we fix
              </div>
            </div>
          </div>

          {/* Syllabus Upload */}
          <div>
            <div style={{fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.09em', color:'rgba(240,238,255,0.38)', marginBottom:'0.38rem'}}>
              📋 Syllabus (optional)
            </div>
            <div style={{
              border: '1.5px dashed rgba(0,206,201,0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              cursor: 'pointer',
              background: 'rgba(0,206,201,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <span style={{fontSize:'1.4rem'}}>📋</span>
              <div>
                <div style={{fontWeight:'700', fontSize:'0.8rem', marginBottom:'0.1rem'}}>
                  Upload Syllabus
                </div>
                <div style={{fontSize:'0.68rem', color:'rgba(240,238,255,0.38)'}}>
                  AI focuses only on what's in your exam
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.85rem',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}>
            ⚡ Get Exam-Ready Notes
          </button>

        </div>

        {/* Right Output */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2.5rem',
          gap: '1rem',
          color: 'rgba(240,238,255,0.38)'
        }}>
          <div style={{fontSize:'3.5rem', opacity:'0.2'}}>📖</div>
          <div style={{
            fontWeight:'700',
            fontSize:'1.05rem',
            color:'rgba(240,238,255,0.6)'
          }}>
            Your output will appear here
          </div>
          <div style={{fontSize:'0.78rem', lineHeight:'1.65', maxWidth:'300px'}}>
            Upload your notes and generate — every topic's ideal exam answer will be ready
          </div>
        </div>

      </div>
    </main>
  )
}