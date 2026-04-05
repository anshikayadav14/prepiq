import { extractText } from 'unpdf'

// ─── PAGE LIMITS PER PLAN ─────────────────────────────────────────────────────
const PAGE_LIMITS = { free: 10, weekly: 25, pro: 50, promax: 150 }
const CHARS_PER_PAGE = 2000

// ─── GEMINI KEYS ──────────────────────────────────────────────────────────────
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean)

let geminiKeyIndex = 0
function getNextGeminiKey() {
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length]
  geminiKeyIndex++
  return key
}

// ─── FETCH WEBSITE TEXT ───────────────────────────────────────────────────────
async function fetchWebsiteText(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    const html = await response.text()
    const clean = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return clean
  } catch (err) {
    console.error('URL fetch error:', err)
    return ''
  }
}

function chunkText(text, chunkSize = 7000) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = start + chunkSize
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > start + 1000) end = breakPoint + 1
    }
    chunks.push(text.slice(start, end).trim())
    start = end
  }
  return chunks.filter(c => c.length > 50)
}

function safeParse(text) {
  let clean = text.replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) } catch {}
  const fixes = ['"}]}', '"}]}]}', '"]}', ']}', '}']
  for (const fix of fixes) {
    try { return JSON.parse(clean + fix) } catch {}
  }
  throw new Error('Could not parse AI response')
}

function getMaxTokens(mode, totalChunks, plan) {
  const multiplier = plan === 'free' ? 0.7 : 1

  if (mode === 'last-minute') return Math.floor(2500 * multiplier)
  if (mode === 'mcq') return Math.floor(4000 * multiplier)
  if (mode === 'quick-revision') return Math.floor(3500 * multiplier)
  if (mode === 'pyq') return Math.floor(6000 * multiplier)
  if (mode === 'exam-notes') {
    if (totalChunks === 1) return Math.floor(4500 * multiplier)
    if (totalChunks <= 3) return Math.floor(5500 * multiplier)
    return Math.floor(6000 * multiplier)
  }
  return Math.floor(4000 * multiplier)
}

// ─── GROQ API ─────────────────────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 5000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a JSON API. Respond with valid JSON only. No markdown, no extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: attempt === 0 ? 0.3 : 0.1, // retry pe lower temperature
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      })
    })
    const data = await response.json()
    
    // JSON validate failed — retry karo
    if (data.error?.code === 'json_validate_failed') {
      console.log(`JSON validation failed, attempt ${attempt + 1} — retrying...`)
      continue
    }
    
    if (!data.choices?.[0]) throw new Error('Groq API error: ' + JSON.stringify(data))
    return data.choices[0].message.content
  }
  throw new Error('Groq JSON generation failed after retries')
}

// ─── GEMINI API ───────────────────────────────────────────────────────────────
async function callGemini(prompt, maxTokens = 5000) {
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = getNextGeminiKey()
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
          })
        }
      )
      const data = await response.json()
      if (data.error?.code === 429) { console.log(`Gemini key ${attempt + 1} quota exceeded`); continue }
      if (!data.candidates?.[0]) throw new Error('Gemini error: ' + JSON.stringify(data))
      return data.candidates[0].content.parts[0].text
    } catch (err) {
      if (attempt === GEMINI_KEYS.length - 1) throw err
    }
  }
  throw new Error('All Gemini keys exhausted')
}

// ─── SMART AI CALLER ──────────────────────────────────────────────────────────
async function callAI(prompt, maxTokens) {
  try {
    const result = await callGroq(prompt, maxTokens)
    console.log('✓ Groq responded')
    return result
  } catch (err) {
    const isRateLimit = err.message.includes('rate_limit') || err.message.includes('Rate limit')
    if (isRateLimit && GEMINI_KEYS.length > 0) {
      console.log('Groq rate limited → Gemini fallback')
      return await callGemini(prompt, maxTokens)
    }
    throw err
  }
}

