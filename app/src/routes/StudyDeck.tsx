import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page'
import Rich from '../components/Rich'
import { deckRepo } from '../lib/repositories/deckRepo'
import { localProgressRepo } from '../lib/repositories/progressRepo'
import { currentUserId } from '../lib/user'
import { coreFromProgress, newCardState, schedule, toProgress } from '../lib/srs'
import type { Rating, SrsCore } from '../lib/srs'
import { isDue, todayStr } from '../lib/date'
import { getStats, recordReview } from '../lib/stats'
import type { Stats } from '../lib/stats'
import type { Card, Deck } from '../types'

interface QueueItem {
  card: Card
  core: SrsCore
}

function intervalLabel(days: number): string {
  if (days <= 0) return 'now'
  if (days === 1) return '1 d'
  if (days < 30) return `${days} d`
  return `${Math.round(days / 30)} mo`
}

function isInteractive(card: Card): boolean {
  return card.type === 'mcq' || card.type === 'numeric'
}

/** true/false for interactive cards; null for reveal-only (self-graded) cards. */
function grade(card: Card, selected: number | null, typed: string): boolean | null {
  if (card.type === 'mcq') return selected !== null && selected === card.answerIndex
  if (card.type === 'numeric') {
    const v = parseFloat(typed.replace(',', '.'))
    if (Number.isNaN(v) || card.answer === undefined) return false
    return Math.abs(v - card.answer) <= (card.tolerance ?? 0)
  }
  return null
}

const RATING_LABEL: Record<Rating, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

