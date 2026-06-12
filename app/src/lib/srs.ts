// Spaced-repetition scheduling (SM-2 variant) with four ratings.
import { addDays, todayStr } from './date'
import type { CardProgress } from '../types'

export type Rating = 'again' | 'hard' | 'good' | 'easy'

const MIN_EASE = 1.3
const DEFAULT_EASE = 2.5

export interface SrsCore {
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  dueDate: string
}

export function newCardState(): SrsCore {
  return { ease: DEFAULT_EASE, intervalDays: 0, reps: 0, lapses: 0, dueDate: todayStr() }
}

/** Compute the next SRS state from the previous one and a rating. */
export function schedule(prev: SrsCore, rating: Rating, today: string = todayStr()): SrsCore {
  let ease = prev.ease
  let intervalDays = prev.intervalDays
  let reps = prev.reps
  let lapses = prev.lapses
  const isNew = reps === 0

  switch (rating) {
    case 'again':
      ease = Math.max(MIN_EASE, ease - 0.2)
      lapses += 1
      reps = 0
      intervalDays = 0 // relearn: due again today / this session
      break
    case 'hard':
      ease = Math.max(MIN_EASE, ease - 0.15)
      intervalDays = isNew ? 1 : Math.max(1, Math.round(intervalDays * 1.2))
      reps += 1
      break
    case 'good':
      intervalDays = isNew ? 1 : Math.max(1, Math.round(intervalDays * ease))
      reps += 1
      break
    case 'easy':
      ease = ease + 0.15
      intervalDays = isNew ? 4 : Math.max(1, Math.round(intervalDays * ease * 1.3))
      reps += 1
      break
  }

  return { ease, intervalDays, reps, lapses, dueDate: addDays(today, intervalDays) }
}

export function coreFromProgress(p: CardProgress): SrsCore {
  return {
    ease: p.ease,
    intervalDays: p.intervalDays,
    reps: p.reps,
    lapses: p.lapses,
    dueDate: p.dueDate,
  }
}

export function toProgress(
  userId: string,
  cardId: string,
  deckId: string,
  core: SrsCore,
): CardProgress {
  const now = new Date().toISOString()
  return {
    userId,
    cardId,
    deckId,
    ease: core.ease,
    intervalDays: core.intervalDays,
    dueDate: core.dueDate,
    reps: core.reps,
    lapses: core.lapses,
    lastReviewed: now,
    updatedAt: now,
  }
}
