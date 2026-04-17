import { extractText } from 'unpdf'
import mammoth from 'mammoth'

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
async function createRouteClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const { createServerClient } = await import('@supabase/ssr')
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  )
}
// ─── PAGE LIMITS PER PLAN ─────────────────────────────────────────────────────
const PAGE_LIMITS = { free: 10, weekly: 25, pro: 50, promax: 150 }
const CHARS_PER_PAGE = 2000

// ─── OPENAI key ──────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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

// ─── SUBJECT DETECTION ────────────────────────────────────────────────────────
function detectSubjectType(text) {
  const lower = text.toLowerCase()

  const signals = {
    poetry: ['stanza', 'rhyme', 'verse', 'poet', 'poem', 'poetry', 'imagery',
      'metaphor', 'simile', 'alliteration', 'refrain', 'couplet', 'quatrain',
      'personification', 'assonance', 'ode', 'sonnet', 'ballad', 'rhyme scheme',
      'onomatopoeia', 'symbolism', 'lyric', 'haiku'],

    prose: ['character', 'narrator', 'protagonist', 'antagonist', 'plot', 'theme',
      'setting', 'dialogue', 'chapter', 'novel', 'author', 'passage',
      'extract', 'comprehension', 'short story', 'lesson', 'moral'],

    math: ['theorem', 'proof', 'derive', 'derivation', 'equation', 'integral',
      'derivative', 'matrix', 'determinant', 'probability', 'trigonometry',
      'logarithm', 'binomial', 'coordinate', 'vector', 'calculus', 'differentiate',
      'integrate', 'limit', 'series', 'sequence'],

    physics: ['force', 'velocity', 'acceleration', 'momentum', 'energy', 'power',
      'wave', 'frequency', 'amplitude', 'electric field', 'magnetic field',
      'circuit', 'resistance', 'capacitor', 'inductor', 'optics', 'lens',
      'refraction', 'quantum', 'nucleus', 'radioactive', 'thermodynamics',
      'entropy', 'gravitation', 'orbital'],

    chemistry: ['reaction', 'compound', 'molecule', 'oxidation', 'reduction',
      'titration', 'molar', 'bond', 'electron', 'hybridization',
      'polymer', 'acid', 'base', 'electrode', 'electrolysis',
      'catalyst', 'equilibrium', 'enthalpy', 'organic', 'inorganic',
      'benzene', 'functional group', 'isomer', 'aldehyde', 'ketone'],

    biology: ['cell', 'organism', 'dna', 'rna', 'chromosome', 'enzyme',
      'photosynthesis', 'respiration', 'mitosis', 'meiosis', 'tissue', 'organ',
      'protein', 'amino acid', 'hormone', 'nervous system', 'digestion',
      'ecosystem', 'evolution', 'genetics', 'mutation', 'bacteria', 'virus',
      'taxonomy', 'morphology', 'physiology', 'reproduction'],

    psychology: ['behaviour', 'behavior', 'cognition', 'perception', 'memory',
      'learning', 'emotion', 'motivation', 'personality', 'intelligence',
      'sigmund freud', 'piaget', 'psychoanalysis', 'classical conditioning',
      'operant conditioning', 'reinforcement', 'stimulus', 'response',
      'mental disorder', 'anxiety', 'depression', 'therapy', 'counselling',
      'cognitive', 'behavioural', 'humanistic', 'gestalt', 'unconscious',
      'id', 'ego', 'superego', 'defence mechanism', 'attitude', 'social influence'],

    history: ['dynasty', 'empire', 'revolution', 'war', 'treaty', 'colonial',
      'independence', 'civilization', 'century', 'reign', 'invasion',
      'movement', 'partition', 'nationalism', 'imperialism', 'feudal',
      'mughal', 'british', 'freedom struggle', 'amendment'],

    geography: ['latitude', 'longitude', 'climate', 'monsoon', 'river', 'mountain',
      'plateau', 'soil', 'vegetation', 'rainfall', 'temperature', 'ocean',
      'continent', 'earthquake', 'volcano', 'erosion', 'delta', 'basin'],

    polity: ['article', 'constitution', 'parliament', 'fundamental right', 'directive',
      'president', 'governor', 'judiciary', 'preamble', 'election',
      'legislature', 'executive', 'federal', 'supreme court', 'high court'],

    economy: ['gdp', 'inflation', 'monetary policy', 'fiscal policy', 'budget',
      'taxation', 'trade', 'deficit', 'surplus', 'rbi', 'scheme',
      'poverty', 'unemployment', 'subsidy', 'disinvestment'],

    law: ['section', 'provision', 'act', 'clause', 'statute',
      'jurisdiction', 'liability', 'plaintiff', 'defendant', 'judgment',
      'petition', 'appeal', 'tribunal', 'contract', 'tort', 'criminal',
      'civil', 'ipc', 'crpc'],

    accounts: ['journal entry', 'ledger', 'trial balance', 'balance sheet',
      'profit and loss', 'debit', 'credit', 'depreciation', 'provision',
      'goodwill', 'cash flow', 'ratio analysis', 'ind as', 'as '],

    dsa: ['algorithm', 'complexity', 'array', 'linked list', 'binary tree',
      'sorting', 'recursion', 'stack', 'queue', 'graph', 'dynamic programming',
      'greedy', 'hash', 'heap', 'traversal', 'time complexity', 'space complexity',
      'big o', 'bfs', 'dfs', 'binary search'],

    os: ['process', 'thread', 'scheduling', 'deadlock', 'memory management',
      'paging', 'segmentation', 'virtual memory', 'semaphore', 'mutex',
      'context switch', 'page fault', 'thrashing', 'file system'],

    dbms: ['sql', 'normalization', 'er diagram', 'transaction', 'acid',
      'primary key', 'foreign key', 'join', 'index', 'trigger',
      'relational', 'functional dependency', 'bcnf', 'concurrency'],

    networks: ['osi', 'tcp', 'ip', 'http', 'dns', 'routing', 'switching',
      'protocol', 'subnet', 'mac address', 'bandwidth', 'latency',
      'firewall', 'socket', 'congestion', 'sliding window'],

    ml_ai: ['neural network', 'machine learning', 'deep learning', 'natural language processing',
      'nlp', 'tokenization', 'transformer', 'bert', 'gpt', 'sentiment analysis',
      'classification', 'regression', 'clustering', 'feature extraction', 'training data',
      'overfitting', 'underfitting', 'gradient descent', 'backpropagation', 'epoch',
      'convolutional', 'recurrent', 'lstm', 'attention mechanism', 'word embedding',
      'word2vec', 'tf-idf', 'bag of words', 'named entity', 'pos tagging',
      'supervised learning', 'unsupervised learning', 'reinforcement learning',
      'random forest', 'svm', 'support vector', 'decision tree', 'naive bayes',
      'precision', 'recall', 'f1 score', 'confusion matrix', 'corpus', 'vocabulary'],

    software_eng: ['sdlc', 'agile', 'scrum', 'waterfall', 'sprint', 'uml',
      'design pattern', 'solid principles', 'object oriented', 'class diagram',
      'use case', 'requirement', 'software testing', 'unit test', 'integration test',
      'version control', 'git', 'ci/cd', 'deployment', 'refactoring',
      'coupling', 'cohesion', 'mvc', 'api design', 'microservices'],

    comp_arch: ['cache', 'pipeline', 'instruction set', 'registers', 'alu',
      'cpu', 'fetch decode execute', 'memory hierarchy', 'risc', 'cisc',
      'clock cycle', 'bus', 'interrupt', 'dma', 'assembly language',
      'addressing mode', 'branch prediction', 'virtual memory'],

    compiler: ['lexical analysis', 'syntax analysis', 'semantic analysis',
      'parse tree', 'abstract syntax tree', 'token', 'grammar', 'cfg',
      'll parser', 'lr parser', 'symbol table', 'intermediate code',
      'code generation', 'code optimization', 'ambiguous grammar',
      'first set', 'follow set', 'shift reduce'],

    cyber_security: ['encryption', 'decryption', 'vulnerability', 'attack', 'malware',
      'phishing', 'firewall', 'intrusion detection', 'authentication', 'authorization',
      'cryptography', 'rsa', 'aes', 'hash function', 'digital signature',
      'ssl', 'tls', 'penetration testing', 'cyber threat', 'ransomware'],

    statistics: ['mean', 'median', 'mode', 'variance', 'standard deviation',
      'hypothesis testing', 'p-value', 'confidence interval', 'correlation',
      'normal distribution', 'binomial distribution', 'poisson distribution',
      'chi square', 'anova', 'regression analysis', 'sampling', 'population',
      'null hypothesis', 'type 1 error', 'type 2 error', 'z test', 't test'],

    sociology: ['society', 'culture', 'norms', 'values', 'institution',
      'stratification', 'caste', 'class', 'gender', 'social mobility',
      'socialization', 'deviance', 'social control', 'collective behavior',
      'urbanization', 'industrialization', 'social change', 'marx', 'durkheim', 'weber'],

    business: ['marketing', 'management', 'hrm', 'entrepreneurship', 'branding',
      'consumer behavior', 'market segmentation', 'swot', 'pestle',
      'supply chain', 'logistics', 'inventory', 'revenue', 'profit margin',
      'business model', 'startup', 'venture capital', 'stakeholder',
      'corporate governance', 'csr'],

    environment: ['pollution', 'carbon emission', 'biodiversity', 'deforestation',
      'climate change', 'greenhouse gas', 'ozone layer', 'sustainability',
      'renewable energy', 'fossil fuel', 'habitat', 'endangered species',
      'food chain', 'carbon cycle', 'water cycle', 'global warming',
      'paris agreement', 'kyoto protocol'],
  }
  const counts = {}
  for (const [subject, words] of Object.entries(signals)) {
    counts[subject] = words.filter(w => lower.includes(w)).length
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top[1] >= 2 ? top[0] : 'general'
}

// ─── EXAM PROFILE ─────────────────────────────────────────────────────────────
function getExamProfile(exam) {
  const e = exam.toLowerCase()
  if (e.includes('jee advanced')) return 'jee_advanced'
  if (e.includes('jee main')) return 'jee_main'
  if (e.includes('neet')) return 'neet'
  if (e.includes('upsc')) return 'upsc'
  if (e.includes('mbbs') || e.includes('medical') || e.includes('fmge')) return 'mbbs'
  if (e.includes('cbse 10') || e.includes('cbse10')) return 'cbse10'
  if (e.includes('cbse 12') || e.includes('cbse12')) return 'cbse12'
  if (e.includes('gate')) return 'gate'
  if (e.includes('b.tech') || e.includes('btech')) return 'btech'
  if (e.includes('ca ') || e === 'ca') return 'ca'
  if (e.includes('mba')) return 'mba'
  if (e.includes('ba ') || e === 'ba' || e.includes('b.a')) return 'ba'
  if (e.includes('bsc') || e.includes('b.sc') || e === 'bsc') return 'bsc'
  if (e.includes('bcom') || e.includes('b.com') || e === 'bcom') return 'bcom'
  if (e.includes('dsc') || e.includes('political science') || e.includes('pol science')) return 'ba'
  if (e.includes('sociology') || e.includes('economics hons') || e.includes('history hons')) return 'ba'
  if (e.includes('law') || e.includes('llb') || e.includes('clat')) return 'law'
  if (e.includes('class 10') || e.includes('10th')) return 'cbse10'
  if (e.includes('class 12') || e.includes('12th')) return 'cbse12'
  return 'general'
}

// ─── GAP FILL ALLOWED? ────────────────────────────────────────────────────────
function canAIFillGaps(examProfile) {
  const noFill = ['jee_advanced', 'jee_main', 'neet', 'gate']
  return !noFill.includes(examProfile)
}

// ─── SUBJECT + EXAM INSTRUCTIONS ─────────────────────────────────────────────
function getSubjectExamInstructions(subjectType, examProfile, canFill) {
  if (subjectType === 'poetry' || subjectType === 'prose') return ''

  const gapRule = canFill
    ? `GAP FILL RULE: If a concept seems incomplete in the source, fill in the missing standard points and clearly label them as "📚 Added by PrepIQ AI".`
    : `GAP RULE: ONLY use what is present in the uploaded text. If a topic seems incomplete, note: "⚠️ Your notes on this topic seem incomplete." Do NOT add any content from outside the uploaded text.`

  let i = `\n${gapRule}\n`

  // ── MATH ──────────────────────────────────────────────────────────────────
  if (subjectType === 'math') {
    if (examProfile === 'jee_advanced') {
      i += `
MATH (JEE ADVANCED):
- Derivations: step-by-step ONLY if present in source. Each step explained. Do NOT add derivations not in source.
- Numericals: approach → key formula → steps → final answer. Never skip steps.
- Theorems: state precisely, prove ONLY if proof is in source.
- Questions: multi-correct type, integer type.
- Graphs: mention graph shape/behavior if discussed in source.
- Speed shortcuts: highlight if present in source.
`
    } else if (examProfile === 'jee_main') {
      i += `
MATH (JEE MAIN):
- Formulas: what each variable means + conditions of applicability.
- Direct application numericals from source — step by step.
- Speed-focused: shortcuts and direct formulas highlighted.
- Standard question types from source.
`
    } else if (examProfile === 'cbse12' || examProfile === 'cbse10') {
      i += `
MATH (CBSE):
- Every formula: what each variable means.
- Theorems + proofs if in source (board-asked: Pythagoras, BPT, etc).
- Step marking awareness: show ALL steps — marks given per step.
- 3-mark: 3-4 steps. 5-mark: 6-8 steps.
- Constructions: mention steps clearly if present.
`
    } else if (examProfile === 'gate') {
      i += `
MATH (GATE):
- All formulas with conditions.
- Proofs/derivations if in source.
- Numerical examples step-by-step.
- Linear algebra: rank, eigenvalues, eigenvectors.
- Probability: all standard formulas + conditions.
`
    } else {
      i += `MATH: Every formula → explain variables. Step-by-step worked examples. Derivations only if in source.\n`
    }
  }

  // ── PHYSICS ───────────────────────────────────────────────────────────────
  if (subjectType === 'physics') {
    if (examProfile === 'jee_advanced') {
      i += `
PHYSICS (JEE ADVANCED):
- Concepts: maximum depth — underlying principle, not just surface definition.
- Derivations: step-by-step ONLY if in source. Do NOT derive from scratch.
- Numericals: identify concept → formula → substitution → result.
- Diagrams: force diagrams, circuit diagrams, ray diagrams — describe in diagramCue.
- Questions: multi-correct, assertion-reason, paragraph-based.
- Graphs: describe shape, intercepts, behavior if in source.
`
    } else if (examProfile === 'jee_main') {
      i += `
PHYSICS (JEE MAIN):
- Formula + units + direct application.
- Key derivations if in source.
- Standard numericals step-by-step.
- Diagram cues wherever relevant.
`
    } else if (examProfile === 'neet') {
      i += `
PHYSICS (NEET):
- NCERT-level concept clarity.
- Every formula: meaning + when to use + units.
- Diagram cues: always mention if diagram needed.
- Direct formula application numericals.
`
    } else if (examProfile === 'cbse12') {
      i += `
PHYSICS (CBSE 12th):
- Board derivations — include if in source: Lens maker's formula, Mirror formula, Biot-Savart, Gauss's law, de Broglie, Bohr model energy levels.
- Diagrams mandatory: circuit, ray, logic gates — describe in diagramCue.
- 3-mark vs 5-mark awareness: short for 3-mark, full derivation for 5-mark.
- Numerical steps clearly shown.
`
    } else if (examProfile === 'cbse10') {
      i += `
PHYSICS (CBSE 10th):
- Diagrams: Eye, ear, refraction, circuits — always fill diagramCue.
- Formulas + units + one worked example.
- Definitions: exact textbook language.
- Numericals: electricity, light — show all steps.
`
    } else if (examProfile === 'gate') {
      i += `
PHYSICS (GATE): Derivations if in source. Numericals step-by-step. All formulas with conditions.\n`
    } else {
      i += `PHYSICS: Clear concept + formula + unit. Worked examples step-by-step. Diagram cues where relevant.\n`
    }
  }

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  if (subjectType === 'chemistry') {
    if (examProfile === 'jee_advanced' || examProfile === 'jee_main') {
      i += `
CHEMISTRY (JEE):
- Named reactions: name → reagents → conditions → product → mechanism if in source.
- Organic: functional group → reaction type → product. Mechanisms step-by-step if in source.
- Inorganic: properties + reactions exactly as in source.
- Physical chemistry: formula + derivation if in source + numerical approach.
- Isomerism: all types present in source.
- Do NOT write reactions not present in uploaded text.
`
    } else if (examProfile === 'neet') {
      i += `
CHEMISTRY (NEET):
- NCERT definitions — exact language matters.
- Reactions: balanced equation + conditions (temperature, catalyst, pressure).
- Named reactions: name + reactants + products — mandatory for all named reactions in source.
- Biomolecules: structure + function + examples from source.
- Exceptions: note any exceptions explicitly mentioned in source — NEET loves exceptions.
- Focus: inorganic reactions, biomolecules, environmental chemistry.
`
    } else if (examProfile === 'cbse12') {
      i += `
CHEMISTRY (CBSE 12th):
- Reactions: write balanced equations — board asks to write them.
- Named reactions: name + equation + one line about use.
- Distinctions: SN1 vs SN2, physisorption vs chemisorption — board loves distinction questions.
- Numericals: electrochemistry, solutions, kinetics — all steps shown.
- IUPAC naming if in source.
`
    } else if (examProfile === 'cbse10') {
      i += `
CHEMISTRY (CBSE 10th):
- Balanced chemical equations — mandatory.
- Types of reactions: combination, decomposition, displacement, redox — with examples.
- Definitions: acid, base, salt — textbook exact.
- Activity series if mentioned in source.
`
    } else {
      i += `CHEMISTRY: Balanced equations + conditions from source. Named reactions: name → reactants → products.\n`
    }
  }

  // ── BIOLOGY ───────────────────────────────────────────────────────────────
  if (subjectType === 'biology') {
    i += `
BIOLOGY:
- Definitions: precise, include scientific names if in source.
- Diagrams: ALWAYS fill diagramCue — cell organelles, heart, nephron, neuron, flower parts, DNA, etc.
- Processes: step-by-step in correct order (photosynthesis, meiosis stages, etc).
- Comparisons: identify all comparison pairs (mitosis vs meiosis, C3 vs C4, aerobic vs anaerobic).
- Functions: for every structure/organelle mentioned — state its function.
- Exceptions: note any exceptions explicitly mentioned in source.
- MOLECULAR DETAILS MANDATORY: Named proteins, receptors, genes MUST be included exactly as in source — e.g. ZP3, SED1, Oct4, Nanog, Cdx2, c-kit, Bmp4, IZUMO, CD9. Never generalize them away.
- CLINICAL BOXES MANDATORY: Any "In the Clinic" section in source = separate High Priority topic. Include case name, condition, mechanism, clinical relevance.
- RESEARCH BOXES MANDATORY: Any "In the Research Lab" section in source = separate topic. Include experiment, finding, significance.
- TIMELINES MANDATORY: If source has hour-by-hour or day-by-day timeline (e.g. ovulation hours, cleavage days) — convert to numbered points with exact values. e.g. "Hour 0: LH surge → Hour 15: germinal vesicle breaks down → Hour 38: ovulation".
- STATISTICS MANDATORY: Exact percentages and numbers from source must appear — e.g. "90-95% Down syndrome cases = maternal non-disjunction", "7 million follicles at 5 months fetal life".
- DRUG DISTINCTIONS: If source distinguishes between two drugs/treatments (e.g. RU-486 vs Plan B) — both must be covered as separate points with mechanism clearly differentiated.
`
    if (examProfile === 'neet') {
      i += `- NEET: NCERT exact language. "Which is NOT" type exceptions very common. Diagram labels mandatory.\n`
    }
    if (examProfile === 'cbse12' || examProfile === 'cbse10') {
      i += `- CBSE: Diagrams heavily marked. Differences table format. 3-mark: definition + 2 points. 5-mark: full explanation with diagram cue.\n`
    }
    // MBBS specific
    const isMBBS = examProfile === 'mbbs'
    if (isMBBS) {
      i += `
MBBS BIOLOGY:
- Clinical correlation MANDATORY for every topic — examiner always asks "what happens when this goes wrong?"
- SUBSECTION DEPTH RULE: Every bold heading or named mechanism within a topic MUST be a separate point — e.g. "Cortical Granule Reaction", "Polyspermy Block", "Blood-Testis Barrier", "Zona Reaction" — never skip named mechanisms.
- CONTRACEPTION MANDATORY: If source has contraception section, it MUST be covered as separate topics — RU-486 and Plan B must be differentiated clearly: RU-486 = abortifacient (antiprogesterone), Plan B = NOT abortifacient (prevents ovulation only).
- FOLLICULOGENESIS STAGES MANDATORY: Primordial follicle → Primary follicle → Growing follicle → Antral/Vesicular follicle → Mature Graafian follicle — each stage as separate point if in source.
- HOUR TIMELINE MANDATORY: Ovulation timeline must include all hours — Hour 0: LH/FSH surge → Hour 15: germinal vesicle breaks down → Hour 20: first meiotic metaphase → Hour 35: second meiotic metaphase → Hour 38: ovulation.
- Every named syndrome/condition: definition + mechanism + clinical features + management (if in source).
- Embryology: every developmental stage with exact timing (weeks/days/hours). Every transcription factor named in source must appear.
- Histology: every cell type + its function + what happens in disease.
- Pharmacology if present: drug name + mechanism + use + side effect.
- "In the Clinic" boxes = HIGH PRIORITY separate topics — these are frequently asked in MBBS exams.
- "In the Research Lab" boxes = MEDIUM PRIORITY separate topics — asked in advanced exams.
- Every named technique (FISH, CMA, PCR, karyotyping, IVF, ICSI) = separate topic with steps.
- Abnormalities section: every named syndrome with chromosome/gene involved + features.
`
    }
  }

  // ── PSYCHOLOGY ────────────────────────────────────────────────────────────
  if (subjectType === 'psychology') {
    i += `
PSYCHOLOGY:
- Definitions: precise psychological definitions — include theorist name if associated in source.
- Theories: theorist name → core idea → key concepts → criticism if in source.
- Experiments/Studies: researcher → aim → procedure (brief) → finding → conclusion.
- Comparisons: Classical vs Operant conditioning, Nature vs Nurture, etc — if both in source.
- Stages/Models: all stages in correct order with age range if given (e.g. Piaget, Freud, Erikson).
- Key terms: define every psychological term precisely — examiners check exact definitions.
- Real-life examples: include any examples from source to illustrate concepts.
- Diagrams: draw cue for any model/hierarchy/pyramid (e.g. Maslow's hierarchy) — describe in diagramCue.
`
    if (examProfile === 'cbse12') {
      i += `- CBSE Psychology: 3-mark answer = definition + 2 explanation points. 5-mark = theory + stages + criticism + example. Case study questions — apply theory to situation.\n`
    }
    if (examProfile === 'upsc') {
      i += `- UPSC Psychology: Link to social issues, policy relevance. Multidimensional perspective.\n`
    }
  }

  // ── HISTORY ───────────────────────────────────────────────────────────────
  if (subjectType === 'history') {
    if (examProfile === 'upsc') {
      i += `
HISTORY (UPSC):
- Answer format: Introduction (1-2 lines context) → Body (min 3 dimensions: social/political/economic/cultural) → Conclusion (forward-looking or significance).
- Include: dates, key figures, causes, consequences, contemporary relevance.
- Keywords: terms examiner looks for — include explicitly.
- Multiple perspectives where source provides them.
- 250-word answer awareness for mains.
`
    } else if (examProfile === 'cbse10' || examProfile === 'cbse12') {
      i += `
HISTORY (CBSE):
- Dates + key figures + causes + effects — all mandatory.
- 3-mark: 3 distinct points. 5-mark: intro + 4-5 points + conclusion.
- Source-based questions: mention key evidence/arguments if source has document extracts.
- Map-based: note locations — fill diagramCue.
`
    } else if (examProfile === 'ba') {
      i += `HISTORY (BA/University): Descriptive essay style. Intro → Causes → Events → Effects → Conclusion. Dates + key figures mandatory. Indian examples preferred.\n`
    } else {
      i += `HISTORY: Intro (context) → Causes/Events/Effects → Conclusion. Dates, key figures, causes, consequences.\n`
    }
  }

  // ── GEOGRAPHY ─────────────────────────────────────────────────────────────
  if (subjectType === 'geography') {
    i += `
GEOGRAPHY:
- Maps: ALWAYS fill diagramCue for location-based content — mention what to mark on map.
- Processes: step-by-step (monsoon, river, soil formation etc).
- Factors: list all factors affecting a phenomenon from source.
- Comparisons: types of rainfall, soil types, vegetation types.
- Data/statistics: include any figures from source.
`
    if (examProfile === 'upsc') i += `- UPSC: multiple dimensions, contemporary issues, India-specific examples.\n`
    if (examProfile === 'cbse10' || examProfile === 'cbse12') i += `- CBSE: map work is separate marks — always note what to mark. 3-mark vs 5-mark awareness.\n`
  }

  // ── POLITY ────────────────────────────────────────────────────────────────
  if (subjectType === 'polity') {
    i += `
POLITY:
- Article/Section numbers: mandatory wherever present in source.
- Provisions: exact constitutional language first, then simple explanation.
- Landmark cases: case name → what was held → significance.
- Comparisons: Fundamental Rights vs DPSP, Rajya Sabha vs Lok Sabha etc.
- Amendments: amendment number + what it changed.
`
    if (examProfile === 'upsc') {
      i += `- UPSC: recent Supreme Court judgments if in source. Contemporary relevance.
- Answer format: Introduction (definition + context, 2-3 lines) → Body (3 dimensions: political/social/economic) → Conclusion (contemporary relevance + way forward)
- MANDATORY: Article numbers, Amendment numbers, Case names e.g. Kesavananda Bharati, Maneka Gandhi
- Connect to current India: CAA, Article 370, Electoral Bonds, RTI, PIL
- Critical analysis: positive aspects AND limitations both
- 250 word UPSC Mains awareness\n`
    }
    if (examProfile === 'ba' || examProfile === 'general') {
      i += `- BA/University: Descriptive answer style — Define, Explain, Indian Example, Conclusion. University exam expects detailed paragraphs, not bullet points only.\n`
    }
  }

  // ── ECONOMY ───────────────────────────────────────────────────────────────
  if (subjectType === 'economy') {
    i += `
ECONOMY:
- Definitions: precise economic definitions from source.
- Government schemes: name + objective + target beneficiary + year if in source.
- Data/statistics: include all figures from source.
- Cause-effect: policy → impact chain clearly explained.
- Comparisons: monetary vs fiscal policy, direct vs indirect tax etc.
`
    if (examProfile === 'upsc') i += `- UPSC: contemporary relevance, India-specific data, multidimensional impact.\n`
  }

  // ── LAW ───────────────────────────────────────────────────────────────────
  if (subjectType === 'law') {
    i += `
LAW:
- Provisions: Section/Article number → what it says → exception/proviso if any.
- Case laws: case name → brief facts (1 line) → held/judgment → relevance.
- Definitions: statutory definition first, then plain explanation.
- Format: Define → Explain → Illustrate with example or case.
- Distinctions: void vs voidable contract, cognizable vs non-cognizable etc.
`
    if (examProfile === 'ca') i += `- CA LAW: SA numbers if present. Practical scenarios from source.\n`
  }

  // ── ACCOUNTS ──────────────────────────────────────────────────────────────
  if (subjectType === 'accounts') {
    i += `
ACCOUNTS (CA):
- Journal entries: show Dr/Cr format exactly as in source.
- Standards: AS/Ind AS number + what it covers + key requirement.
- Formats: Balance Sheet, P&L, Cash Flow — mention structure if in source.
- Ratio analysis: ratio name + formula + what it indicates.
- Adjustments: treatment of each adjustment clearly explained.
- Practical scenarios: transaction → how to record → why.
`
  }

  // ── DSA ───────────────────────────────────────────────────────────────────
  if (subjectType === 'dsa') {
    i += `
DSA:
- Algorithms: numbered step-by-step in plain English.
- Complexity: Time + Space complexity MANDATORY for every algorithm.
- Dry run: if source has example, trace through it step by step.
- Recurrence relations: state + solve if in source.
- Comparisons: BFS vs DFS, merge sort vs quick sort etc.
- Diagrams: tree/graph structures — describe in diagramCue.
`
    if (examProfile === 'gate') i += `- GATE: Master theorem applications + proof of complexity if in source.\n`
  }

  // ── OS ────────────────────────────────────────────────────────────────────
  if (subjectType === 'os') {
    i += `
OPERATING SYSTEMS:
- Scheduling algorithms: how it works + Gantt chart description if in source.
- Deadlock: all 4 conditions + prevention/detection/avoidance from source.
- Memory management: paging vs segmentation comparison if both in source.
- Synchronization: semaphore/mutex — when to use + example from source.
`
    if (examProfile === 'gate') i += `- GATE: numerical problems on scheduling (avg waiting time, turnaround time) — show all steps.\n`
  }

  // ── DBMS ──────────────────────────────────────────────────────────────────
  if (subjectType === 'dbms') {
    i += `
DBMS:
- SQL queries: write exact syntax if present in source.
- Normalization: each NF — definition + condition + example showing violation and fix.
- ER diagram: entities, attributes, relationships — describe in diagramCue.
- Transactions: ACID properties — each explained with example.
- Functional dependencies: state clearly + closure if in source.
`
    if (examProfile === 'gate') i += `- GATE: normalization numericals + SQL query writing + relational algebra.\n`
  }

  // ── NETWORKS ──────────────────────────────────────────────────────────────
  if (subjectType === 'networks') {
    i += `
COMPUTER NETWORKS:
- OSI/TCP-IP layers: each layer + function + protocol at that layer.
- Protocols: what it does + which layer + key feature.
- Numericals: subnetting, IP addressing — show all steps.
- Comparisons: OSI vs TCP-IP, TCP vs UDP, IPv4 vs IPv6.
- Diagrams: network topologies, frame format — describe in diagramCue.
`
    if (examProfile === 'gate') i += `- GATE: subnetting numericals + sliding window problems + routing algorithm steps.\n`
  }
  if (subjectType === 'ml_ai') {
    i += `ML/AI/NLP: Every technique/algorithm = separate point. Named models (BERT,GPT,Word2Vec,TF-IDF,CNN,RNN,LSTM) = separate points. Every pipeline stage separately. Every metric: formula+meaning. Comparisons if both in source. Diagrams in diagramCue.
CRITICAL FOR NLP: If source has numbered/categorized technique sections (Text Processing, Syntax, Semantic, Information Extraction, Language Generation, Speech Processing, Question Answering, Dialogue Systems) — EACH category AND each technique within it = separate topic. Never merge categories.\n`
  }
  if (subjectType === 'software_eng') {
    i += `SOFTWARE ENG: Every SDLC phase separately. Design patterns: name+problem+solution. SOLID: each principle separately. Testing types each defined. UML diagrams in diagramCue.\n`
  }
  if (subjectType === 'comp_arch') {
    i += `COMP ARCH: Every component: function+connections. Pipeline stages+hazards separately. Memory hierarchy each level. Numericals: show all steps. Diagrams in diagramCue.\n`
  }
  if (subjectType === 'compiler') {
    i += `COMPILER: Every phase: input+output+function. Grammar+parsing separately. FIRST/FOLLOW: definition+example. Parse table steps. Diagrams in diagramCue.\n`
  }
  if (subjectType === 'cyber_security') {
    i += `CYBER SEC: Every attack: definition+how+prevention. Crypto algorithms separately. Every protocol: layer+use. Auth vs AuthZ distinction. Diagrams in diagramCue.\n`
  }
  if (subjectType === 'statistics') {
    i += `STATISTICS: Every formula: variables+conditions. Distributions: shape+parameters+example. Hypothesis testing: full procedure. Every test separately. Numericals: all steps.\n`
  }
  if (subjectType === 'sociology') {
    i += `SOCIOLOGY: Every theory: theorist+idea+concepts+criticism. Every concept: definition+Indian example. Contemporary India connect.\n`
  }
  if (subjectType === 'business') {
    i += `BUSINESS: Every concept: definition+Indian company example. Frameworks: each component separately. Management functions each separately. Marketing mix each P separately.\n`
  }
  if (subjectType === 'environment') {
    i += `ENVIRONMENT: Every issue: cause+effect+solution. Every cycle: step-by-step. Treaties: name+year+provisions. Data/stats from source. Diagrams in diagramCue.\n`
  }
  return i
}

// ─── FREE USER PRIORITY ───────────────────────────────────────────────────────
function getPriorityInstruction(plan) {
  if (plan !== 'free') return ''
  return `
FREE PLAN OUTPUT PRIORITY:
- High frequency topics → full depth
- Medium frequency topics → 60% depth
- Low frequency topics → 1-2 key points only
`
}

// ─── CHUNK TEXT ───────────────────────────────────────────────────────────────
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
  const fixes = ['"}]}', '"}]}]}', '"]}', ']}', '}', '"]}]}', '"}]}}', '"]}}}']
  for (const fix of fixes) {
    try { return JSON.parse(clean + fix) } catch {}
  }
  // Try truncating at last complete topic
  const lastBrace = clean.lastIndexOf('"}')
  if (lastBrace > 0) {
    try { return JSON.parse(clean.slice(0, lastBrace + 2) + ']}') } catch {}
    try { return JSON.parse(clean.slice(0, lastBrace + 2) + ']}]}') } catch {}
  }
  const lastBracket = clean.lastIndexOf('}]')
  if (lastBracket > 0) {
    try { return JSON.parse(clean.slice(0, lastBracket + 2) + '}') } catch {}
    try { return JSON.parse(clean.slice(0, lastBracket + 2) + ']}') } catch {}
  }
  throw new Error('Could not parse AI response')
}


