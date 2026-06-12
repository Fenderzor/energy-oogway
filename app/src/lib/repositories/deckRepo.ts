import { fetchJson } from '../fetchJson'
import type { DeckRepo } from './types'
import type { Deck, DeckIndex, DeckSummary } from '../../types'

export const deckRepo: DeckRepo = {
  async list(): Promise<DeckSummary[]> {
    const idx = await fetchJson<DeckIndex>('data/decks/index.json')
    return idx.decks
  },
  get: (deckId: string) => fetchJson<Deck>(`data/decks/${deckId}.json`),
}
