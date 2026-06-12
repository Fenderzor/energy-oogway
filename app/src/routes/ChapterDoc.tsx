import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page'
import Rich from '../components/Rich'
import { libraryRepo } from '../lib/repositories/libraryRepo'
import type { ChapterDoc } from '../types'

type TabId = 'summary' | 'equations' | 'glossary' | 'tips'

const TAB_META: { id: TabId; label: string; emoji: string }[] = [
  { id: 'summary', label: 'Summary', emoji: '📝' },
  { id: 'equations', label: 'Equations', emoji: '🧮' },
  { id: 'glossary', label: 'Glossary', emoji: '📖' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
]

export default function ChapterDocPage() {
  const { chapterId = '' } = useParams()
  const [doc, setDoc] = useState<ChapterDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('summary')

  useEffect(() => {
    let cancelled = false
    setDoc(null)
    setError(null)
    libraryRepo
      .get(chapterId)
      .then((d) => {
        if (!cancelled) setDoc(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [chapterId])

  const availableTabs = useMemo(() => {
    if (!doc) return []
    return TAB_META.filter((t) => {
      if (t.id === 'summary') return Boolean(doc.summary)
      if (t.id === 'equations') return (doc.equations?.length ?? 0) > 0
      if (t.id === 'glossary') return (doc.glossary?.length ?? 0) > 0
      if (t.id === 'tips') return (doc.tips?.length ?? 0) > 0
      return false
    })
  }, [doc])

  // Keep the active tab valid once the doc loads.
  useEffect(() => {
    if (availableTabs.length && !availableTabs.some((t) => t.id === tab)) {
      setTab(availableTabs[0].id)
    }
  }, [availableTabs, tab])

  if (error) {
    return (
      <Page title="Library">
        <div className="card error">Couldn’t load this chapter. {error}</div>
        <Link className="back-link" to="/library">
          ← Back to Library
        </Link>
      </Page>
    )
  }

  if (!doc) {
    return (
      <Page title="Library">
        <p className="muted">Loading chapter…</p>
      </Page>
    )
  }

  return (
    <Page title={`Ch ${doc.chapter} — ${doc.title}`} subtitle={doc.source}>
      <div className="doc-toolbar">
        <Link className="back-link" to="/library">
          ← Library
        </Link>
        {doc.deckId && (
          <Link className="concept-link" to={`/learn/${doc.deckId}`}>
            📘 Study Ch {doc.chapter}
          </Link>
        )}
      </div>

      <div className="doc-tabs" role="tablist">
        {availableTabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`doc-tab ${tab === t.id ? 'doc-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.emoji} </span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && doc.summary && (
        <div className="card doc-card">
          <Rich text={doc.summary} />
        </div>
      )}

      {tab === 'equations' && doc.equations && (
        <div className="eq-list">
          {doc.equations.map((eq, i) => (
            <div key={i} className="card eq-card">
              <h3 className="eq-name">{eq.name}</h3>
              <Rich className="eq-math" text={`$$${eq.latex}$$`} />
              {eq.rearrangements && eq.rearrangements.length > 0 && (
                <div className="eq-rearr">
                  <span className="eq-label">Rearranged for…</span>
                  {eq.rearrangements.map((r, j) => (
                    <Rich key={j} className="eq-math eq-math--sub" text={`$$${r}$$`} />
                  ))}
                </div>
              )}
              {eq.useWhen && (
                <div className="eq-usewhen">
                  <span className="eq-usewhen-tag">Use when</span>
                  <Rich className="eq-usewhen-text" text={eq.useWhen} />
                </div>
              )}
              {eq.note && <Rich className="eq-note muted" text={eq.note} />}
            </div>
          ))}
        </div>
      )}

      {tab === 'glossary' && doc.glossary && (
        <dl className="glossary">
          {doc.glossary.map((g, i) => (
            <div key={i} className="card glossary-item">
              <dt className="glossary-term">{g.term}</dt>
              <dd className="glossary-def">
                <Rich text={g.definition} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {tab === 'tips' && doc.tips && (
        <div className="card doc-card">
          <ul className="tips-list">
            {doc.tips.map((t, i) => (
              <li key={i}>
                <Rich text={t} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Page>
  )
}
