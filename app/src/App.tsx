import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Today from './routes/Today'
import Learn from './routes/Learn'
import Library from './routes/Library'
import Practice from './routes/Practice'
import Settings from './routes/Settings'

// Lazy-loaded so the markdown + KaTeX bundle only loads when it's needed.
const StudyDeck = lazy(() => import('./routes/StudyDeck'))
const ChapterDoc = lazy(() => import('./routes/ChapterDoc'))
const ProblemSession = lazy(() => import('./routes/ProblemSession'))
const QuizSession = lazy(() => import('./routes/QuizSession'))
const ExamProblemSession = lazy(() => import('./routes/ExamProblemSession'))

const lazyFallback = (
  <div className="page">
    <p className="muted">Loading…</p>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="learn" element={<Learn />} />
        <Route
          path="learn/:deckId"
          element={
            <Suspense
              fallback={
                <div className="page">
                  <p className="muted">Loading…</p>
                </div>
              }
            >
              <StudyDeck />
            </Suspense>
          }
        />
        <Route path="library" element={<Library />} />
        <Route
          path="library/:chapterId"
          element={
            <Suspense
              fallback={
                <div className="page">
                  <p className="muted">Loading…</p>
                </div>
              }
            >
              <ChapterDoc />
            </Suspense>
          }
        />
        <Route path="practice" element={<Practice />} />
        <Route
          path="practice/chapter/:chapterId"
          element={
            <Suspense
              fallback={
                <div className="page">
                  <p className="muted">Loading…</p>
                </div>
              }
            >
              <ProblemSession />
            </Suspense>
          }
        />
        <Route
          path="practice/level/:level"
          element={
            <Suspense
              fallback={
                <div className="page">
                  <p className="muted">Loading…</p>
                </div>
              }
            >
              <ProblemSession />
            </Suspense>
          }
        />
        <Route
          path="practice/quiz/:chapterId"
          element={<Suspense fallback={lazyFallback}>{<QuizSession />}</Suspense>}
        />
        <Route
          path="practice/exam"
          element={<Suspense fallback={lazyFallback}>{<QuizSession />}</Suspense>}
        />
        <Route
          path="practice/exam-problem/:id"
          element={<Suspense fallback={lazyFallback}>{<ExamProblemSession />}</Suspense>}
        />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