// ─── PDF EXTRACTION ───────────────────────────────────────────────────────────
async function extractTextWithFallback(arrayBuffer) {
  try {
    const { extractText } = await import('unpdf')
    const { text } = await extractText(new Uint8Array(arrayBuffer.slice(0)), { mergePages: false })
    const joined = Array.isArray(text) ? text.join('\n\n') : (text || '')
    return joined.trim()
  } catch (err) {
    console.error('fallback error:', err)
    return ''
  }
}

async function extractFileText(file) {
  if (!file || !file.name) return ''
  if (file.name.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer()
    const arrayBufferCopy = arrayBuffer.slice(0)
    try {
      const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      if (text && text.trim().length > 50) return text
    } catch (err) { console.error('unpdf error:', err) }
    return await extractTextWithFallback(arrayBufferCopy)
  }
  return await file.text()
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

function examNotesPrompt(chunk, exam, syllabus, chunkIndex, totalChunks) {
  return `You are Prepiq AI — expert exam coach for Indian ${exam} students.

${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nOnly cover topics present in this syllabus.` : 'Cover ALL topics found in the material.'}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

CORE MISSION: A student must be able to write a FULL MARKS exam answer using ONLY your output. Miss nothing from the source material.

OUTPUT DEPTH RULES (strictly follow):
- Match output depth EXACTLY to source material depth
- If source has 2-3 sentences on a topic → write 2-3 answer points
- If source has 1 paragraph → write 4-6 answer points  
- If source has 2+ paragraphs → write 8-12 answer points
- HARD CAP: Maximum 15 lines per topic answer — never exceed this
- Each point: 2-3 sentences, exam-ready, no padding
- Include ALL examples, formulas, facts exactly as in source
- NEVER skip any concept present in source material

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "topics": [
    {
      "title": "Topic name",
      "examFrequency": "High|Medium|Low",
      "examinerTip": "Specific tip for writing this in exam",
      "idealAnswer": {
        "definition": "Textbook-quality definition from source",
        "points": [
          "Point 1 — 2-3 sentences, exam-ready, include example if in source",
          "Point 2 — add as many points as source material requires (max 15 lines total)"
        ],
        "formula": "Exact formula if present in source, else empty string",
        "conclusion": "Concluding statement if present in source, else empty string"
      },
      "diagramCue": "Only if diagram is genuinely needed for exam, else empty string"
    }
  ],
  "mistakes": [
    {
      "topic": "Topic name",
      "wrong": "Common wrong answer",
      "correct": "Correct answer",
      "explanation": "Why this matters in exam"
    }
  ],
  "questions": [
    {
      "q": "Full exam-style question",
      "marks": 5,
      "priority": "High|Medium|Low",
      "reason": "Why frequently asked",
      "modelAnswer": {
        "definition": "Opening definition",
        "points": ["Point 1", "Point 2 — proportional to marks, max 15 lines total"],
        "formula": "",
        "conclusion": ""
      },
      "examinerNote": "What examiner specifically checks",
      "diagramCue": ""
    }
  ]
}

STRICT RULES:
- Include EVERY topic from chunk
- mistakes: only real errors, [] if none
- questions: 3-5 questions
- ONLY return JSON`
}

function mcqPrompt(chunk, exam, syllabus, chunkIndex, totalChunks) {
  return `You are Prepiq AI — MCQ specialist for Indian ${exam} students.

