import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page'
import Rich from '../components/Rich'
import { quizRepo } from '../lib/repositories/quizRepo'
import { recordQuizAttempt } from '../lib/quizScores'
import type { QuizAttempt } from '../lib/quizScores'
import { recordQuiz } from '../lib/stats'
import type { Stats } from '../lib/stats'
import { currentUserId } from '../lib/user'
import { DEFAULT_TRACK } from '../lib/tracks'
import type { QuizBank, QuizCategory, QuizQuestion } from '../types'

const CATS: QuizCategory[] = ['concept', 'applied', 'equation', 'problem']

const CAT_META: Record<QuizCategory, { label: string; emoji: string }> = {
  concept: { label: 'Concept', emoji: '🧠' },
  applied: { label: 'Applied', emoji: '🎯' },
  equation: { label: 'Equation', emoji: '🧮' },
  problem: { label: 'Problem', emoji: '🔢' },
}

interface ResultEntry {
  q: QuizQuestion
  given: string
  ok: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Present MCQ choices in random order so the correct letter never forms a pattern. */
function withShuffledChoices(q: QuizQuestion): QuizQuestion {
  if (q.kind !== 'mcq' || !q.choices || q.answerIndex === undefined) return q
  const order = shuffle(q.choices.map((_, i) => i))
  return {
    ...q,
    choices: order.map((i) => q.choices![i]),
    answerIndex: order.indexOf(q.answerIndex),
  }
}

/** Chapter quiz: 3 random questions per category (12 total), shuffled. */
function sampleChapterQuiz(bank: QuizBank, perCat = 3): QuizQuestion[] {
  const picked: QuizQuestion[] = []
  for (const c of CATS) {
    picked.push(...shuffle(bank.questions.filter((q) => q.category === c)).slice(0, perCat))
  }
  return shuffle(picked).map(withShuffledChoices)
}

/**
 * Exam: `perChapter` questions from each chapter (default 6 → ~42 total).
 * All four categories are represented first, then the remainder is filled
 * from the rest of the bank — so every chapter is broadly covered each attempt.
 */
function sampleExam(banks: QuizBank[], perChapter = 6): QuizQuestion[] {
  const picked: QuizQuestion[] = []
  for (const bank of banks) {
    const pool = shuffle(bank.questions)
    const chosen: QuizQuestion[] = []
    const used = new Set<string>()
    for (const c of shuffle([...CATS])) {
      if (chosen.length >= perChapter) break
      const q = pool.find((x) => x.category === c && !used.has(x.id))
      if (q) {
        chosen.push(q)
        used.add(q.id)
      }
    }
    for (const q of pool) {
      if (chosen.length >= perChapter) break
      if (!used.has(q.id)) {
        chosen.push(q)
        used.add(q.id)
      }
    }
    picked.push(...chosen)
  }
  return shuffle(picked).map(withShuffledChoices)
}

function gradeNumeric(q: QuizQuestion, typed: string): boolean {
  const v = parseFloat(typed.replace(',', '.'))
  if (Number.isNaN(v) || q.answer === undefined) return false
  const tol = q.tolerance ?? Math.max(Math.abs(q.answer) * 0.015, 1e-9)
  return Math.abs(v - q.answer) <= tol
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function QuizSession() {
  const { chapterId } = useParams()
  const isExam = !chapterId
  const userId = currentUserId()
  const quizId = chapterId ?? 'exam'

  const [banks, setBanks] = useState<QuizBank[] | null>(null)
  const [heading, setHeading] = useState(isExam ? 'Full Exam' : 'Quiz')
  const [error, setError] = useState<string | null>(null)

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false) // instant (quiz) mode only
  const [results, setResults] = useState<ResultEntry[]>([])
  const [finished, setFinished] = useState(false)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [bestPct, setBestPct] = useState<number | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)

  const startRef = useRef(Date.now())

