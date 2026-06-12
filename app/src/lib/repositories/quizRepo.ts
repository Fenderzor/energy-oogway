import { fetchJson } from '../fetchJson'
import type { QuizRepo } from './types'
import type { QuizBank, QuizIndex } from '../../types'

export const quizRepo: QuizRepo = {
  async list() {
    const idx = await fetchJson<QuizIndex>('data/quizzes/index.json')
    return idx.chapters
  },
  getBank: (chapterId: string) => fetchJson<QuizBank>(`data/quizzes/${chapterId}.json`),
}
