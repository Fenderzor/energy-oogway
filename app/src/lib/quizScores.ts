// Quiz/exam attempt history, stored as one blob in the IndexedDB 'settings'
// store (key `quizzes:<userId>`) so no schema migration is needed.
import { getDB } from './db'
import type { QuizCategory } from '../types'

export interface QuizAttempt {
  at: string // ISO timestamp
  correct: number
  total: number
  pct: number // 0–100, rounded
  seconds: number
  byCategory: Partial<Record<QuizCategory, { correct: number; total: number }>>
}

export interface QuizRecord {
  attempts: QuizAttempt[]
  bestPct: number
}

/** Keyed by quiz id: 'ch01'…'ch07' for chapter quizzes, 'exam' for the full exam. */
export type QuizScoreMap = Record<string, QuizRecord>

const key = (userId: string) => `quizzes:${userId}`
const MAX_ATTEMPTS_KEPT = 20

export async function getQuizScores(userId: string): Promise<QuizScoreMap> {
  const db = await getDB()
  return ((await db.get('settings', key(userId))) as QuizScoreMap | undefined) ?? {}
}

export async function recordQuizAttempt(
  userId: string,
  quizId: string,
  attempt: QuizAttempt,
): Promise<QuizScoreMap> {
  const db = await getDB()
  const map = ((await db.get('settings', key(userId))) as QuizScoreMap | undefined) ?? {}
  const rec = map[quizId] ?? { attempts: [], bestPct: 0 }
  rec.attempts = [...rec.attempts, attempt].slice(-MAX_ATTEMPTS_KEPT)
  rec.bestPct = Math.max(rec.bestPct, attempt.pct)
  map[quizId] = rec
  await db.put('settings', map, key(userId))
  return map
}
