import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
import StatsBar from '../components/StatsBar'
import { deckRepo } from '../lib/repositories/deckRepo'
import { getDeckCounts } from '../lib/deckProgress'
import type { DeckCounts } from '../lib/deckProgress'
import { currentUserId } from '../lib/user'
import { groupByTrack, trackMeta } from '../lib/tracks'
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

  const groups = decks ? groupByTrack(decks) : []
  const showHeaders = groups.length > 1

  return (
    <Page title="Learn" subtitle="Flashcards · spaced repetition">
      <StatsBar />
      {error && <div className="card error">{error}</div>}
      {!decks && !error && <p className="muted">Loading decks…</p>}

      {groups.map((group) => (
        <section key={group.meta.id} className="track-section">
          {showHeaders && <h2 className="section-title">{group.meta.label}</h2>}
          <div className="deck-list">
            {group.items.map((d) => {
              const c = counts[d.deckId]
              return (
                <Link key={d.deckId} to={`/learn/${d.deckId}`} className="card deck-card">
                  <div className="deck-card-top">
                    {d.chapter != null && (
                      <span className="chip">
                        {trackMeta(d.track).chip} {d.chapter}
                      </span>
                    )}
                    <span className="deck-counts">
                      {c ? (
                        <>
                          {c.due > 0 && (
                            <span className="deck-badge deck-badge--due">{c.due} due</span>
                          )}
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
        </section>
      ))}
    </Page>
  )
}
