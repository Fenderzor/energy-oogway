// Repository interfaces. Feature code depends only on these, never on the
// concrete storage. v1 implements them locally (fetch + IndexedDB); a Supabase
// implementation can be swapped in later for accounts, sync & shared decks.
import type {
  CardProgress,
  ChapterDoc,
  Deck,
  DeckSummary,
  ExamProblem,
  LibraryIndex,
  NewsBriefing,
  NewsIndex,
  ProblemIndex,
  ProblemSet,
  QuizBank,
  QuizIndex,
} from '../../types'

export interface NewsRepo {
  getIndex(): Promise<NewsIndex>
  getBriefing(date: string): Promise<NewsBriefing>
  getLatest(opts?: { bust?: boolean }): Promise<NewsBriefing>
}

export interface DeckRepo {
  list(): Promise<DeckSummary[]>
  get(deckId: string): Promise<Deck>
}

export interface LibraryRepo {
  list(): Promise<LibraryIndex['chapters']>
  get(chapterId: string): Promise<ChapterDoc>
}

export interface ProblemRepo {
  list(): Promise<ProblemIndex['chapters']>
  getChapter(chapterId: string): Promise<ProblemSet>
}

export interface QuizRepo {
  list(): Promise<QuizIndex['chapters']>
  getBank(chapterId: string): Promise<QuizBank>
}

export interface ExamProblemRepo {
  all(): Promise<ExamProblem[]>
}

export interface ProgressRepo {
  get(userId: string, cardId: string): Promise<CardProgress | undefined>
  getAllForDeck(userId: string, deckId: string): Promise<CardProgress[]>
  put(progress: CardProgress): Promise<void>
}