function getMaxTokens(mode, totalChunks, plan) {
  if (mode === 'last-minute') return 3000
  if (mode === 'mcq') return 6000  
  if (mode === 'quick-revision') return 4500
  if (mode === 'pyq') return 7000
  if (mode === 'exam-notes') return 8000
  return 5000
}

// ─── OPENAI API ─────────────────────────────────────────────────────────────────
async function callOpenAI(prompt, maxTokens = 5000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 56000)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a JSON API. Respond with valid JSON only. No markdown, no extra text.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: maxTokens,
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    const data = await response.json()
    if (!data.choices?.[0]) throw new Error('OpenAI API error: ' + JSON.stringify(data))
    return data.choices[0].message.content
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

// ─── SMART AI CALLER ──────────────────────────────────────────────────────────
async function callAI(prompt, maxTokens) {
  return await callOpenAI(prompt, maxTokens)
}

// ─── FILE EXTRACTION ──────────────────────────────────────────────────────────
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

async function extractPptxText(arrayBuffer) {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(arrayBuffer)
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0')
      const nb = parseInt(b.match(/\d+/)?.[0] || '0')
      return na - nb
    })
  const texts = []
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('string')
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
    const slideText = matches
      .map(m => m.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ')
    if (slideText) texts.push(slideText)
  }
  return texts.join('\n\n')
}

