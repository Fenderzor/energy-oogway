import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page'
import Rich from '../components/Rich'
import { problemRepo } from '../lib/repositories/problemRepo'
import { recordProblemAttempt } from '../lib/problemProgress'
import { getStats, recordProblem } from '../lib/stats'
import type { Stats } from '../lib/stats'
import { currentUserId } from '../lib/user'
import { DEFAULT_TRACK } from '../lib/tracks'
import type { Difficulty, Problem } from '../types'

const STARS: Record<Difficulty, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐' }

function chapterLabel(deckId: string): string {
  return `Ch ${deckId.replace(/^ch0*/, '')}`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function gradeNumeric(p: Problem, typed: string): boolean {
  const v = parseFloat(typed.replace(',', '.'))
  if (Number.isNaN(v) || p.answer === undefined) return false
  const tol = p.tolerance ?? Math.max(Math.abs(p.answer) * 0.015, 1e-9)
  return Math.abs(v - p.answer) <= tol
}

export default function ProblemSession() {
  const { chapterId, level } = useParams()
  const userId = currentUserId()

  const [problems, setProblems] = useState<Problem[] | null>(null)
  const [heading, setHeading] = useState('Practice')
  const [error, setError] = useState<string | null>(null)

  // Per-problem UI state
  const [idx, setIdx] = useState(0)
  const [hintsShown, setHintsShown] = useState(0)
  const [typed, setTyped] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [showSolution, setShowSolution] = useState(false)

  // Session tally
  const [sessionXp, setSessionXp] = useState(0)
  const [solvedThisSession, setSolvedThisSession] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (chapterId) {
          const set = await problemRepo.getChapter(chapterId)
          if (cancelled) return
          const isThermo = (set.track ?? DEFAULT_TRACK) === DEFAULT_TRACK
          setHeading(isThermo ? `Ch ${set.chapter} — ${set.title}` : set.title)
          setProblems([...set.problems].sort((a, b) => a.difficulty - b.difficulty))
        } else if (level) {
          const d = Number(level) as Difficulty
          const list = await problemRepo.list()
          // Difficulty buckets are thermo-only (see Practice).
          const sets = await Promise.all(
            list
              .filter((c) => c.count > 0 && (c.track ?? DEFAULT_TRACK) === DEFAULT_TRACK)
              .map((c) => problemRepo.getChapter(c.chapterId)),
          )
          if (cancelled) return
          const all = sets.flatMap((s) => s.problems).filter((p) => p.difficulty === d)
          setHeading(`${STARS[d]} problems`)
          setProblems(shuffle(all))
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chapterId, level])

  function resetProblemState() {
    setHintsShown(0)
    setTyped('')
    setSelected(null)
    setAnswered(false)
    setCorrect(null)
    setShowSolution(false)
  }

  async function settle(p: Problem, isCorrect: boolean) {
    setAnswered(true)
    setCorrect(isCorrect)
    if (isCorrect) setSolvedThisSession((n) => n + 1)
    await recordProblemAttempt(userId, p.id, isCorrect)
    const { xp } = await recordProblem(userId, p.difficulty, isCorrect)
    setSessionXp((x) => x + xp)
  }

  function submitNumeric(p: Problem) {
    if (typed.trim() === '') return
    void settle(p, gradeNumeric(p, typed))
  }

  function chooseMcq(p: Problem, i: number) {
    setSelected(i)
    void settle(p, i === p.answerIndex)
  }

  function next() {
    if (!problems) return
    if (idx + 1 >= problems.length) {
      void getStats(userId).then(setStats)
      setIdx(problems.length) // move past the end → done screen
    } else {
      setIdx((i) => i + 1)
    }
    resetProblemState()
  }

  if (error) {
    return (
      <Page title="Practice">
        <div className="card error">{error}</div>
        <Link to="/practice" className="backlink">
          ← All problems
        </Link>
      </Page>
    )
  }

  if (!problems) {
    return (
      <Page title="Practice">
        <p className="muted">Loading…</p>
      </Page>
    )
  }

  if (problems.length === 0) {
    return (
      <Page title={heading}>
        <p className="muted">No problems here yet.</p>
        <Link to="/practice" className="backlink">
          ← All problems
        </Link>
      </Page>
    )
  }

  // Done screen
  if (idx >= problems.length) {
    const total = problems.length
    const pct = Math.round((solvedThisSession / total) * 100)
    return (
      <Page title={heading}>
        <div className="card done">
          <div className="done-emoji" aria-hidden="true">
            🐢
          </div>
          <h3>Session complete!</h3>
          <p className="muted">
            Solved {solvedThisSession} of {total} ({pct}%) · +{sessionXp} XP
            {stats ? ` · 🔥 ${stats.streak}-day streak` : ''}
          </p>
          <button
            type="button"
            className="btn btn-primary cram-btn"
            onClick={() => {
              setIdx(0)
              setSolvedThisSession(0)
              setSessionXp(0)
              resetProblemState()
            }}
          >
            Practice again
          </button>
        </div>
        <Link to="/practice" className="backlink">
          ← All problems
        </Link>
      </Page>
    )
  }

  const p = problems[idx]
  const hints = p.hints ?? []

  return (
    <Page title={heading}>
      <div className="study-progress">
        <span>
          Problem {idx + 1} of {problems.length}
        </span>
        <span>+{sessionXp} XP</span>
      </div>

      <div className="card problem-card">
        <div className="problem-head">
          <span className={`diff-tag diff-tag--${p.difficulty}`} aria-label={`difficulty ${p.difficulty}`}>
            {STARS[p.difficulty]}
          </span>
          <h3 className="problem-title">{p.title}</h3>
        </div>

        <Rich className="problem-scenario" text={p.scenario} />

        {/* Hints */}
        {hints.length > 0 && (
          <div className="hints">
            {hints.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="hint">
                <span className="hint-label">Hint {i + 1}</span>
                <Rich text={h} />
              </div>
            ))}
            {hintsShown < hints.length && !showSolution && (
              <button
                type="button"
                className="btn btn-ghost hint-btn"
                onClick={() => setHintsShown((n) => n + 1)}
              >
                💡 {hintsShown === 0 ? 'Show a hint' : 'Next hint'} ({hints.length - hintsShown} left)
              </button>
            )}
          </div>
        )}

        {/* Numeric input */}
        {p.kind === 'numeric' && !answered && !showSolution && (
          <form
            className="numeric-input"
            onSubmit={(e) => {
              e.preventDefault()
              submitNumeric(p)
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
            {p.unit && <span className="unit">{p.unit}</span>}
            <button type="submit" className="btn btn-primary" disabled={typed.trim() === ''}>
              Check
            </button>
          </form>
        )}

        {/* MCQ */}
        {p.kind === 'mcq' && p.choices && (
          <ul className="choices">
            {p.choices.map((choice, i) => {
              let cls = 'choice'
              if (answered) {
                if (i === p.answerIndex) cls += ' choice--correct'
                else if (i === selected) cls += ' choice--wrong'
              }
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => chooseMcq(p, i)}
                  >
                    {choice}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Open / self-graded */}
        {p.kind === 'open' && !answered && showSolution && (
          <div className="self-grade">
            <span className="muted">Did you get it?</span>
            <div className="self-grade-btns">
              <button type="button" className="btn rate-again" onClick={() => void settle(p, false)}>
                Missed it
              </button>
              <button type="button" className="btn rate-good" onClick={() => void settle(p, true)}>
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Feedback + revealed answer for graded kinds */}
        {answered && correct !== null && p.kind !== 'open' && (
          <div className={`feedback ${correct ? 'feedback--ok' : 'feedback--no'}`}>
            {correct ? '✓ Correct' : '✗ Not quite'}
            {p.kind === 'numeric' && p.answer !== undefined && (
              <span className="feedback-answer">
                {' '}
                · Answer: {p.answer} {p.unit}
              </span>
            )}
          </div>
        )}

        {/* Worked solution */}
        {showSolution && (
          <div className="solution">
            <span className="flashcard-label">Worked solution</span>
            <Rich className="solution-body" text={p.solution} />
            {p.equationsUsed && p.equationsUsed.length > 0 && (
              <div className="eq-used">
                <span className="eq-label">Equations used</span>
                <div className="eq-chips">
                  {p.equationsUsed.map((eq, i) => (
                    <Rich key={i} className="eq-chip" text={`$${eq}$`} />
                  ))}
                </div>
              </div>
            )}
            {p.conceptLink && (
              <Link className="concept-link" to={`/library/${p.conceptLink}`}>
                📘 Review {chapterLabel(p.conceptLink)} reference
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!showSolution && (
        <button type="button" className="btn btn-secondary" onClick={() => setShowSolution(true)}>
          {p.kind === 'open' || answered ? 'Show worked solution' : 'Reveal solution & skip'}
        </button>
      )}

      {(answered || (showSolution && p.kind !== 'open')) && (
        <button type="button" className="btn btn-primary" onClick={next}>
          {idx + 1 >= problems.length ? 'Finish' : 'Next problem →'}
        </button>
      )}

      <Link to="/practice" className="backlink">
        ← All problems
      </Link>
    </Page>
  )
}
