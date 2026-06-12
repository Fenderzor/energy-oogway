import { localProgressRepo } from './repositories/progressRepo'
import { isDue, todayStr } from './date'

export interface DeckCounts {
  due: number
  newCount: number
  studied: number
}

/** Compute due / new counts for a deck from locally stored progress. */
export async function getDeckCounts(
  userId: string,
  deckId: string,
  cardCount: number,
): Promise<DeckCounts> {
  const progress = await localProgressRepo.getAllForDeck(userId, deckId)
  const today = todayStr()
  const due = progress.filter((p) => isDue(p.dueDate, today)).length
  const studied = progress.length
  return { due, studied, newCount: Math.max(0, cardCount - studied) }
}
