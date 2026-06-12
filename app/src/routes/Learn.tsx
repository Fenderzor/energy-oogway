import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
import StatsBar from '../components/StatsBar'
import { deckRepo } from '../lib/repositories/deckRepo'
import { getDeckCounts } from '../lib/deckProgress'
import type { DeckCounts } from '../lib/deckProgress'
import { currentUserId } from '../lib/user'
import type { DeckSummary } from '../types'

export default function Learn() {
  const userId = currentUserId()
  const [decks, setDecks] = useState<DeckSummary[] | null>(null)
  const [counts, setCounts] = useState<Record<string, DeckCounts>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await deckRepo.list()
        if (cancelled) return
        setDecks(list)
        const entries = await Promise.all(
          list.map(async (d) => [d.deckId, await getDeckCounts(userId, d.deckId, d.cardCount)] as const),
        )
        if (!cancelled) setCounts(Object.fromEntries(entries))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Page title="Learn" subtitle="Thermodynamics · Cengel Ch 1–8">
      <StatsBar />
      {error && <div className="card error">{error}</div>}
      {!decks && !error && <p className="muted">Loading decks…</p>}

      <div className="deck-list">
        {decks?.map((d) => {
          const c = counts[d.deckId]
          return (
            <Link key={d.deckId} to={`/learn/${d.deckId}`} className="card deck-card">
              <div className="deck-card-top">
                {d.chapter != null && <span className="chip">Ch {d.chapter}</span>}
                <span className="deck-counts">
                  {c ? (
                    <>
                      {c.due > 0 && <span className="deck-badge deck-badge--due">{c.due} due</span>}
                      {c.newCount > 0 && (
                        <span className="deck-badge deck-badge--new">{c.newCount} new</span>
                      )}
                      {c.due === 0 && c.newCount === 0 && (
                        <span className="deck-count">✓ reviewed</span>
                      )}
                    </>
                  ) : (
                    <span className="deck-count">{d.cardCount} cards</span>
                  )}
                </span>
              </div>
              <h3 className="deck-title">{d.title}</h3>
              {d.description && <p className="muted">{d.description}</p>}
            </Link>
          )
        })}
      </div>
    </Page>
  )
}