${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nOnly generate MCQs for topics in this syllabus.` : 'Generate MCQs for ALL topics in the material.'}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

CORE MISSION: Generate challenging MCQs that test DEEP understanding. A student who scores 100% should fully understand the subject.

MCQ QUALITY RULES:
- Mix of question types:
  - 20% real-life scenario: "A doctor notices...", "A student observes..."
  - 20% concept application: "Which best explains / Which would happen if..."
  - 30% definition based: test exact knowledge of concepts
  - 30% hard comparison: between similar concepts
- All options must be plausible — require deep thinking — no obviously wrong options
- Difficulty: mix of Easy, Medium, Hard 
- Options should be similar enough to require deep thinking
- Mix of: scenario-based, application, cause-effect, comparison questions
- Cover EVERY concept in the material — more content = more MCQs
- Aim for 8-15 MCQs per chunk depending on content richness

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "mcqs": [
    {
      "question": "Real-life scenario or application-based question — not just 'what is X'",
      "options": {
        "A": "Plausible option",
        "B": "Plausible option — similar to correct answer",
        "C": "Plausible option",
        "D": "Plausible option"
      },
      "correct": "A",
      "explanation": "Why this is correct + why other options are wrong — reference the concept",
      "topic": "Which concept this tests",
      "difficulty": "Medium|Hard",
      "examFrequency": "High|Medium|Low"
    }
  ]
}

RULES:
- NO "which of the following is incorrect" type questions
- NO purely definition-based questions like "What is X?"
- YES scenario, application, real-world questions
- ONLY return JSON`
}

function lastMinutePrompt(chunk, exam, syllabus, chunkIndex, totalChunks) {
  return `You are Prepiq AI — last minute revision specialist for Indian ${exam} students.

${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nOnly cover topics in this syllabus.` : 'Cover ALL topics from the material.'}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

CORE MISSION: Student has 1-2 hours before exam. Give ONLY what they need — crisp but complete. Nothing important should be missing.

CONTENT RULES:
- Cover EVERY topic in material
- mustKnow: core concept in 1-2 sentences
- keyPoints: crisp points — include the best example from source if present
- Hard cap: max 5-6 keyPoints per topic
- Formulas: include ALL exactly as in source
- Memory tricks: clever, genuinely memorable

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "topics": [
    {
      "title": "Topic name",
      "mustKnow": "Single most important concept — 1-2 sentences",
      "keyPoints": [
        "Crisp point with key example if in source — 1-2 sentences max",
        "Add points proportional to topic importance — max 5-6 points"
      ],
      "formula": "Exact formula if in source, else empty string",
      "memoryTrick": "Clever mnemonic or shortcut",
      "examFrequency": "High|Medium|Low",
      "likelyQuestion": "Most likely exam question in one line"
    }
  ],
  "quickFacts": ["Critical fact 1", "Critical fact 2"],
  "doNotForget": ["Common mistake 1", "Common mistake 2"]
}

RULES:
- Every topic from source must appear
- Keep crisp — never skip key examples
- ONLY return JSON`
}

function quickRevisionPrompt(chunk, exam, syllabus, chunkIndex, totalChunks) {
  return `You are Prepiq AI — quick revision specialist for Indian ${exam} students.

${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nOnly cover topics in this syllabus.` : 'Cover ALL topics from the material.'}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

CORE MISSION: Scannable revision material. Student glances and instantly recalls. More source content = more cards.

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "flashcards": [
    { "front": "Question or concept", "back": "Clear complete answer", "topic": "Topic", "difficulty": "Easy|Medium|Hard" }
  ],
  "oneLiners": [
    { "concept": "Term name", "oneLiner": "Single sentence definition" }
  ],
  "comparisons": [
    { "title": "X vs Y", "itemA": "X", "itemB": "Y", "points": [{ "aspect": "Aspect", "a": "X value", "b": "Y value" }] }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "Exact formula", "usedFor": "When to use" }
  ]
}

RULES:
- flashcards + oneLiners: one per every concept in source
- comparisons: ONLY if source genuinely compares, else []
- formulas: ALL from source exactly, else []
- ONLY return JSON`
}

