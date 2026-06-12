import { fetchJson } from '../fetchJson'
import type { ExamProblemRepo } from './types'
import type { ExamProblemBundle } from '../../types'

export const examProblemRepo: ExamProblemRepo = {
  async all() {
    const bundle = await fetchJson<ExamProblemBundle>('data/exam-problems/index.json')
    return bundle.problems
  },
}
