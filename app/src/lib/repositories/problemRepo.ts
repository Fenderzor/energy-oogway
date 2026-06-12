import { fetchJson } from '../fetchJson'
import type { ProblemRepo } from './types'
import type { ProblemIndex, ProblemSet } from '../../types'

export const problemRepo: ProblemRepo = {
  async list() {
    const idx = await fetchJson<ProblemIndex>('data/problems/index.json')
    return idx.chapters
  },
  getChapter: (chapterId: string) => fetchJson<ProblemSet>(`data/problems/${chapterId}.json`),
}