async function extractFileText(file) {
  if (!file || !file.name) return ''
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer()
    const arrayBufferCopy = arrayBuffer.slice(0)
    try {
      const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      if (text && text.trim().length > 50) return text
    } catch (err) { console.error('unpdf error:', err) }
    return await extractTextWithFallback(arrayBufferCopy)
  }

  if (name.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      return result.value?.trim() || ''
    } catch (err) { console.error('mammoth error:', err); return '' }
  }

  if (name.endsWith('.pptx')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      return await extractPptxText(arrayBuffer)
    } catch (err) { console.error('pptx error:', err); return '' }
  }

  return await file.text()
}

// ─── POETRY PROMPTS ───────────────────────────────────────────────────────────
function poetryExamNotesPrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — expert English Literature coach for Indian ${exam} students.

POEM/POETRY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: ONLY use content present in the uploaded text. Do not add outside knowledge.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Poetry Analysis",
  "poems": [
    {
      "title": "Poem title",
      "poet": "Poet name",
      "examFrequency": "High|Medium|Low",
      "examinerTip": "What examiner specifically checks",
      "overview": {
        "theme": "Central theme — 2-3 sentences",
        "tone": "Poet's attitude/tone",
        "mood": "Emotional atmosphere for reader",
        "rhymeScheme": "e.g. ABAB or Free verse — with example line",
        "poetsIntent": "What poet wants to convey — 2-3 sentences"
      },
      "poeticDevices": [
        {
          "device": "Device name (Metaphor/Simile/Alliteration/Imagery/Personification/Symbolism/Irony/Hyperbole/Onomatopoeia/Assonance/Repetition/Enjambment/Oxymoron/Refrain)",
          "line": "Exact line/phrase from poem",
          "effect": "What effect this creates — why poet used it"
        }
      ],
      "stanzaAnalysis": [
        {
          "stanza": "Stanza 1",
          "lines": "First few words of stanza...",
          "meaning": "What happens here — 2-3 sentences",
          "keyImage": "Most important image/device in this stanza"
        }
      ],
      "importantLines": [
        {
          "line": "Exact line from poem",
          "meaning": "What this line means",
          "whyImportant": "Why significant for exam"
        }
      ],
      "examQuestions": [
        {
          "q": "Full exam-style question",
          "marks": 5,
          "priority": "High|Medium|Low",
          "modelAnswer": "Write a FULL 5 mark answer — minimum 5-6 elaborated points. Each point must be 2-3 sentences. Quote exact lines from poem. Explain the device used. Connect to theme. Write like a topper writes in board exam — no one-liners."
        }
      ],
      "commonMistakes": []
    }
  ]
}

