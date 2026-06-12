import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
import { newsRepo } from '../lib/repositories/newsRepo'
import { addDays, todayStr } from '../lib/date'
import type { NewsBriefing } from '../types'

function chapterLabel(deckId: string): string {
  const n = deckId.replace(/^ch0*/, '')
  return `Ch ${n}`
}

export default function Today() {
  const [briefing, setBriefing] = useState<NewsBriefing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(
    async (bust = false) => {
      if (bust) setRefreshing(true)
      try {
        const prev = briefing?.generatedAt
        const next = await newsRepo.getLatest(bust ? { bust: true } : undefined)
        setBriefing(next)
        setError(null)
        if (bust) setFlash(prev && next.generatedAt === prev ? 'Already up to date' : 'Briefing updated')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (bust) setFlash(`Couldn’t refresh — ${msg}`)
        else setError(msg)
      } finally {
        if (bust) setRefreshing(false)
      }
    },
    [briefing],
  )

  useEffect(() => {
    void load()
    // load once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss the transient status message.
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 3000)
    return () => clearTimeout(t)
  }, [flash])

  if (error) {
    return (
      <Page title="Today">
        <div className="card error">Couldn’t load the briefing. {error}</div>
      </Page>
    )
  }

  if (!briefing) {
    return (
      <Page title="Today">
        <p className="muted">Loading today’s briefing…</p>
      </Page>
    )
  }

  const today = todayStr()
  const full = new Date(briefing.date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const rel =
    briefing.date === today ? 'Today' : briefing.date === addDays(today, -1) ? 'Yesterday' : null
  const subtitle = rel ? `${rel} · ${full}` : full

  const updatedLabel = new Date(briefing.generatedAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Page title="Today’s Briefing" subtitle={subtitle}>
      <div className="briefing-bar">
        <span className="muted updated">Compiled {updatedLabel}</span>
        <button
          type="button"
          className="btn-ghost refresh-btn"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <span className={refreshing ? 'spin' : ''} aria-hidden="true">
            ↻
          </span>{' '}
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {flash && <p className="refresh-flash">{flash}</p>}

      {briefing.tldr && (
        <div className="card tldr">
          <h2 className="tldr-title">TL;DR</h2>
          <p>{briefing.tldr}</p>
        </div>
      )}

      {briefing.sections.map((section) => (
        <section key={section.id} className="news-section">
          <h2 className="section-title">
            {section.emoji && <span aria-hidden="true">{section.emoji} </span>}
            {section.title}
          </h2>
          {section.items.map((item) => (
            <article key={item.id} className="card news-item">
              <h3 className="news-headline">{item.headline}</h3>
              <p className="news-summary">{item.summary}</p>
              {item.whyItMatters && (
                <p className="news-why">
                  <strong>Why it matters:</strong> {item.whyItMatters}
                </p>
              )}
              {item.conceptLink && (
                <Link className="concept-link" to={`/learn/${item.conceptLink}`}>
                  📘 Study: {chapterLabel(item.conceptLink)}
                </Link>
              )}
              <div className="news-meta">
                <div className="tags">
                  {item.tags?.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                {item.sourceUrl && (
                  <a
                    className="source-link"
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.sourceName ?? 'Source'} ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      ))}
    </Page>
  )
}
