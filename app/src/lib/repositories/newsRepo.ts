import { fetchJson } from '../fetchJson'
import type { NewsRepo } from './types'
import type { NewsBriefing, NewsIndex } from '../../types'

export const newsRepo: NewsRepo = {
  getIndex: () => fetchJson<NewsIndex>('data/news/index.json'),
  getBriefing: (date: string) => fetchJson<NewsBriefing>(`data/news/${date}.json`),
  async getLatest(opts?: { bust?: boolean }) {
    const index = await fetchJson<NewsIndex>('data/news/index.json', opts)
    return fetchJson<NewsBriefing>(`data/news/${index.latest}.json`, opts)
  },
}
