import { extractText } from 'unpdf'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const exam = formData.get('exam') || 'General'
    const syllabus = formData.get('syllabus') || ''

    const noteFiles = formData.getAll('notes')
    let content = ''

    for (const file of noteFiles) {
      if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
        content += text + '\n\n---\n\n'
      } else {
        // txt, ppt, pptx, doc, docx — read as text
        const text = await file.text()
        content += text + '\n\n---\n\n'
      }
    }

    content = content.slice(0, 8000)

    if (!content || content.trim().length < 10) {
      return Response.json({ success: false, error: 'Could not extract text from files.' }, { status: 400 })
    }

    const prompt = `You are Prepiq AI — an expert exam coach for Indian students appearing for ${exam}.

${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nStrictly only cover topics present in this syllabus.` : 'No syllabus provided — cover all important topics from the material.'}

STUDENT'S STUDY MATERIAL:
"""
${content}
"""

Your job is to convert this into DETAILED, EXAM-READY notes exactly like a university topper would write for 10-15 mark answers.

STRICT RULES:
- idealAnswer points must be 5-8 sentences each — elaborate like a 15-mark university exam answer with examples, explanations, and real-world applications
- definitions must be 3-4 sentences — textbook quality, complete and precise
- examinerTip must be SPECIFIC and actionable — mention exact marks distribution e.g. 2 marks definition, 4 marks explanation, 2 marks diagram
- questions must be actual exam-style questions from ${exam} previous papers style
- modelAnswer points must be 5-8 sentences each — elaborated enough to fetch full marks
- diagramCue must ONLY be filled if a diagram is genuinely important and commonly asked for this topic in ${exam} exams. If no diagram is needed, return empty string ""
- MISTAKES ARE CRITICAL — only add a mistake if it is a REAL conceptual error found in the material or commonly made by students on this exact topic. If there is genuinely no mistake, return an empty array. NEVER fabricate or force mistakes.
- conclusions must be 3-4 sentences — mention real-world applications, limitations, and future scope
- formula must ONLY be filled if there is an actual formula for this topic. If no formula exists, return empty string ""

Return ONLY this JSON (no extra text, no markdown):
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "topics": [
    {
      "title": "Topic name",
      "examFrequency": "High|Medium|Low",
      "examinerTip": "Specific tip with marks distribution",
      "idealAnswer": {
        "definition": "3-4 sentence textbook definition",
        "points": [
          "Point 1 — 5-8 sentence detailed explanation with example and real-world application",
          "Point 2 — 5-8 sentence detailed explanation with example and real-world application",
          "Point 3 — 5-8 sentence detailed explanation with example and real-world application",
          "Point 4 — 5-8 sentence detailed explanation with example and real-world application"
        ],
        "formula": "",
        "conclusion": "3-4 sentence conclusion with applications and limitations"
      },
      "diagramCue": ""
    }
  ],
  "mistakes": [],
  "questions": [
    {
      "q": "Full exam question",
      "marks": 10,
      "priority": "High|Medium|Low",
      "reason": "Why important",
      "modelAnswer": {
        "definition": "3-4 sentence opening definition",
        "points": [
          "Point 1 — 5-8 sentence detailed answer",
          "Point 2 — 5-8 sentence detailed answer",
          "Point 3 — 5-8 sentence detailed answer",
          "Point 4 — 5-8 sentence detailed answer"
        ],
        "formula": "",
        "conclusion": "3-4 sentence conclusion"
      },
      "examinerNote": "What examiner checks",
      "diagramCue": ""
    }
  ]
}

Generate 4-5 topics, only real mistakes (empty array if none found), 8-10 questions. ONLY JSON.`

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 6000
        })
      }
    )

    const data = await response.json()

    if (!data.choices || !data.choices[0]) {
      return Response.json({
        success: false,
        error: 'Groq API error: ' + JSON.stringify(data)
      }, { status: 500 })
    }

    const text = data.choices[0].message.content
    let clean = text.replace(/```json|```/g, '').trim()

    try {
      JSON.parse(clean)
    } catch {
      const lastComplete = clean.lastIndexOf('    }')
      if (lastComplete !== -1) {
        clean = clean.substring(0, lastComplete + 5)
        clean = clean + '\n  ]\n}'
      }
    }

    const parsed = JSON.parse(clean)
    return Response.json({ success: true, data: parsed })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}