function pyqPrompt(notesChunk, pyqContent, exam, chunkIndex, totalChunks) {
  return `You are Prepiq AI — PYQ analysis specialist for Indian ${exam} students.

STUDENT'S NOTES (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${notesChunk}
"""

PREVIOUS YEAR QUESTIONS:
"""
${pyqContent}
"""

CORE MISSION: Map every topic to past questions. Student knows exactly what to study and how to answer.

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "pyqAnalysis": [
    {
      "topic": "Topic from notes",
      "importance": "High|Medium|Low",
      "importanceReason": "Based on PYQ frequency",
      "pyqMatches": [
        {
          "question": "Exact question from paper",
          "year": "Year or Sample Paper",
          "marks": 5,
          "questionType": "Short Answer|Long Answer|MCQ|Numerical",
          "howToAnswer": "Specific tip — what to write first, which examples to use"
        }
      ],
      "topicTip": "One specific exam tip"
    }
  ],
  "hotTopics": [{ "topic": "Topic", "count": 3, "totalMarks": 15 }],
  "paperInsights": {
    "totalQuestionsFound": 10,
    "mostAskedTopic": "Topic name",
    "recommendedFocus": "2-3 sentence study strategy"
  }
}

RULES:
- Every topic from notes must appear
- year: extract from paper if visible, else "Sample Paper"
- ONLY return JSON`
}

// ─── MERGE HELPERS ────────────────────────────────────────────────────────────
function mergeExamNotes(results) {
  const base = { subject: '', chapter: '', topics: [], mistakes: [], questions: [] }
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.topics)) base.topics.push(...c.topics)
    if (Array.isArray(c.mistakes)) base.mistakes.push(...c.mistakes)
    if (Array.isArray(c.questions)) base.questions.push(...c.questions)
  }
  return base
}

function mergeMCQ(results) {
  const base = { subject: '', chapter: '', mcqs: [] }
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.mcqs)) base.mcqs.push(...c.mcqs)
  }
  return base
}

function mergeLastMinute(results) {
  const base = { subject: '', chapter: '', topics: [], quickFacts: [], doNotForget: [] }
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.topics)) base.topics.push(...c.topics)
    if (Array.isArray(c.quickFacts)) base.quickFacts.push(...c.quickFacts)
    if (Array.isArray(c.doNotForget)) base.doNotForget.push(...c.doNotForget)
  }
  return base
}

function mergeQuickRevision(results) {
  const base = { subject: '', chapter: '', flashcards: [], oneLiners: [], comparisons: [], formulas: [] }
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.flashcards)) base.flashcards.push(...c.flashcards)
    if (Array.isArray(c.oneLiners)) base.oneLiners.push(...c.oneLiners)
    if (Array.isArray(c.comparisons)) base.comparisons.push(...c.comparisons)
    if (Array.isArray(c.formulas)) base.formulas.push(...c.formulas)
  }
  return base
}