  // Load bank(s) once, then build the first sampled session.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (chapterId) {
          const bank = await quizRepo.getBank(chapterId)
          if (cancelled) return
          setHeading(
            bank.track && bank.track !== DEFAULT_TRACK ? bank.title : `Ch ${bank.chapter} Quiz`,
          )
          setBanks([bank])
          setQuestions(sampleChapterQuiz(bank))
        } else {
          // The Full Exam is the thermodynamics exam — keep other tracks out of it.
          const list = await quizRepo.list()
          const loaded = await Promise.all(
            list
              .filter((c) => c.count > 0 && (c.track ?? DEFAULT_TRACK) === DEFAULT_TRACK)
              .map((c) => quizRepo.getBank(c.chapterId)),
          )
          if (cancelled) return
          setBanks(loaded)
          setQuestions(sampleExam(loaded))
        }
        startRef.current = Date.now()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chapterId])

  function retake() {
    if (!banks) return
    setQuestions(isExam ? sampleExam(banks) : sampleChapterQuiz(banks[0]))
    setIdx(0)
    setTyped('')
    setSelected(null)
    setAnswered(false)
    setResults([])
    setFinished(false)
    setAttempt(null)
    setXpEarned(0)
    setStats(null)
    startRef.current = Date.now()
  }

  async function finish(finalResults: ResultEntry[]) {
    const total = finalResults.length
    const correct = finalResults.filter((r) => r.ok).length
    const byCategory: QuizAttempt['byCategory'] = {}
    for (const r of finalResults) {
      const c = (byCategory[r.q.category] ??= { correct: 0, total: 0 })
      c.total += 1
      if (r.ok) c.correct += 1
    }
    const a: QuizAttempt = {
      at: new Date().toISOString(),
      correct,
      total,
      pct: total ? Math.round((correct / total) * 100) : 0,
      seconds: Math.max(0, Math.round((Date.now() - startRef.current) / 1000)),
      byCategory,
    }
    setAttempt(a)
    setFinished(true)
    const map = await recordQuizAttempt(userId, quizId, a)
    setBestPct(map[quizId]?.bestPct ?? a.pct)
    const { stats: s, xp } = await recordQuiz(userId, correct, total)
    setXpEarned(xp)
    setStats(s)
  }

  function advance(nextResults: ResultEntry[]) {
    if (!questions) return
    if (idx + 1 >= questions.length) {
      void finish(nextResults)
    } else {
      setIdx((i) => i + 1)
      setTyped('')
      setSelected(null)
      setAnswered(false)
    }
  }

  /** Record an answer. Quiz mode: show feedback, wait for Next. Exam mode: advance now. */
  function settle(q: QuizQuestion, ok: boolean, given: string) {
    const next = [...results, { q, given, ok }]
    setResults(next)
    if (isExam) {
      advance(next)
    } else {
      setAnswered(true)
    }
  }

  function chooseMcq(q: QuizQuestion, i: number) {
    setSelected(i)
    settle(q, i === q.answerIndex, q.choices?.[i] ?? '')
  }

  function submitNumeric(q: QuizQuestion) {
    if (typed.trim() === '') return
    settle(q, gradeNumeric(q, typed), `${typed}${q.unit ? ` ${q.unit}` : ''}`)
  }

  if (error) {
    return (
      <Page title={heading}>
        <div className="card error">{error}</div>
        <Link to="/practice" className="backlink">
          ← Practice
        </Link>
      </Page>
    )
  }

  if (!questions) {
    return (
      <Page title={heading}>
        <p className="muted">Loading…</p>
      </Page>
    )
  }

  // ----- Results screen -----
  if (finished && attempt) {
    const wrong = results.filter((r) => !r.ok)
    return (
      <Page title={heading} subtitle={isExam ? 'Ch 1–7 · all categories' : undefined}>
        <div className="card quiz-result">
          <div className="quiz-score">{attempt.pct}%</div>
          <p className="muted">
            {attempt.correct} of {attempt.total} correct · ⏱ {fmtTime(attempt.seconds)} · +
            {xpEarned} XP{stats ? ` · 🔥 ${stats.streak}` : ''}
          </p>
          {bestPct !== null && (
            <p className="quiz-best">
              {attempt.pct >= bestPct ? '🏆 New best score!' : `Best so far: ${bestPct}%`}
            </p>
          )}

          <div className="cat-breakdown">
            {CATS.filter((c) => attempt.byCategory[c]).map((c) => {
              const v = attempt.byCategory[c]!
              return (
                <div key={c} className="cat-row">
                  <span className="cat-label">
                    {CAT_META[c].emoji} {CAT_META[c].label}
                  </span>
                  <div className="cat-bar">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${v.total ? (v.correct / v.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="cat-count">
                    {v.correct}/{v.total}
                  </span>
                </div>
              )
            })}
          </div>

          <button type="button" className="btn btn-primary cram-btn" onClick={retake}>
            Retake ({isExam ? 'new mix' : 'new questions'})
          </button>
        </div>

        {wrong.length > 0 && (
          <section className="quiz-review">
            <h2 className="section-title">Review · {wrong.length} to revisit</h2>
            {wrong.map((r, i) => (
              <div key={i} className="card review-item">
                <span className="review-cat">
                  {CAT_META[r.q.category].emoji} {CAT_META[r.q.category].label} · Ch {r.q.chapter}
                </span>
                <Rich className="review-prompt" text={r.q.prompt} />
                <div className="review-given">
                  ✗ Your answer: <Rich className="inline-rich" text={r.given || '—'} />
                </div>
                <div className="review-correct">
                  ✓ Correct:{' '}
                  <Rich
                    className="inline-rich"
                    text={
                      r.q.kind === 'mcq'
                        ? (r.q.choices?.[r.q.answerIndex ?? 0] ?? '')
                        : `${r.q.answer}${r.q.unit ? ` ${r.q.unit}` : ''}`
                    }
                  />
                </div>
                <Rich className="review-expl muted" text={r.q.explanation} />
              </div>
            ))}
          </section>
        )}

        <Link to="/practice" className="backlink">
          ← Practice
        </Link>
      </Page>
    )
  }

  // ----- Active question -----
  const q = questions[idx]
  const correct = answered ? results[results.length - 1]?.ok : null

  return (
    <Page title={heading} subtitle={isExam ? 'Answers revealed at the end' : undefined}>
      <div className="study-progress">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span className="quiz-cat-tag">
          {CAT_META[q.category].emoji} {CAT_META[q.category].label}
        </span>
      </div>

      <div className="card problem-card">
        <Rich className="problem-scenario" text={q.prompt} />

        {q.kind === 'mcq' && q.choices && (
          <ul className="choices">
            {q.choices.map((choice, i) => {
              let cls = 'choice'
              if (answered) {
                if (i === q.answerIndex) cls += ' choice--correct'
                else if (i === selected) cls += ' choice--wrong'
              }
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => chooseMcq(q, i)}
                  >
                    <Rich className="choice-rich" text={choice} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {q.kind === 'numeric' && !answered && (
          <form
            className="numeric-input"
            onSubmit={(e) => {
              e.preventDefault()
              submitNumeric(q)
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Your answer"
              autoFocus
            />
            {q.unit && <span className="unit">{q.unit}</span>}
            <button type="submit" className="btn btn-primary" disabled={typed.trim() === ''}>
              {isExam ? 'Submit' : 'Check'}
            </button>
          </form>
        )}

        {/* Instant-feedback block (chapter quizzes only) */}
        {answered && correct !== null && (
          <>
            <div className={`feedback ${correct ? 'feedback--ok' : 'feedback--no'}`}>
              {correct ? '✓ Correct' : '✗ Not quite'}
              {q.kind === 'numeric' && q.answer !== undefined && (
                <span className="feedback-answer">
                  {' '}
                  · Answer: {q.answer} {q.unit}
                </span>
              )}
            </div>
            <Rich className="quiz-expl" text={q.explanation} />
          </>
        )}
      </div>

      {answered && (
        <button type="button" className="btn btn-primary" onClick={() => advance(results)}>
          {idx + 1 >= questions.length ? 'See results' : 'Next →'}
        </button>
      )}

      <Link to="/practice" className="backlink">
        ← Practice
      </Link>
    </Page>
  )
}
