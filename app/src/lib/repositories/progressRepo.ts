import { getDB } from '../db'
import type { ProgressRepo } from './types'

// Local (IndexedDB) implementation of ProgressRepo. Used for spaced-repetition
// state in Phase 2; defined now so the seam exists from day one.
export const localProgressRepo: ProgressRepo = {
  async get(userId, cardId) {
    return (await getDB()).get('progress', [userId, cardId])
  },
  async getAllForDeck(userId, deckId) {
    return (await getDB()).getAllFromIndex(
      'progress',
      'by-user-deck',
      IDBKeyRange.only([userId, deckId]),
    )
  },
  async put(progress) {
    await (await getDB()).put('progress', progress)
  },
}
