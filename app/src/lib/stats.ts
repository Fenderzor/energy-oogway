// Gamification stats: XP, daily streak, daily goal — stored locally in IndexedDB.
import { getDB } from './db'
import { addDays, todayStr } from './date'
import type { Rating } from './srs'
import type { Difficulty } from '../types'

export interface Stats {
  userId: string
  xpTotal: number
  xpToday: number
  reviewedToday: number
  lastStudyDate: string // YYYY-MM-DD
  streak: number
  longestStreak: number
  dailyGoal: number
}

function defaults(userId: string): Stats {
  return {
    userId,
    xpTotal: 0,
    xpToday: 0,
    reviewedToday: 0,
    lastStudyDate: '',
    streak: 0,
    longestStreak: 0,
    dailyGoal: 20,
  }
}

const key = (userId: string) => `stats:${userId}`

export async function getStats(userId: string): Promise<Stats> {
  const db = await getDB()
  const s = (await db.get('settings', key(userId))) as Stats | undefined
  return s ? { ...defaults(userId), ...s } : defaults(userId)
}

async function save(s: Stats): Promise<void> {
  const db = await getDB()
  await db.put('settings', s, key(s.userId))
}

export function xpForRating(rating: Rating): number {
  switch (rating) {
    case 'again':
      return 2
    case 'hard':
      return 8
    case 'good':
      return 10
    case 'easy':
      return 12
  }
}

/** Roll the day forward and update the streak when the first activity of a new day arrives. */
function rollover(s: Stats): Stats {
  const today = todayStr()
  if (s.lastStudyDate !== today) {
    const yesterday = addDays(today, -1)
    s.streak = s.lastStudyDate === yesterday ? s.streak + 1 : 1
    s.longestStreak = Math.max(s.longestStreak, s.streak)
    s.xpToday = 0
    s.reviewedToday = 0
    s.lastStudyDate = today
  }
  return s
}

/** Apply XP for one activity (review or problem) and count it toward today's goal. */
async function award(userId: string, xp: number): Promise<{ stats: Stats; xp: number }> {
  const s = rollover(await getStats(userId))
  s.xpTotal += xp
  s.xpToday += xp
  s.reviewedToday += 1
  await save(s)
  return { stats: s, xp }
}

/** Record one flashcard review. */
export function recordReview(userId: string, rating: Rating): Promise<{ stats: Stats; xp: number }> {
  return award(userId, xpForRating(rating))
}

/** XP for solving a practice problem — scaled by difficulty; a wrong attempt still earns a little. */
export function xpForProblem(difficulty: Difficulty, correct: boolean): number {
  if (!correct) return 5
  return difficulty === 1 ? 15 : difficulty === 2 ? 25 : difficulty === 3 ? 40 : 60
}

/** Record one solved part of a multi-part exam-style problem (20 XP correct, 5 wrong). */
export function recordExamPart(
  userId: string,
  correct: boolean,
): Promise<{ stats: Stats; xp: number }> {
  return award(userId, correct ? 20 : 5)
}

/** Record one practice-problem attempt. */
export function recordProblem(
  userId: string,
  difficulty: Difficulty,
  correct: boolean,
): Promise<{ stats: Stats; xp: number }> {
  return award(userId, xpForProblem(difficulty, correct))
}

/** XP for a finished quiz/exam: 5 per correct answer, +20 bonus at ≥80%. */
export function xpForQuiz(correct: number, total: number): number {
  return correct * 5 + (total > 0 && correct / total >= 0.8 ? 20 : 0)
}

/** Record one completed quiz/exam session (counts as one activity toward the goal). */
export function recordQuiz(
  userId: string,
  correct: number,
  total: number,
): Promise<{ stats: Stats; xp: number }> {
  return award(userId, xpForQuiz(correct, total))
}

export async function setDailyGoal(userId: string, goal: number): Promise<Stats> {
  const s = await getStats(userId)
  s.dailyGoal = goal
  await save(s)
  return s
}

/** Today's live values (zeroed if the last study day isn't today). */
export function todayView(s: Stats): { xpToday: number; reviewedToday: number } {
  const today = todayStr()
  return s.lastStudyDate === today
    ? { xpToday: s.xpToday, reviewedToday: s.reviewedToday }
    : { xpToday: 0, reviewedToday: 0 }
}
