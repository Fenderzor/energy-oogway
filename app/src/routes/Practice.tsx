import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
import StatsBar from '../components/StatsBar'
import { problemRepo } from '../lib/repositories/problemRepo'
import { quizRepo } from '../lib/repositories/quizRepo'
import { examProblemRepo } from '../lib/repositories/examProblemRepo'
import { getProblemProgress } from '../lib/problemProgress'
import type { ProblemProgressMap } from '../lib/problemProgress'
import { getQuizScores } from '../lib/quizScores'
import type { QuizScoreMap } from '../lib/quizScores'
import { currentUserId } from '../lib/user'
import type { Difficulty, ExamProblem, ProblemSetSummary, QuizBankSummary } from '../types'

const DIFFS: Difficulty[] = [1, 2, 3, 4]
const STARS: Record<Difficulty, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐' }
const DIFF_NAME: Record<Difficulty, string> = {
  1: 'Starter',
  2: 'Core',
  3: 'Challenge',
  4: "Master's",
}

export default function Practice() {
  const userId = currentUserId()
  const [chapters, setChapters] = useState<ProblemSetSummary[] | null>(null)
  const [progress, setProgress] = useState<ProblemProgressMap>({})
  const [quizzes, setQuizzes] = useState<QuizBankSummary[] | null>(null)
  const [scores, setScores] = useState<QuizScoreMap>({})
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [list, prog, quizList, quizScores, exams] = await Promise.all([
          problemRepo.list(),
          getProblemProgress(userId),
          quizRepo.list().catch(() => []),
          getQuizScores(userId),
          examProblemRepo.all().catch(() => []),
        ])
        if (!cancelled) {
          setChapters(list)
          setProgress(prog)
          setQuizzes(quizList)
          setScores(quizScores)
          setExamProblems(exams)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const solvedInChapter = (chapterId: string) =>
    Object.entries(progress).filter(([id, s]) => id.startsWith(`${chapterId}-`) && s.solved).length

  const diffTotals: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  chapters?.forEach((c) => DIFFS.forEach((d) => (diffTotals[d] += c.byDifficulty[d] ?? 0)))

  return (
    <Page title="Practice" subtitle="Problem-solving · Cengel Ch 1–8">
      <StatsBar />
      {error && <div className="card error">{error}</div>}
      {!chapters && !error && <p className="muted">Loading problems…</p>}

      {quizzes && quizzes.length > 0 && (
        <section className="practice-section">
          <h2 className="section-title">Quizzes & exam</h2>
          <Link to="/practice/exam" className="card exam-card">
            <div className="exam-card-text">
              <h3 className="exam-title">📝 Full Exam</h3>
              <p className="muted">48 questions · Ch 1–8 · all categories · answers at the end</p>
            </div>
            <span className="quiz-best-badge">
              {scores['exam'] ? `Best ${scores['exam'].bestPct}%` : 'Not taken'}
            </span>
          </Link>
          <div className="quiz-grid">
            {quizzes.map((qz) => {
              const rec = scores[qz.chapterId]
              return (
                <Link
                  key={qz.chapterId}
                  to={`/practice/quiz/${qz.chapterId}`}
                  className="card quiz-chip"
                >
                  <span className="quiz-chip-ch">Ch {qz.chapter}</span>
                  <span className={`quiz-chip-score${rec ? '' : ' quiz-chip-score--none'}`}>
                    {rec ? `${rec.bestPct}%` : '—'}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {examProblems.length > 0 && (
        <section className="practice-section">
          <h2 className="section-title">🎓 Exam-style problems</h2>
          <p className="section-sub muted">
            Multi-part, integrative problems at Utrecht master's level.
          </p>
          <div className="exam-problem-list">
            {examProblems.map((ep) => {
              const solved = progress[ep.id]?.solved
              return (
                <Link
                  key={ep.id}
                  to={`/practice/exam-problem/${ep.id}`}
                  className="card exam-problem-row"
                >
                  <span className="diff-tag diff-tag--4" aria-hidden="true">
                    ⭐⭐⭐⭐
                  </span>
                  <div className="chapter-text">
                    <h3 className="chapter-title">{ep.title}</h3>
                    <p className="muted">
                      {ep.parts.length} parts · Ch {ep.chapters.join(' · ')}
                    </p>
                  </div>
                  {solved && <span className="deck-count">✓</span>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {chapters && (
        <>
          <section className="practice-section">
            <h2 className="section-title">Problems by difficulty</h2>
            <div className="difficulty-grid">
              {DIFFS.map((d) => {
                const total = diffTotals[d]
                const inner = (
                  <>
                    <span className="diff-stars" aria-hidden="true">
                      {STARS[d]}
                    </span>
                    <span className="diff-name">{DIFF_NAME[d]}</span>
                    <span className="diff-count">
                      {total} problem{total === 1 ? '' : 's'}
                    </span>
                  </>
                )
                return total > 0 ? (
                  <Link key={d} to={`/practice/level/${d}`} className="card diff-card">
                    {inner}
                  </Link>
                ) : (
                  <div key={d} className="card diff-card diff-card--empty">
                    {inner}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="practice-section">
            <h2 className="section-title">Problems by chapter</h2>
            <div className="chapter-list">
              {chapters.map((c) => {
                const ready = c.count > 0
                const solved = solvedInChapter(c.chapterId)
                const row = (
                  <>
                    <span className="chip">Ch {c.chapter}</span>
                    <div className="chapter-text">
                      <h3 className="chapter-title">{c.title}</h3>
                      {c.topics && <p className="muted">{c.topics}</p>}
                    </div>
                    {ready ? (
                      <span className="deck-counts">
                        {solved >= c.count ? (
                          <span className="deck-count">✓ all solved</span>
                        ) : (
                          <span className="deck-badge deck-badge--due">
                            {solved}/{c.count}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="badge-soon">soon</span>
                    )}
                  </>
                )
                return ready ? (
                  <Link
                    key={c.chapterId}
                    to={`/practice/chapter/${c.chapterId}`}
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
        </>
      )}
    </Page>
  )
}
