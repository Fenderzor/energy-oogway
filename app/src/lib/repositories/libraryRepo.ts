import { fetchJson } from '../fetchJson'
import type { LibraryRepo } from './types'
import type { ChapterDoc, LibraryIndex } from '../../types'

export const libraryRepo: LibraryRepo = {
  async list() {
    const idx = await fetchJson<LibraryIndex>('data/library/index.json')
    return idx.chapters
  },
  get: (chapterId: string) => fetchJson<ChapterDoc>(`data/library/${chapterId}.json`),
}
