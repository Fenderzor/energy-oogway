import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
import { libraryRepo } from '../lib/repositories/libraryRepo'
import { groupByTrack, trackMeta } from '../lib/tracks'
import type { ChapterDocSummary } from '../types'

export default function Library() {
  const [chapters, setChapters] = useState<ChapterDocSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    libraryRepo
      .list()
      .then(setChapters)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const groups = chapters ? groupByTrack(chapters) : []
  const showHeaders = groups.length > 1

  return (
    <Page title="Library" subtitle="Summaries, formula sheets & glossary">
      {error && <div className="card error">{error}</div>}
      {!chapters && !error && <p className="muted">Loading library…</p>}

      {groups.map((group) => (
        <section key={group.meta.id} className="track-section">
          {showHeaders && <h2 className="section-title">{group.meta.label}</h2>}
          <div className="chapter-list">
            {group.items.map((c) => {
              const ready = c.sections.length > 0
              const row = (
                <>
                  <span className="chip">
                    {trackMeta(c.track).chip} {c.chapter}
                  </span>
                  <div className="chapter-text">
                    <h3 className="chapter-title">{c.title}</h3>
                    {c.topics && <p className="muted">{c.topics}</p>}
                  </div>
                  {ready ? (
                    <span className="chapter-go" aria-hidden="true">
                      →
                    </span>
                  ) : (
                    <span className="badge-soon">soon</span>
                  )}
                </>
              )
              return ready ? (
                <Link
                  key={c.chapterId}
                  to={`/library/${c.chapterId}`}
                  className="card chapter-row chapter-row--link"
                >
                  {row}
                </Link>
              ) : (
                <div key={c.chapterId} className="card chapter-row chapter-row--soon">
                  {row}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </Page>
  )
}
