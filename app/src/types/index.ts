// Domain types for Energy Oogway.
// Kept framework-free and portable so they survive UI changes or a move to RN.

// ---------- News ----------
export interface NewsItem {
  id: string
  headline: string
  summary: string
  whyItMatters?: string
  sourceName?: string
  sourceUrl?: string
  tags?: string[]
  /** Optional link to a learning concept, e.g. a deckId like "ch09". */
  conceptLink?: string
}

export interface NewsSection {
  /** global | geopolitics | technology | regulation | finland | netherlands */
  id: string
  title: string
  emoji?: string
  items: NewsItem[]
}

export interface NewsBriefing {
  date: string // YYYY-MM-DD
  generatedAt: string // ISO timestamp
  tldr?: string
  sections: NewsSection[]
}

export interface NewsIndex {
  latest: string // date of the newest briefing
  briefings: string[] // available dates, newest first
}

// ---------- Decks / cards ----------
export type CardType = 'basic' | 'cloze' | 'mcq' | 'numeric'

export interface Card {
  id: string
  type: CardType
  front: string
  back: string
  hint?: string
  tags?: string[]
  level?: 'intro' | 'core' | 'advanced'
  // For mcq:
  choices?: string[]
  answerIndex?: number
  // For numeric:
  answer?: number
  unit?: string
  tolerance?: number
}

export interface Deck {
  deckId: string
  title: string
  chapter?: number
  source?: string
  description?: string
  // Ownership/versioning metadata — supports future sharing & forking.
  owner: string // "local" for now
  version: number
  forkedFrom?: string | null
  updatedAt: string
  cards: Card[]
}

export interface DeckSummary {
  deckId: string
  title: string
  chapter?: number
  description?: string
  cardCount: number
}

export interface DeckIndex {
  decks: DeckSummary[]
}

// ---------- Library (reference / revision) ----------
export interface KeyEquation {
  /** Short name, e.g. "Hydrostatic pressure". */
  name: string
  /** LaTeX body, rendered as display math. */
  latex: string
  /** Solved-for variants — each a LaTeX string, rendered as display math. */
  rearrangements?: string[]
  /** The situation that should make you reach for this equation (markdown + inline math). */
  useWhen?: string
  /** Extra context: symbol meanings, caveats, units (markdown + inline math). */
  note?: string
}

export interface GlossaryTerm {
  term: string
  /** Definition (markdown + inline math). */
  definition: string
}

export interface ChapterDoc {
  chapterId: string // "ch01"
  chapter: number
  title: string
  source?: string
  /** Linked flashcard deck, e.g. "ch01". */
  deckId?: string
  /** Chapter narrative (markdown + math). */
  summary?: string
  equations?: KeyEquation[]
  glossary?: GlossaryTerm[]
  /** Exam tips / common pitfalls (markdown bullets). */
  tips?: string[]
  updatedAt: string
}

export interface ChapterDocSummary {
  chapterId: string
  chapter: number
  title: string
  /** One-line topic list for the Library index. */
  topics?: string
  /** Which blocks have content: any of "summary" | "equations" | "glossary" | "tips". */
  sections: string[]
}

export interface LibraryIndex {
  chapters: ChapterDocSummary[]
}

// ---------- Practice problems ----------
/** 1 = ⭐ (plug-in) · 2 = ⭐⭐ (two-step) · 3 = ⭐⭐⭐ (multi-step) · 4 = ⭐⭐⭐⭐ (Master's). */
export type Difficulty = 1 | 2 | 3 | 4

export type ProblemKind = 'numeric' | 'mcq' | 'open'

export interface Problem {
  id: string // "ch04-p001"
  chapter: number
  difficulty: Difficulty
  title: string
  tags?: string[]
  kind: ProblemKind
  /** Full problem statement incl. given values (markdown + math). */
  scenario: string
  // numeric:
  answer?: number
  unit?: string
  /** Absolute tolerance in `unit`; if omitted a relative tolerance is used. */
  tolerance?: number
  // mcq:
  choices?: string[]
  answerIndex?: number
  /** Progressive nudges, revealed one at a time. */
  hints?: string[]
  /** Step-by-step worked solution (markdown + math). */
  solution: string
  /** Key equations used, as LaTeX strings — shown as chips with the solution. */
  equationsUsed?: string[]
  /** Link to the matching deck / library chapter, e.g. "ch04". */
  conceptLink?: string
}

export interface ProblemSet {
  chapterId: string
  chapter: number
  title: string
  updatedAt: string
  problems: Problem[]
}

export interface ProblemSetSummary {
  chapterId: string
  chapter: number
  title: string
  topics?: string
  count: number
  byDifficulty: Record<Difficulty, number>
}

export interface ProblemIndex {
  chapters: ProblemSetSummary[]
}

// ---------- Multi-part exam-style problems ----------
/** One gradeable sub-part (a, b, c…) of an integrative exam-style problem. */
export interface ExamProblemPart {
  id: string // "ex01-a"
  label: string // "a"
  prompt: string
  kind: ProblemKind
  // numeric:
  answer?: number
  unit?: string
  tolerance?: number
  // mcq:
  choices?: string[]
  answerIndex?: number
  hint?: string
  /** Lets the student proceed if they couldn't get an earlier part, e.g. "If you couldn't find ṁ, use 15 kg/min." */
  fallbackNote?: string
  /** Worked solution for this part (markdown + math). */
  solution: string
}

export interface ExamProblem {
  id: string // "ex01"
  title: string
  /** Chapters this problem integrates, e.g. [3, 4, 7]. */
  chapters: number[]
  tags?: string[]
  /** Shared setup and given values (markdown + math). */
  scenario: string
  parts: ExamProblemPart[]
  /** Library/deck ids to review, e.g. ["ch07", "ch08"]. */
  conceptLinks?: string[]
}

export interface ExamProblemSummary {
  id: string
  title: string
  chapters: number[]
  partCount: number
  tags?: string[]
}

/** The full bundle (a small curated collection, loaded in one fetch). */
export interface ExamProblemBundle {
  problems: ExamProblem[]
}

// ---------- Quizzes & exam ----------
/** concept = definitions/ideas · applied = which approach fits the situation ·
 *  equation = forms & rearrangements · problem = short numeric calculation. */
export type QuizCategory = 'concept' | 'applied' | 'equation' | 'problem'

export interface QuizQuestion {
  id: string // "ch01-q01"
  chapter: number
  category: QuizCategory
  kind: 'mcq' | 'numeric'
  /** The question (markdown + math). */
  prompt: string
  // mcq:
  choices?: string[]
  answerIndex?: number
  // numeric:
  answer?: number
  unit?: string
  tolerance?: number
  /** One-to-two sentence explanation, shown after answering / in review. */
  explanation: string
}

export interface QuizBank {
  chapterId: string
  chapter: number
  title: string
  updatedAt: string
  questions: QuizQuestion[]
}

export interface QuizBankSummary {
  chapterId: string
  chapter: number
  title: string
  count: number
  byCategory: Record<QuizCategory, number>
}

export interface QuizIndex {
  chapters: QuizBankSummary[]
}

// ---------- Spaced-repetition progress ----------
export interface CardProgress {
  userId: string
  cardId: string
  deckId: string
  ease: number // SM-2 ease factor
  intervalDays: number
  dueDate: string // ISO date
  reps: number
  lapses: number
  lastReviewed?: string
  updatedAt: string
}
