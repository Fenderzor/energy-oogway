// Lightweight per-problem progress (attempts + solved), stored as a single blob
// in the IndexedDB 'settings' store so no schema migration is needed.
import { getDB } from './db'

export interface ProblemStat {
  attempts: number
  solved: boolean
  lastAttempt: string // ISO timestamp
}

export type ProblemProgressMap = Record<string, ProblemStat>

const key = (userId: string) => `problems:${userId}`

export async function getProblemProgress(userId: string): Promise<ProblemProgressMap> {
  const db = await getDB()
  return ((await db.get('settings', key(userId))) as ProblemProgressMap | undefined) ?? {}
}

/** Record one attempt; `solved` stays true once a problem has ever been solved. */
export async function recordProblemAttempt(
  userId: string,
  problemId: string,
  correct: boolean,
): Promise<ProblemProgressMap> {
  const db = await getDB()
  const map = ((await db.get('settings', key(userId))) as ProblemProgressMap | undefined) ?? {}
  const prev = map[problemId]
  map[problemId] = {
    attempts: (prev?.attempts ?? 0) + 1,
    solved: (prev?.solved ?? false) || correct,
    lastAttempt: new Date().toISOString(),
  }
  await db.put('settings', map, key(userId))
  return map
}

/** How many problems in a list have been solved at least once. */
export function solvedCount(progress: ProblemProgressMap, ids: string[]): number {
  return ids.reduce((n, id) => n + (progress[id]?.solved ? 1 : 0), 0)
}
