import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page'
import Rich from '../components/Rich'
import { examProblemRepo } from '../lib/repositories/examProblemRepo'
import { recordProblemAttempt } from '../lib/problemProgress'
import { recordExamPart } from '../lib/stats'
import { currentUserId } from '../lib/user'
import type { ExamProblem, ExamProblemPart } from '../types'

function chapterLabel(id: string): string {
  return `Ch ${id.replace(/^ch0*/, '')}`
}

function gradeNumeric(part: ExamProblemPart, typed: string): boolean {
  const v = parseFloat(typed.replace(',', '.'))
  if (Number.isNaN(v) || part.answer === undefined) return false
  const tol = part.tolerance ?? Math.max(Math.abs(part.answer) * 0.02, 1e-9)
  return Math.abs(v - part.answer) <= tol
}

export default function ExamProblemSession() {
  const { id = '' } = useParams()
  const userId = currentUserId()

  const [problem, setProblem] = useState<ExamProblem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [pi, setPi] = useState(0) // current part index
  const [typed, setTyped] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [sessionXp, setSessionXp] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    let cancelled = false
    examProblemRepo
      .all()
      .then((list) => {
        if (cancelled) return
        const p = list.find((x) => x.id === id)
        if (!p) setError('Problem not found.')
        else setProblem(p)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  function resetPart() {
    setTyped('')
    setSelected(null)
    setAnswered(false)
    setCorrect(null)
    setShowHint(false)
  }

  async function settle(ok: boolean) {
    setAnswered(true)
    setCorrect(ok)
    setResults((r) => [...r, ok])
    const { xp } = await recordExamPart(userId, ok)
    setSessionXp((x) => x + xp)
  }

  async function advance() {
    if (!problem) return
    if (pi + 1 >= problem.parts.length) {
      const allCorrect = [...results].every(Boolean) && results.length === problem.parts.length
      await recordProblemAttempt(userId, problem.id, allCorrect)
      setFinished(true)
    } else {
      setPi((i) => i + 1)
      resetPart()
    }
  }

  if (error) {
    return (
      <Page title="Exam-style problem">
        <div className="card error">{error}</div>
        <Link to="/practice" className="backlink">
          ← Practice
        </Link>
      </Page>
    )
  }
  if (!problem) {
    return (
      <Page title="Exam-style problem">
        <p className="muted">Loading…</p>
      </Page>
    )
  }

  const chaptersLabel = `Integrates Ch ${problem.chapters.join(' · ')}`

  if (finished) {
    const nCorrect = results.filter(Boolean).length
    return (
      <Page title={problem.title} subtitle={chaptersLabel}>
        <div className="card done">
          <div className="done-emoji" aria-hidden="true">
            🎓
          </div>
          <h3>Problem complete!</h3>
          <p className="muted">
            {nCorrect} of {problem.parts.length} parts correct · +{sessionXp} XP
          </p>
          {problem.conceptLinks && problem.conceptLinks.length > 0 && (
            <div className="exam-links">
              {problem.conceptLinks.map((c) => (
                <Link key={c} className="concept-link" to={`/library/${c}`}>
                  📘 Review {chapterLabel(c)}
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link to="/practice" className="backlink">
          ← Practice
        </Link>
      </Page>
    )
  }

  const part = problem.parts[pi]

  return (
    <Page title={problem.title} subtitle={chaptersLabel}>
      <div className="study-progress">
        <span>
          Part {pi + 1} of {problem.parts.length}
        </span>
        <span>+{sessionXp} XP</span>
      </div>

      {/* Shared scenario — always visible */}
      <div className="card exam-scenario">
        <span className="flashcard-label">Setup</span>
        <Rich text={problem.scenario} />
      </div>

      {/* Current part */}
      <div className="card problem-card">
        <div className="problem-head">
          <span className="part-tag">({part.label})</span>
          <Rich className="problem-scenario part-prompt" text={part.prompt} />
        </div>

        {part.fallbackNote && (
          <div className="fallback-note">
            <span aria-hidden="true">↩ </span>
            <Rich className="inline-rich" text={part.fallbackNote} />
          </div>
        )}

        {part.hint && !answered && (
          <div className="hints">
            {showHint ? (
              <div className="hint">
                <span className="hint-label">Hint</span>
                <Rich text={part.hint} />
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost hint-btn"
                onClick={() => setShowHint(true)}
              >
                💡 Show a hint
              </button>
            )}
          </div>
        )}

        {part.kind === 'numeric' && !answered && (
          <form
            className="numeric-input"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim() !== '') void settle(gradeNumeric(part, typed))
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
            {part.unit && <span className="unit">{part.unit}</span>}
            <button type="submit" className="btn btn-primary" disabled={typed.trim() === ''}>
              Check
            </button>
          </form>
        )}

        {part.kind === 'mcq' && part.choices && (
          <ul className="choices">
            {part.choices.map((choice, i) => {
              let cls = 'choice'
              if (answered) {
                if (i === part.answerIndex) cls += ' choice--correct'
                else if (i === selected) cls += ' choice--wrong'
              }
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => {
                      setSelected(i)
                      void settle(i === part.answerIndex)
                    }}
                  >
                    <Rich className="choice-rich" text={choice} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {part.kind === 'open' && !answered && (
          <button type="button" className="btn btn-secondary" onClick={() => settle(true)}>
            Show solution
          </button>
        )}

        {answered && part.kind !== 'open' && correct !== null && (
          <div className={`feedback ${correct ? 'feedback--ok' : 'feedback--no'}`}>
            {correct ? '✓ Correct' : '✗ Not quite'}
            {part.kind === 'numeric' && part.answer !== undefined && (
              <span className="feedback-answer">
                {' '}
                · Answer: {part.answer} {part.unit}
              </span>
            )}
          </div>
        )}

        {answered && (
          <div className="solution">
            <span className="flashcard-label">Solution ({part.label})</span>
            <Rich className="solution-body" text={part.solution} />
          </div>
        )}
      </div>

      {answered && (
        <button type="button" className="btn btn-primary" onClick={() => void advance()}>
          {pi + 1 >= problem.parts.length ? 'Finish' : 'Next part →'}
        </button>
      )}

      <Link to="/practice" className="backlink">
        ← Practice
      </Link>
    </Page>
  )
}