STRICT RULES:
- CRITICAL: If multiple poems are present in the material, create a separate poem object for EACH poem. Do NOT skip any poem.
- Process ALL poems found in the text — not just the first one.
- RHYME SCHEME RULE: Identify rhyme scheme by checking the LAST WORD of each line in the poem. Count carefully — do not guess. If poem text is not fully present in source, write "Cannot determine from source".
- poeticDevices: find ALL devices present — minimum 5 if full poem present
- stanzaAnalysis: cover EVERY stanza — do not skip any
- importantLines: minimum 3 most exam-important lines
- examQuestions: MINIMUM 5 questions — mandatory. Cover: theme, device, character/symbol, important line, overall analysis.
- commonMistakes: ONLY if uploaded text itself has a wrong definition or factual error. If nothing wrong in source, return [].
- ONLY return JSON`
}

function poetryMCQPrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — MCQ specialist for Indian ${exam} English Literature students.

POEM/POETRY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: Every MCQ based ONLY on content in uploaded text.

MCQ types for poetry:
1. "In the line '...', which poetic device is used?"
2. "What does the line '...' convey?"
3. "The overall tone of the poem is..."
4. "In this stanza, the poet is describing..."
5. "The poet uses '...' to suggest..."
6. "The rhyme scheme of the poem is..."
7. "The [object] is compared to '...' to suggest..."

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Poetry",
  "mcqs": [
    {
      "question": "Question referencing actual line/content from poem",
      "options": { "A": "Option", "B": "Option", "C": "Option", "D": "Option" },
      "correct": "A",
      "explanation": "Why correct + why others wrong — reference the poem",
      "topic": "Which poem/device/concept",
      "difficulty": "Easy|Medium|Hard",
      "examFrequency": "High|Medium|Low"
    }
  ]
}

RULES:
- Minimum 8 MCQs per poem
- NO generic "What is a metaphor?" — always in context of THIS poem
- NO "which is incorrect" type
- ONLY return JSON`
}

function poetryLastMinutePrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — last minute revision for Indian ${exam} English Literature students.

POEM/POETRY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: ONLY use content from uploaded text.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Poetry",
  "poems": [
    {
      "title": "Poem title",
      "poet": "Poet name",
      "examFrequency": "High|Medium|Low",
      "mustKnow": "Theme + tone in 2 lines",
      "keyDevices": [
        { "device": "Device name", "line": "Exact line from poem", "effect": "One line — what it conveys" }
      ],
      "rhymeScheme": "e.g. ABAB / Free verse",
      "importantLines": ["Exact quote 1", "Exact quote 2", "Exact quote 3"],
      "memoryTrick": "Clever way to remember theme or key device",
      "likelyQuestion": "Most likely exam question in one line",
      "quickFacts": ["Fact about poem/poet from source"]
    }
  ],
  "doNotForget": ["Common mistake 1"]
}

RULES: keyDevices: minimum 4 per poem. importantLines: exact quotes. ONLY return JSON`
}

function poetryQuickRevisionPrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — quick revision for Indian ${exam} English Literature students.

POEM/POETRY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: ONLY use content from uploaded text.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Poetry",
  "flashcards": [
    { "front": "Which device is used in '[exact line]'?", "back": "Device name — effect it creates", "topic": "Poem title", "difficulty": "Easy|Medium|Hard" }
  ],
  "oneLiners": [
    { "concept": "Theme of [poem title]", "oneLiner": "One line answer" }
  ],
  "devicesList": [
    { "poem": "Poem title", "device": "Device name", "line": "Exact line from poem", "meaning": "One line meaning" }
  ],
  "comparisons": [
    { "title": "X vs Y", "itemA": "X", "itemB": "Y", "points": [{ "aspect": "Aspect", "a": "X value", "b": "Y value" }] }
  ]
}

RULES: flashcards: one per device + theme + tone per poem. devicesList: ALL devices. comparisons: only if multiple poems. ONLY return JSON`
}

// ─── PROSE PROMPTS ────────────────────────────────────────────────────────────
function proseExamNotesPrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — expert English Literature coach for Indian ${exam} students.

PROSE/STORY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: ONLY use content present in the uploaded text.

CHARACTERS MANDATORY RULE: Include EVERY named person in passage — author, interviewer, interviewee, all referenced figures. Each = separate character entry with their view/significance.
PARTS RULE: If source has Part I, Part II — each part = separate plotSummary entry.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Prose Analysis",
  "passages": [
    {
      "title": "Story/chapter/passage title",
      "author": "Author name",
      "examFrequency": "High|Medium|Low",
      "examinerTip": "What examiner specifically checks",
      "overview": {
        "theme": "Central theme — 2-3 sentences",
        "tone": "Author's tone",
        "setting": "Time and place if mentioned",
        "authorMessage": "What the author wants to convey"
      },
      "characters": [
        {
          "name": "Character name",
          "role": "Protagonist/Antagonist/Supporting",
          "traits": ["Trait 1 with evidence from text", "Trait 2"],
          "significance": "Why this character matters"
        }
      ],
      "plotSummary": [
        { "part": "Beginning/Middle/End", "summary": "What happens — 2-3 sentences" }
      ],
      "literaryDevices": [
        { "device": "Device name", "example": "Exact line/quote from text", "effect": "Effect it creates" }
      ],
      "importantQuotes": [
        { "quote": "Exact quote", "speaker": "Who said it", "significance": "Why important for exam" }
      ],
      "examQuestions": [
        {
          "q": "Full exam-style question",
          "marks": 5,
          "priority": "High|Medium|Low",
          "modelAnswer": "Write a COMPLETE 5 mark answer — minimum 5-6 elaborated points, each 2-3 sentences long. Quote exact lines from poem with explanation. Cover: theme, device used, effect created, significance. Write like a topper — no one-liners, no truncation, full marks answer."
        }
      ],
      "commonMistakes": []
    }
  ]
}

STRICT RULES:
- characters: only present in source
- importantQuotes: minimum 3
- examQuestions: MINIMUM 5 questions — mandatory. Cover: theme, character, quote, literary device, overall analysis.
- commonMistakes: ONLY if source has a factual error, else []
- ONLY return JSON`
}

function proseMCQPrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — MCQ specialist for Indian ${exam} English Literature students.

PROSE/STORY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: Every MCQ based ONLY on uploaded text.

MCQ types: character traits, theme, quote meaning, author's intent, plot events, literary devices.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Prose",
  "mcqs": [
    {
      "question": "Question based on actual content",
      "options": { "A": "Option", "B": "Option", "C": "Option", "D": "Option" },
      "correct": "A",
      "explanation": "Why correct + why others wrong",
      "topic": "Which passage/concept",
      "difficulty": "Easy|Medium|Hard",
      "examFrequency": "High|Medium|Low"
    }
  ]
}
RULES: Minimum 6 MCQs per passage. NO "which is incorrect" type. ONLY return JSON`
}