export default function StudyDeck() {
  const { deckId } = useParams()
  const userId = currentUserId()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [reviewed, setReviewed] = useState(0)
  const [sessionXp, setSessionXp] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!deckId) return
      setLoading(true)
      try {
        const d = await deckRepo.get(deckId)
        const progressList = await localProgressRepo.getAllForDeck(userId, deckId)
        const byId = new Map(progressList.map((p) => [p.cardId, p]))
        const today = todayStr()
        const due: QueueItem[] = []
        for (const card of d.cards) {
          const p = byId.get(card.id)
          if (!p) due.push({ card, core: newCardState() })
          else if (isDue(p.dueDate, today)) due.push({ card, core: coreFromProgress(p) })
        }
        if (!cancelled) {
          setDeck(d)
          setQueue(due)
          resetCardState()
          setReviewed(0)
          setSessionXp(0)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [deckId, userId])

  // Load stats for the done screen whenever the queue empties.
  useEffect(() => {
    if (!loading && deck && queue.length === 0) {
      void getStats(userId).then(setStats)
    }
  }, [loading, deck, queue.length, userId])

  function resetCardState() {
    setAnswered(false)
    setSelected(null)
    setTyped('')
  }

  async function rate(rating: Rating) {
    const head = queue[0]
    if (!head || !deck) return
    const next = schedule(head.core, rating)
    await localProgressRepo.put(toProgress(userId, head.card.id, deck.deckId, next))
    const { xp } = await recordReview(userId, rating)
    setSessionXp((x) => x + xp)
    setReviewed((n) => n + 1)
    resetCardState()
    setQueue((prev) => {
      const rest = prev.slice(1)
      if (rating === 'again') {
        const pos = Math.min(3, rest.length)
        return [...rest.slice(0, pos), { card: head.card, core: next }, ...rest.slice(pos)]
      }
      return rest
    })
  }

  async function cram() {
    if (!deck) return
    const progressList = await localProgressRepo.getAllForDeck(userId, deck.deckId)
    const byId = new Map(progressList.map((p) => [p.cardId, p]))
    const all: QueueItem[] = deck.cards.map((card) => {
      const p = byId.get(card.id)
      return { card, core: p ? coreFromProgress(p) : newCardState() }
    })
    setQueue(all)
    resetCardState()
    setReviewed(0)
    setSessionXp(0)
  }

  if (error) {
    return (
      <Page title="Study">
        <div className="card error">{error}</div>
        <Link to="/learn" className="backlink">
          ← All decks
        </Link>
      </Page>
    )
  }

  if (loading || !deck) {
    return (
      <Page title="Study">
        <p className="muted">Loading…</p>
      </Page>
    )
  }

  const head = queue[0]

  if (!head) {
    return (
      <Page title={deck.title}>
        <div className="card done">
          <div className="done-emoji" aria-hidden="true">
            🐢
          </div>
          {reviewed > 0 ? (
            <>
              <h3>Nice work!</h3>
              <p className="muted">
                Reviewed {reviewed} card{reviewed === 1 ? '' : 's'} · +{sessionXp} XP
                {stats ? ` · 🔥 ${stats.streak}-day streak` : ''}
              </p>
            </>
          ) : (
            <>
              <h3>Nothing due right now</h3>
              <p className="muted">Come back later, or study the whole deck ahead of schedule.</p>
            </>
          )}
          <button type="button" className="btn btn-primary cram-btn" onClick={() => void cram()}>
            Study all {deck.cards.length} cards
          </button>
        </div>
        <Link to="/learn" className="backlink">
          ← All decks
        </Link>
      </Page>
    )
  }

  const card = head.card
  const correct = answered ? grade(card, selected, typed) : null
  const reveal = !isInteractive(card)

  const ratingButtons = (ratings: Rating[]) => (
    <div className={`rating-grid${ratings.length === 3 ? ' rating-grid--3' : ''}`}>
      {ratings.map((r) => (
        <button
          key={r}
          type="button"
          className={`rate-btn rate-${r}`}
          onClick={() => void rate(r)}
        >
          <span className="lbl">{RATING_LABEL[r]}</span>
          <small>{intervalLabel(schedule(head.core, r).intervalDays)}</small>
        </button>
      ))}
    </div>
  )

  return (
    <Page title={deck.title}>
      <div className="study-progress">
        <span>Remaining: {queue.length}</span>
        <span>+{sessionXp} XP</span>
      </div>

      <div className="flashcard study-card">
        <div className="flashcard-face">
          {answered && correct !== null && (
            <div className={`feedback ${correct ? 'feedback--ok' : 'feedback--no'}`}>
              {correct ? '✓ Correct' : '✗ Not quite'}
            </div>
          )}

          <span className="flashcard-label">Question</span>
          <Rich className="flashcard-text" text={card.front} />

          {card.type === 'mcq' && card.choices && (
            <ul className="choices">
              {card.choices.map((choice, idx) => {
                let cls = 'choice'
                if (answered) {
                  if (idx === card.answerIndex) cls += ' choice--correct'
                  else if (idx === selected) cls += ' choice--wrong'
                }
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      className={cls}
                      disabled={answered}
                      onClick={() => {
                        setSelected(idx)
                        setAnswered(true)
                      }}
                    >
                      {choice}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {card.type === 'numeric' && !answered && (
            <form
              className="numeric-input"
              onSubmit={(e) => {
                e.preventDefault()
                if (typed.trim() !== '') setAnswered(true)
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
              {card.unit && <span className="unit">{card.unit}</span>}
              <button type="submit" className="btn btn-primary" disabled={typed.trim() === ''}>
                Check
              </button>
            </form>
          )}

          {reveal && !answered && card.hint && (
            <p className="flashcard-hint">Hint: {card.hint}</p>
          )}

          {answered && (
            <div className="answer-block">
              <span className="flashcard-label">Answer</span>
              <Rich className="flashcard-text" text={card.back} />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {!answered && reveal && (
        <button type="button" className="btn btn-primary" onClick={() => setAnswered(true)}>
          Show answer
        </button>
      )}

      {answered &&
        (correct === false ? (
          <button type="button" className="btn btn-primary" onClick={() => void rate('again')}>
            Continue
          </button>
        ) : correct === true ? (
          ratingButtons(['hard', 'good', 'easy'])
        ) : (
          ratingButtons(['again', 'hard', 'good', 'easy'])
        ))}

      <Link to="/learn" className="backlink">
        ← All decks
      </Link>
    </Page>
  )
}