function mergePYQ(results) {
  const base = { subject: '', chapter: '', pyqAnalysis: [], hotTopics: [], paperInsights: null }
  const hotTopicsMap = {}
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.pyqAnalysis)) base.pyqAnalysis.push(...c.pyqAnalysis)
    if (!base.paperInsights && c.paperInsights) base.paperInsights = c.paperInsights
    if (Array.isArray(c.hotTopics)) {
      for (const h of c.hotTopics) {
        if (hotTopicsMap[h.topic]) {
          hotTopicsMap[h.topic].count += h.count || 0
          hotTopicsMap[h.topic].totalMarks += h.totalMarks || 0
        } else {
          hotTopicsMap[h.topic] = { ...h }
        }
      }
    }
  }
  base.hotTopics = Object.values(hotTopicsMap).sort((a, b) => b.count - a.count).slice(0, 10)
  return base
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const formData = await request.formData()
    const exam = formData.get('exam') || 'General'
    const mode = formData.get('mode') || 'exam-notes'
    const syllabus = formData.get('syllabus') || ''
    const plan = formData.get('plan') || 'free'
    const urls = formData.getAll('urls')
    const noteFiles = formData.getAll('notes')
    const pyqFiles = formData.getAll('pyqFiles')

    let content = ''
    let pyqContent = ''

    for (const file of noteFiles) {
      if (!file || !file.name) continue
      const text = await extractFileText(file)
      if (text) content += text + '\n\n---\n\n'
    }

    for (const url of urls) {
      if (url && url.trim()) {
        const text = await fetchWebsiteText(url.trim())
        if (text) content += text + '\n\n---\n\n'
      }
    }

    for (const file of pyqFiles) {
      if (!file || !file.name) continue
      const text = await extractFileText(file)
      if (text) pyqContent += text + '\n\n---\n\n'
    }

    if (!content || content.trim().length < 10) {
      return Response.json({ success: false, error: 'Could not extract text. Please use a text-based PDF or paste a URL.' }, { status: 400 })
    }

    if (mode === 'pyq' && !pyqContent.trim()) {
      return Response.json({ success: false, error: 'Please upload at least one PYQ or sample paper.' }, { status: 400 })
    }

    // ─── PAGE LIMIT CHECK ─────────────────────────────────────────────────────
    const pageLimit = PAGE_LIMITS[plan] || PAGE_LIMITS.free
    const charLimit = pageLimit * CHARS_PER_PAGE
    const estimatedPages = Math.ceil(content.length / CHARS_PER_PAGE)
    const processPages = formData.get('processPages')

    if (content.length > charLimit) {
      if (processPages === 'partial') {
        content = content.slice(0, charLimit)
        console.log(`Truncated to ${pageLimit} pages`)
      } else {
        return Response.json({ success: false, error: 'page_limit_exceeded', estimatedPages, pageLimit, plan }, { status: 400 })
      }
    }

    const chunks = chunkText(content, 7000)
    const results = []
    const pyqSlice = pyqContent.slice(0, 6000)

    console.log(`Processing ${chunks.length} chunks — Groq primary, Gemini fallback`)

    for (let i = 0; i < chunks.length; i++) {
      let prompt = ''
      if (mode === 'exam-notes') prompt = examNotesPrompt(chunks[i], exam, syllabus, i, chunks.length)
      else if (mode === 'mcq') prompt = mcqPrompt(chunks[i], exam, syllabus, i, chunks.length)
      else if (mode === 'last-minute') prompt = lastMinutePrompt(chunks[i], exam, syllabus, i, chunks.length)
      else if (mode === 'quick-revision') prompt = quickRevisionPrompt(chunks[i], exam, syllabus, i, chunks.length)
      else if (mode === 'pyq') prompt = pyqPrompt(chunks[i], pyqSlice, exam, i, chunks.length)

      const raw = await callAI(prompt, getMaxTokens(mode, chunks.length, plan))
      const parsed = safeParse(raw)
      results.push(parsed)

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }

    let merged
    if (mode === 'exam-notes') merged = mergeExamNotes(results)
    else if (mode === 'mcq') merged = mergeMCQ(results)
    else if (mode === 'last-minute') merged = mergeLastMinute(results)
    else if (mode === 'quick-revision') merged = mergeQuickRevision(results)
    else if (mode === 'pyq') merged = mergePYQ(results)

    return Response.json({ success: true, data: merged, mode, totalChunks: chunks.length })

  } catch (error) {
    console.error('Route error:', error)
    
    let userMessage = 'Something went wrong. Please try again.'
    
    if (error.message.includes('rate_limit') || error.message.includes('Rate limit')) {
      userMessage = 'Our servers are busy right now. Please try again in a minute.'
    } else if (error.message.includes('quota') || error.message.includes('exhausted')) {
      userMessage = 'Our servers are busy right now. Please try again in a minute.'
    } else if (error.message.includes('parse') || error.message.includes('JSON') || error.message.includes('json_validate')) {
      userMessage = 'Something went wrong while processing. Please try again.'
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.'
    }
    
    return Response.json({ success: false, error: userMessage }, { status: 500 })
  }
}