function proseLastMinutePrompt(chunk, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — last minute revision for Indian ${exam} English Literature students.

PROSE/STORY MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

STRICT RULE: ONLY use content from uploaded text.

Return ONLY valid JSON:
{
  "subject": "English Literature",
  "chapter": "Prose",
  "passages": [
    {
      "title": "Story/passage title",
      "author": "Author name",
      "examFrequency": "High|Medium|Low",
      "mustKnow": "Theme + author message in 2 lines",
      "keyCharacters": ["Character name: one line trait + role"],
      "plotInPoints": ["Key event 1", "Key event 2", "Key event 3"],
      "importantQuotes": ["Exact quote 1", "Exact quote 2"],
      "memoryTrick": "Way to remember key theme or character",
      "likelyQuestion": "Most likely exam question"
    }
  ],
  "doNotForget": ["Common mistake 1"]
}
ONLY return JSON`
}
// prompt

function examNotesPrompt(chunk, exam, syllabus, chunkIndex, totalChunks, subjectType, examProfile, canFill, plan) {
  const subjectExamInstructions = getSubjectExamInstructions(subjectType, examProfile, canFill)
  const priorityInstruction = getPriorityInstruction(plan)

  return `You are PrepIQ AI — expert exam coach for Indian ${exam} students.
${subjectExamInstructions}
${priorityInstruction}
${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\nOnly cover topics present in this syllabus.` : 'Cover ALL topics found in the material.'}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

LANGUAGE RULE: Detect the language of the uploaded material. If material is in Hindi, respond in Hindi. If in English, respond in simple easy English that a class 11-12 student can understand. If in Hinglish (mixed Hindi-English), respond in Hinglish matching the same style. Keep technical terms (like DNA, GST, IVF) in English always. Always use simple, easy words — avoid complex jargon. If a technical term is necessary, explain it in simple words in brackets right after.

TOPPER STYLE RULE: Write every answer like a topper writes in exam:
- Start with a crisp definition (1-2 lines)
- Then explain in structured points
- Add a real-world example relevant to ${exam} students
- End with a conclusion or significance
- Use keywords that examiners look for
- Every point must mention its marks value
- Real world example MANDATORY in every topic — make it subject specific and relatable to Indian students
- Physics/Math: machines, vehicles, engineering
- Biology: human body, diseases, food
- Chemistry: medicines, cooking, industry  
- DSA/CS: Google, WhatsApp, Zomato use cases
- History/Polity: connect to current India

MARKS BREAKDOWN RULE: In examinerTip, always mention exact marks breakdown. Example: "Definition: 2 marks | Key points: 4 marks | Example: 2 marks | Conclusion: 2 marks"

REAL WORLD EXAMPLE RULE: Every topic MUST include one India-focused real world example point. Physics: ISRO/Railways. Bio: diseases/AIIMS. DSA: Zomato/Google. Chem: medicines/industry. History/Polity: current India events. Eco: RBI/Budget/schemes.
Examples format:
- Physics: "Newton's First Law — why you jerk forward when bus brakes suddenly (inertia). Used in car seat belts."
- Biology: "Photosynthesis — why plants near windows grow better. Used in farming to maximize crop yield."
- DSA: "Binary Search — how Google autocomplete finds suggestions instantly from millions of words."
- Chemistry: "Acids/Bases — why lemon juice (citric acid) removes stains. Used in cleaning products."
- Economics: RBI, budget, Indian schemes, companies.
- Polity/Political Science: BJP vs INC, Supreme Court judgments, recent Parliament bills, state elections.
- History: "French Revolution — similar to India's Independence movement, both fought against oppression."
This point is NON-NEGOTIABLE — include in EVERY topic without exception.

UPSC FORMAT RULE: For UPSC exam profile, every idealAnswer must follow:
- definition: "Introduction — [definition] + [constitutional/historical context]"
- points: ["🏛️ Political dimension: ...", "👥 Social dimension: ...", "💰 Economic dimension: ...", "⚖️ Landmark case: ...", "🌍 Real World Example: connect to recent India events", "📋 Limitations/Challenges: ..."]
- conclusion: "Way forward — [contemporary relevance] + [future implications]"

CORE MISSION: A student must be able to write a FULL MARKS exam answer using ONLY your output. Miss nothing important.

COVERAGE MANDATE — FOLLOW THESE STEPS IN ORDER:
STEP 1 — FILTER: First identify and mentally REMOVE these sections from consideration: "Check Your Progress", "Glossary", "Summary", "Recap", "Review Questions", "Exercise", "Fill in the Blanks", "True/False", "Answers". These must NEVER become topics.
STEP 2 — SCAN: From remaining content only, list every section heading, numbered item, technique, algorithm, concept, and named term.
STEP 3 — COUNT: Count how many distinct topics/items you found in Step 2.
STEP 4 — GENERATE: Create one topic entry for EACH item from Step 2. Your output topic count must match your Step 3 count.
STEP 5 — VERIFY: Confirm no item from Step 2 is missing AND no item from Step 1 is included.
NEVER skip, merge, or summarize multiple items into one. If source has 10 techniques listed, output must have 10 separate topic entries.

DEDUPLICATION RULE: This is Part ${chunkIndex + 1} of ${totalChunks}. Do NOT repeat exact same topics from previous parts. BUT if source has a NEW subtopic or deeper angle on a previous topic — cover it as a SEPARATE NEW topic. Never skip new content just because the broad topic appeared before.

INTRA-CHUNK DEDUPLICATION: Within THIS chunk, if the same topic appears more than once (e.g. in a summary section, "Check Your Progress", "Answers", "Glossary", or "Review" section at the end of the chapter) — cover it ONLY ONCE using the most detailed version. Do NOT create separate topic entries for the same concept just because it appears in both the main content and the summary/answer section.

IGNORE THESE SECTIONS COMPLETELY — do not generate topics from: "Check Your Progress", "Check your progress", "Answers to Check Your Progress", "Review Questions", "Self Assessment Questions", "Fill in the Blanks", "True/False", "Match the Following", "Exercise", "Activity", "Summary", "Let's Recap", "Recap", "Key Points", "Points to Remember". These are practice sections — extract zero content from them.
INCLUDE THESE SECTIONS MANDATORILY: "In the Clinic", "In the Research Lab", "Clinical Taster", "Case Study", "Clinical Correlation", "Applied Anatomy" — these MUST become separate High Priority topics. Never skip them.

SECTION COVERAGE RULE: Every numbered section/subsection in source (1.1, 1.2, 1.3... 1.7 etc.) MUST become a separate topic. NEVER skip any numbered section. Van't Hoff factor, Azeotropes, Reverse Osmosis, Abnormal Molar Mass — if present in source, these are MANDATORY topics.
SUBSECTION COVERAGE RULE: Within a single heading (e.g. "Nature of Stress"), if source has numbered/named sub-points (e.g. "1. Positive and negative aspects", "2. Linkages with demands and resources", "3. Stress as additive phenomenon") — EACH sub-point MUST become a SEPARATE topic entry. Never merge all sub-points of a heading into one topic. Count sub-points in source, match in output. This also applies to bold headings and named stages/steps/phases in source (e.g. "Primary Appraisal", "Secondary Appraisal", "Reappraisal") — each named stage MUST be a separate topic entry, never merged with another.

TOKEN LIMIT SAFETY RULE: If you are running low on response space, do NOT skip remaining topics. Instead, compress each remaining topic to minimum viable output: title + examFrequency + 2-3 bullet points in idealAnswer.points + empty formula + one-line conclusion. A compressed topic is infinitely better than a missing topic.

OUTPUT DEPTH RULES:
- Include ALL important points from source — never skip any
- MINIMUM 4-6 points per topic, aim for more if source has more content
- 2-3 sentences → 4 points minimum
- 1 paragraph → 6-8 points
- 2+ paragraphs → 8-12 points
- Cover EVERY subtopic, technique, concept from source — NEVER merge or skip any
- Each point must be 2-3 sentences minimum — no one-liners
- If source has 10 techniques/types/applications, write ALL 10 as separate points
- Include ALL examples, formulas, definitions, facts exactly as in source
- For technical subjects (DSA, Networks, OS): every algorithm, every step
- For science (Physics, Chemistry, Biology): every formula, every reaction, every process
- For humanities (History, Polity, Economy): every event, every article, every scheme
- For literature (Poetry, Prose): every device, every quote, every character
- NEVER summarize multiple points into one — keep them separate
- CRITICAL: If source has numbered lists (1. 2. 3...) or bullet lists, cover EVERY single item as a separate point — never merge them
- CRITICAL: If source has categories with subcategories (e.g. "Techniques: Tokenization, Stemming, NER..."), cover each subcategory as its own separate point
- CRITICAL: Do NOT create broad topic headings like "Key Techniques" and list only 4 — if source has 10 techniques, make 10 separate points
- Each numbered item from source = one dedicated point in output, minimum 2-3 sentences explaining it fully
- CRITICAL: Every named section heading in source (e.g. "Shock Therapy", "Gorbachev and Disintegration", "Consequences", "Timeline") must become a separate topic — never skip any heading
- Include ALL specific facts: dates, names, statistics, percentages exactly as in source
- Named examples must be included: e.g. Bhilai steel plant, cryogenic rocket, 90% industries sold
- Timelines from source must be converted into numbered chronological points.
- NUMERICAL RULE: For topics where calculation is involved (concentration units, Henry's Law, Raoult's Law, ΔTb, ΔTf, osmotic pressure, Van't Hoff factor, molar mass determination) — include a worked numerical INSIDE that topic's points. Format: "📐 Numerical: [problem statement] → Step 1: formula → Step 2: substitute values with units → Step 3: calculate → Answer: value with unit". Use exact numerical from source if present.

SUBJECT-SPECIFIC SPECIFICITY RULES:

HISTORY/POLITY/ECONOMY/LAW:
- Every named person: role + dates e.g. "Lenin (1870-1924) — founder of Bolshevik Party"
- Every statistic exactly: "90% industries sold", "GDP 1999 below 1989", "1500 banks bankrupt"
- Every named place/institution: Bhilai, Bokaro, Inkombank, World Bank, IMF
- Every treaty/agreement/pact: Warsaw Pact, CIS, Indo-Russian Strategic Agreement 2001
- Timeline: EVERY date = separate point with exact month and year
- Every named country/state/region: Estonia, Latvia, Lithuania etc.
- Cultural references: Raj Kapoor, Amitabh Bachchan etc.
- Every cause = separate point, never merge

SCIENCE (Physics/Chemistry/Biology):
- Every formula exactly as in source with all variables explained
- Every reaction: reactants + products + conditions (temperature, catalyst, pressure)
- Every numerical value: atomic numbers, wavelengths, temperatures, percentages
- Every named scientist with their contribution: "Newton (1642-1727) — Laws of Motion"
- Every step of a process in correct order: mitosis stages, digestion steps etc.
- Every unit mandatory: metres, joules, moles etc.

DSA/CS/NETWORKS/OS/DBMS:
- Every algorithm: exact steps numbered
- Every complexity: Time + Space both
- Every protocol: which layer + what it does
- Every data structure: operations + complexity
- Every SQL/code syntax exactly as in source
- Every acronym expanded: TCP = Transmission Control Protocol

MATHEMATICS:
- Every formula with ALL variables defined
- Every theorem: statement + proof if in source
- Every step of derivation numbered
- Every condition/constraint mentioned
- Every example worked out completely

GEOGRAPHY:
- Every location with coordinates/region if mentioned
- Every climate data: rainfall figures, temperatures
- Every river/mountain/plateau named
- Every process step by step: monsoon formation, soil formation

ENGLISH LITERATURE (Poetry/Prose):
- Every poetic device with exact line from poem
- Every character with traits + evidence from text
- Every quote exact with speaker name
- Every theme + tone + mood separately
- Every stanza analysed individually

GENERAL RULE FOR ALL SUBJECTS:
- Never replace specific facts with vague generalizations
- Named examples mandatory: if source names Bhilai, write Bhilai — not "steel plants"
- Numbers mandatory: if source says 90%, write 90% — not "most industries"
- Never merge 2 separate facts into 1 point

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "topics": [
    {
      "title": "Topic name",
      "examFrequency": "High|Medium|Low",
      "examinerTip": "Topic-specific examiner expectation — e.g. 'Examiner expects you to name all 3 laws with examples. Definition: 2 marks | Laws with explanation: 6 marks | Real example: 2 marks' — make it specific to THIS topic",
      "idealAnswer": {
        "definition": "Simple, clear textbook-quality definition — easy to understand",
        "points": [
          "Point 1 — explained simply with real world example where relevant",
          "Point 2 — topper style, exam-ready"
        ],
        "formula": "Exact formula if present in source, else empty string",
        "conclusion": "One line significance or takeaway — why this topic matters"
      },
      "diagramCue": "ONLY fill if a diagram/map/chart/graph/flowchart is genuinely needed in exam AND can be drawn on paper. Examples: maps, cycles, flowcharts, circuit diagrams, graphs. NEVER suggest drawing historical photos, buildings, walls, people, or anything that cannot be meaningfully drawn in an exam. If not applicable, return empty string."
    }
  ],
  "mistakes": [
    {
      "topic": "Topic name",
      "wrong": "Wrong definition/formula/statement from source",
      "correct": "Correct version",
      "explanation": "Why this matters"
    }
  ],
  "questions": [
    {
      "q": "MANDATORY — Write complete exam question here. Example: 'Explain methods of expressing concentration with examples. (5 marks)' — never leave empty",
      "marks": 5,
      "priority": "High|Medium|Low",
      "reason": "Why frequently asked",
      "modelAnswer": {
        "definition": "Opening definition — simple and clear",
        "points": ["Write in flowing paragraph style like a topper writes in board exam. Each point should naturally flow into the next. NO 'Point 1', 'Point 2' labels. NO '(1 mark)' labels. Just write elaborated, connected sentences. Each point 2-3 sentences. Use transition words like 'Furthermore', 'Additionally', 'Moreover', 'As a result' to connect points naturally. If numerical is relevant to this topic: include 📐 Numerical: [problem statement] → Step 1: identify formula with variables → Step 2: substitute values with units → Step 3: calculate → Answer: value with unit"],
        "formula": "",
        "conclusion": "Concluding line with significance"
      },
      "examinerNote": "Marks breakdown: Definition (X marks) + Points (X marks) + Example (X marks) + Conclusion (X marks)"
    }
  ]
}

STRICT RULES:
- Include EVERY important topic from chunk
- Easy language — student should understand without dictionary
- Topper style — structured, keyword-rich, example-supported
- Real world example — at least one per topic where applicable
- mistakes: ACTIVELY look for factual errors in source — wrong formulas, wrong dates, wrong definitions, incorrect statements. If found, add to mistakes array. Example: if source says "NaCl is covalent" — that is wrong, add it. If nothing wrong found, return [].
- questions: 3-5 questions with marks mentioned
- ONLY return JSON`
}

function mcqPrompt(chunk, exam, syllabus, chunkIndex, totalChunks, subjectType, examProfile, canFill, plan) {
  const subjectExamInstructions = getSubjectExamInstructions(subjectType, examProfile, canFill)

  let mcqStyle = ''
  if (examProfile === 'jee_advanced') {
    mcqStyle = `JEE ADVANCED MCQ: Multi-correct type (mention "one or more correct"), assertion-reason, integer type as MCQ. Options very close.`
  } else if (examProfile === 'neet') {
    mcqStyle = `NEET MCQ: Single correct. NCERT-based. Include "which is NOT" type for exceptions. Diagram-based where relevant.`
  } else if (examProfile === 'upsc') {
    mcqStyle = `UPSC MCQ: Statement-based ("Consider following statements..."), match the following, chronological order, cause-effect.`
  } else if (['dsa','os','dbms','networks'].includes(subjectType)) {
    mcqStyle = `TECHNICAL MCQ: Algorithm tracing, complexity analysis, output prediction, best/worst case questions.`
  } else if (subjectType === 'psychology') {
    mcqStyle = `PSYCHOLOGY MCQ: Theory application, case study based ("A student who fears failure avoids challenges — this is an example of..."), experiment findings, theorist identification.`
  }

  return `You are PrepIQ AI — MCQ specialist for Indian ${exam} students.
${subjectExamInstructions}
${mcqStyle}
${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\n` : ''}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""

LANGUAGE RULE: Detect the language of the uploaded material. If material is in Hindi, respond in Hindi. If in English, respond in simple easy English that a class 11-12 student can understand. If in Hinglish (mixed Hindi-English), respond in Hinglish matching the same style. Keep technical terms (like DNA, GST, IVF) in English always. Always use simple, easy words — avoid complex jargon. If a technical term is necessary, explain it in simple words in brackets right after.
Generate challenging MCQs testing DEEP understanding. 8-15 MCQs per chunk.
Mix: 20% real-life scenario, 20% application, 30% definition, 30% comparison.
NUMERICAL MCQs RULE: For Chemistry, Physics, Math, Accounts, Economics — minimum 3 MCQs MUST be numerical. Give specific values in question, ask to calculate/find answer. Example: "If 18g of glucose dissolved in 1kg water, elevation in boiling point is? (Kb = 0.52)"
All options plausible — no obviously wrong options.

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "mcqs": [
    {
      "question": "Question text",
      "options": { "A": "Option", "B": "Option", "C": "Option", "D": "Option" },
      "correct": "A",
      "explanation": "Why correct + why others wrong",
      "topic": "Concept tested",
      "difficulty": "Easy|Medium|Hard",
      "examFrequency": "High|Medium|Low"
    }
  ]
}

