'use client'
import { useState } from 'react'

export default function Upload() {
  const [noteFiles, setNoteFiles] = useState([])
  const [sylFile, setSylFile] = useState(null)

  function handleNotes(e) {
    const files = Array.from(e.target.files)
    setNoteFiles(prev => [...prev, ...files])
  }

  function handleSyl(e) {
    setSylFile(e.target.files[0])
  }

  function removeNote(name) {
    setNoteFiles(prev => prev.filter(f => f.name !== name))
  }

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
        minHeight: 0
      }}>

        {/* Left */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: '#0d0d15',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto'
        }}>

          {/* Context */}
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

          {/* Notes Upload Zone */}
          <div>
            <div style={{fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.09em', color:'rgba(240,238,255,0.38)', marginBottom:'0.38rem'}}>
              📑 Notes / PPT *
            </div>
            <label style={{
              display: 'block',
              border: '2px dashed rgba(108,92,231,0.3)',
              borderRadius: '12px',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(108,92,231,0.03)'
            }}>
              <input
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg"
                onChange={handleNotes}
                style={{display:'none'}}
              />
              <div style={{fontSize:'1.8rem', marginBottom:'0.5rem'}}>📑</div>
              <div style={{fontWeight:'700', fontSize:'0.85rem', marginBottom:'0.22rem'}}>
                Drop files or click to upload
              </div>
              <div style={{fontSize:'0.71rem', color:'rgba(240,238,255,0.38)'}}>
                PPT, PDF, Word, Image — anything works
              </div>
            </label>
          </div>

          {/* File Queue */}
          {noteFiles.length > 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
              <div style={{fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.09em', color:'rgba(240,238,255,0.38)'}}>
                Files ready
              </div>
              {noteFiles.map(f => (
                <div key={f.name} style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  background:'#13131e',
                  border:'1px solid rgba(108,92,231,0.25)',
                  borderRadius:'8px',
                  padding:'0.48rem 0.65rem'
                }}>
                  <span style={{fontSize:'0.95rem'}}>📄</span>
                  <span style={{fontSize:'0.76rem', fontWeight:'600', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {f.name}
                  </span>
                  <button
                    onClick={() => removeNote(f.name)}
                    style={{background:'none', border:'none', color:'rgba(240,238,255,0.38)', cursor:'pointer', fontSize:'0.8rem'}}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Syllabus Upload */}
          <div>
            <div style={{fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.09em', color:'rgba(240,238,255,0.38)', marginBottom:'0.38rem'}}>
              📋 Syllabus (optional)
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              border: '1.5px dashed rgba(0,206,201,0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              cursor: 'pointer',
              background: sylFile ? 'rgba(0,206,201,0.07)' : 'rgba(0,206,201,0.03)'
            }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                onChange={handleSyl}
                style={{display:'none'}}
              />
              <span style={{fontSize:'1.4rem'}}>📋</span>
              <div>
                <div style={{fontWeight:'700', fontSize:'0.8rem', marginBottom:'0.1rem'}}>
                  {sylFile ? sylFile.name : 'Upload Syllabus'}
                </div>
                <div style={{fontSize:'0.68rem', color: sylFile ? '#00cec9' : 'rgba(240,238,255,0.38)'}}>
                  {sylFile ? '✅ Syllabus uploaded' : "Don't have it? No problem."}
                </div>
              </div>
            </label>
          </div>

          {/* Generate Button */}
          <button
            disabled={noteFiles.length === 0}
            style={{
              width: '100%',
              background: noteFiles.length > 0
                ? 'linear-gradient(135deg, #6c5ce7, #8e44ad)'
                : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: noteFiles.length > 0 ? 'pointer' : 'not-allowed',
              opacity: noteFiles.length > 0 ? 1 : 0.5
            }}
          >
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

          {/* What you'll get */}
          <div style={{
            display:'flex', flexDirection:'column', gap:'0.5rem',
            width:'100%', maxWidth:'340px', marginTop:'0.5rem'
          }}>
            {[
              {ico:'✍️', t:'Ideal exam answers', s:'Topper format — ready to write'},
              {ico:'🎓', t:'Examiner expects', s:'What gets full marks'},
              {ico:'✏️', t:'Diagram instructions', s:'What to draw and label'},
              {ico:'🎯', t:'Important questions', s:'With complete model answers'},
              {ico:'⚠️', t:'Mistakes caught', s:'Wrong facts corrected'},
            ].map(item => (
              <div key={item.t} style={{
                display:'flex', alignItems:'center', gap:'0.7rem',
                background:'#0d0d15',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'10px',
                padding:'0.65rem 0.9rem',
                textAlign:'left'
              }}>
                <span style={{fontSize:'1.1rem'}}>{item.ico}</span>
                <div>
                  <div style={{fontSize:'0.79rem', fontWeight:'600', marginBottom:'0.08rem', color:'#f0eeff'}}>
                    {item.t}
                  </div>
                  <div style={{fontSize:'0.67rem', color:'rgba(240,238,255,0.38)'}}>
                    {item.s}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}