RULES:
- NO "which of the following is incorrect" type (exception: NEET biology exceptions where specifically relevant)
- ONLY return JSON`
}

function lastMinutePrompt(chunk, exam, syllabus, chunkIndex, totalChunks, subjectType, examProfile, canFill, plan) {
  const subjectExamInstructions = getSubjectExamInstructions(subjectType, examProfile, canFill)
  const priorityInstruction = getPriorityInstruction(plan)

  return `You are PrepIQ AI — last minute revision specialist for Indian ${exam} students.
${subjectExamInstructions}
${priorityInstruction}
${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\n` : ''}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""
LANGUAGE RULE: Detect the language of the uploaded material. If material is in Hindi, respond in Hindi. If in English, respond in simple easy English that a class 11-12 student can understand. If in Hinglish (mixed Hindi-English), respond in Hinglish matching the same style. Keep technical terms (like DNA, GST, IVF) in English always. Always use simple, easy words — avoid complex jargon. If a technical term is necessary, explain it in simple words in brackets right after.
Student has 1-2 hours before exam. Crisp but complete.

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "topics": [
    {
      "title": "Topic name",
      "mustKnow": "Core concept — 1-2 sentences",
      "keyPoints": ["Crisp point — 1-2 sentences max"],
      "formula": "Exact formula if in source, else empty string",
      "memoryTrick": "Clever mnemonic",
      "examFrequency": "High|Medium|Low",
      "likelyQuestion": "Most likely exam question in one line"
    }
  ],
  "quickFacts": ["Critical fact 1"],
  "doNotForget": ["Common mistake 1"]
}
ONLY return JSON`
}

function quickRevisionPrompt(chunk, exam, syllabus, chunkIndex, totalChunks, subjectType, examProfile, canFill, plan) {
  const subjectExamInstructions = getSubjectExamInstructions(subjectType, examProfile, canFill)

  return `You are PrepIQ AI — quick revision specialist for Indian ${exam} students.
${subjectExamInstructions}
${syllabus ? `SYLLABUS:\n"""\n${syllabus}\n"""\n` : ''}

MATERIAL (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${chunk}
"""
LANGUAGE RULE: Detect the language of the uploaded material. If material is in Hindi, respond in Hindi. If in English, respond in simple easy English that a class 11-12 student can understand. If in Hinglish (mixed Hindi-English), respond in Hinglish matching the same style. Keep technical terms (like DNA, GST, IVF) in English always. Always use simple, easy words — avoid complex jargon. If a technical term is necessary, explain it in simple words in brackets right after.

Return ONLY valid JSON:
{
  "subject": "Subject name",
  "chapter": "Chapter/topic name",
  "flashcards": [{ "front": "Question", "back": "Answer", "topic": "Topic", "difficulty": "Easy|Medium|Hard" }],
  "oneLiners": [{ "concept": "Term", "oneLiner": "One sentence definition" }],
  "comparisons": [{ "title": "X vs Y", "itemA": "X", "itemB": "Y", "points": [{ "aspect": "Aspect", "a": "X value", "b": "Y value" }] }],
  "formulas": [{ "name": "Formula name", "formula": "Exact formula", "usedFor": "When to use" }]
}

RULES:
- flashcards + oneLiners: one per every concept in source
- comparisons: ONLY if source genuinely compares, else []
- formulas: ALL from source, else []
- ONLY return JSON`
}

function pyqPrompt(notesChunk, pyqContent, exam, chunkIndex, totalChunks) {
  return `You are PrepIQ AI — PYQ analysis specialist for Indian ${exam} students.

STUDENT'S NOTES (Part ${chunkIndex + 1} of ${totalChunks}):
"""
${notesChunk}
"""

PREVIOUS YEAR QUESTIONS:
"""
${pyqContent}
"""

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
          "howToAnswer": "Specific tip"
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
RULES: year = extract from paper if visible, else "Sample Paper". COVERAGE MANDATE: Cover EVERY topic from student notes — do not skip any. Every topic in notes must appear in pyqAnalysis array. ONLY return JSON`
}

// ─── MERGE HELPERS ────────────────────────────────────────────────────────────
function mergeExamNotes(results) {
  const base = { subject: '', chapter: '', topics: [], mistakes: [], questions: [] }
  const seenTopics = new Set()
  
  for (const c of results) {
    if (!base.subject && c.subject) base.subject = c.subject
    if (!base.chapter && c.chapter) base.chapter = c.chapter
    if (Array.isArray(c.topics)) {
      for (const topic of c.topics) {
        const key = topic.title?.toLowerCase().trim()
        if (key && !seenTopics.has(key)) {
          seenTopics.add(key)
          base.topics.push(topic)
        }
      }
    }
    if (Array.isArray(c.mistakes)) base.mistakes.push(...c.mistakes)
    if (Array.isArray(c.questions)) base.questions.push(...c.questions)
  }
  return base
}

function mergePoetryExamNotes(results) {
  const base = { subject: 'English Literature', chapter: 'Poetry Analysis', poems: [] }
  for (const c of results) {
    if (Array.isArray(c.poems)) base.poems.push(...c.poems)
  }
  return base
}

function mergePoetryMCQ(results) {
  const base = { subject: 'English Literature', chapter: 'Poetry', mcqs: [] }
  for (const c of results) {
    if (Array.isArray(c.mcqs)) base.mcqs.push(...c.mcqs)
  }
  return base
}

function mergePoetryLastMinute(results) {
  const base = { subject: 'English Literature', chapter: 'Poetry', poems: [], doNotForget: [] }
  for (const c of results) {
    if (Array.isArray(c.poems)) base.poems.push(...c.poems)
    if (Array.isArray(c.doNotForget)) base.doNotForget.push(...c.doNotForget)
  }
  return base
}

function mergePoetryQuickRevision(results) {
  const base = { subject: 'English Literature', chapter: 'Poetry', flashcards: [], oneLiners: [], devicesList: [], comparisons: [] }
  for (const c of results) {
    if (Array.isArray(c.flashcards)) base.flashcards.push(...c.flashcards)
    if (Array.isArray(c.oneLiners)) base.oneLiners.push(...c.oneLiners)
    if (Array.isArray(c.devicesList)) base.devicesList.push(...c.devicesList)
    if (Array.isArray(c.comparisons)) base.comparisons.push(...c.comparisons)
  }
  return base
}

function mergeProseExamNotes(results) {
  const base = { subject: 'English Literature', chapter: 'Prose Analysis', passages: [] }
  for (const c of results) {
    if (Array.isArray(c.passages)) base.passages.push(...c.passages)
  }
  return base
}

function mergeProseLastMinute(results) {
  const base = { subject: 'English Literature', chapter: 'Prose', passages: [], doNotForget: [] }
  for (const c of results) {
    if (Array.isArray(c.passages)) base.passages.push(...c.passages)
    if (Array.isArray(c.doNotForget)) base.doNotForget.push(...c.doNotForget)
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

    // ─── AUTH CHECK ───────────────────────────────────────────────────────────
    const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL
    const supabaseClient = await createRouteClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return Response.json({ success: false, error: 'Please login to continue.' }, { status: 401 })
    }

    // ─── FETCH USER DATA FROM SUPABASE (always server-side, never trust client) ─
    let userData = null
    if (user.email !== DEV_EMAIL) {
      const { data } = await supabaseClient
        .from('users')
        .select('plan, generates_used')
        .eq('id', user.id)
        .single()
      userData = data
    }

    // ─── USAGE LIMIT CHECK ────────────────────────────────────────────────────
    if (user.email !== DEV_EMAIL) {
      const GENERATE_LIMITS = { free: 4, weekly: 10, pro: 30, promax: 50 }
      const userLimit = GENERATE_LIMITS[userData?.plan || 'free']
      const used = userData?.generates_used || 0

      if (used >= userLimit) {
        return Response.json({
          success: false,
          error: `You've used all ${userLimit} generates. Upgrade your plan!`
        }, { status: 403 })
      }
    }

    const exam = formData.get('exam') || 'General'
    const mode = formData.get('mode') || 'exam-notes'
    const syllabus = formData.get('syllabus') || ''
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

    if (mode !== 'pyq' && (!content || content.trim().length < 10)) {
      return Response.json({ success: false, error: 'Could not extract text. Please use a text-based PDF or paste a URL.' }, { status: 400 })
    }
    if (mode === 'pyq' && !pyqContent.trim()) {
      return Response.json({ success: false, error: 'Please upload at least one PYQ or sample paper.' }, { status: 400 })
    }

    // ─── PAGE LIMIT CHECK ─────────────────────────────────────────────────────
    // FIX: always use plan from Supabase, never from client
    const effectivePlan = user.email === DEV_EMAIL ? 'promax' : (userData?.plan || 'free')
    const pageLimit = PAGE_LIMITS[effectivePlan] || PAGE_LIMITS.free
    const charLimit = pageLimit * CHARS_PER_PAGE
    const estimatedPages = Math.ceil(content.length / CHARS_PER_PAGE)
    const processPages = formData.get('processPages')

    if (content.length > charLimit) {
      if (processPages === 'partial') {
        content = content.slice(0, charLimit)
        console.log(`Truncated to ${pageLimit} pages`)
      } else {
        return Response.json({ success: false, error: 'page_limit_exceeded', estimatedPages, pageLimit, plan: effectivePlan }, { status: 400 })
      }
    }

    // ─── DETECT SUBJECT + EXAM PROFILE ───────────────────────────────────────
    const subjectType = detectSubjectType(content)
    const examProfile = getExamProfile(exam)
    const fillGaps = canAIFillGaps(examProfile)
    const isPoetry = subjectType === 'poetry'
    const isProse = subjectType === 'prose'
    console.log(`Subject: ${subjectType} | Exam: ${examProfile} | Gap fill: ${fillGaps}`)

    // Dynamic chunk size based on plan
    let chunkSize = 20000
    if (effectivePlan !== 'free') {
      if (estimatedPages <= 25) chunkSize = 20000
      else if (estimatedPages <= 75) chunkSize = 20000
      else chunkSize = 25000
    }

    const allChunks = chunkText(content, chunkSize)
    const chunksNeeded = allChunks.length
    const maxChunks = effectivePlan === 'free' ? 1 : Math.min(chunksNeeded, 15)
    const chunks = allChunks.slice(0, maxChunks)

    const pyqSlice = pyqContent.slice(0, 6000)

    console.log(`Processing ${chunks.length} chunks`)

    const results = await Promise.all(chunks.map(async (chunk, i) => {
      let prompt = ''

      if (isPoetry) {
        if (mode === 'exam-notes') prompt = poetryExamNotesPrompt(chunk, exam, i, chunks.length)
        else if (mode === 'mcq') prompt = poetryMCQPrompt(chunk, exam, i, chunks.length)
        else if (mode === 'last-minute') prompt = poetryLastMinutePrompt(chunk, exam, i, chunks.length)
        else if (mode === 'quick-revision') prompt = poetryQuickRevisionPrompt(chunk, exam, i, chunks.length)
        else if (mode === 'pyq') prompt = pyqPrompt(chunk, pyqSlice, exam, i, chunks.length)
      } else if (isProse) {
        if (mode === 'exam-notes') prompt = proseExamNotesPrompt(chunk, exam, i, chunks.length)
        else if (mode === 'mcq') prompt = proseMCQPrompt(chunk, exam, i, chunks.length)
        else if (mode === 'last-minute') prompt = proseLastMinutePrompt(chunk, exam, i, chunks.length)
        else if (mode === 'quick-revision') prompt = quickRevisionPrompt(chunk, exam, syllabus, i, chunks.length, subjectType, examProfile, fillGaps, effectivePlan)
        else if (mode === 'pyq') prompt = pyqPrompt(chunk, pyqSlice, exam, i, chunks.length)
      } else {
        if (mode === 'exam-notes') prompt = examNotesPrompt(chunk, exam, syllabus, i, chunks.length, subjectType, examProfile, fillGaps, effectivePlan)
        else if (mode === 'mcq') prompt = mcqPrompt(chunk, exam, syllabus, i, chunks.length, subjectType, examProfile, fillGaps, effectivePlan)
        else if (mode === 'last-minute') prompt = lastMinutePrompt(chunk, exam, syllabus, i, chunks.length, subjectType, examProfile, fillGaps, effectivePlan)
        else if (mode === 'quick-revision') prompt = quickRevisionPrompt(chunk, exam, syllabus, i, chunks.length, subjectType, examProfile, fillGaps, effectivePlan)
        else if (mode === 'pyq') prompt = pyqPrompt(chunk, pyqSlice, exam, i, chunks.length)
      }

      const raw = await callAI(prompt, getMaxTokens(mode, chunks.length, effectivePlan))
      return safeParse(raw)
    }))

    let merged
    if (isPoetry && mode !== 'pyq') {
      if (mode === 'exam-notes') merged = mergePoetryExamNotes(results)
      else if (mode === 'mcq') merged = mergePoetryMCQ(results)
      else if (mode === 'last-minute') merged = mergePoetryLastMinute(results)
      else if (mode === 'quick-revision') merged = mergePoetryQuickRevision(results)
    } else if (isProse && mode !== 'pyq') {
      if (mode === 'exam-notes') merged = mergeProseExamNotes(results)
      else if (mode === 'mcq') merged = mergeMCQ(results)
      else if (mode === 'last-minute') merged = mergeProseLastMinute(results)
      else if (mode === 'quick-revision') merged = mergeQuickRevision(results)
    } else {
      if (mode === 'exam-notes') merged = mergeExamNotes(results)
      else if (mode === 'mcq') merged = mergeMCQ(results)
      else if (mode === 'last-minute') merged = mergeLastMinute(results)
      else if (mode === 'quick-revision') merged = mergeQuickRevision(results)
      else if (mode === 'pyq') merged = mergePYQ(results)
    }

    // ─── INCREMENT GENERATE COUNT ON SUCCESS (only for non-dev users) ─────────
    if (user.email !== DEV_EMAIL) {
      await supabaseClient
        .from('users')
        .update({ generates_used: (userData?.generates_used || 0) + 1 })
        .eq('id', user.id)
    }

    return Response.json({ success: true, data: merged, mode, subjectType, totalChunks: chunks.length })

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