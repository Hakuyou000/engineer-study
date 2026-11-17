import { describe, expect, it } from 'vitest'
import { accuracy, computeStats } from './stats'
import type { Attempt, Card, Question } from './types'

const q = (id: string, domain: string, section: string): Question => ({
  id,
  exam: 'CCNA',
  domain,
  domainTitle: 'T',
  section,
  number: 1,
  stem: '',
  choices: [],
  answer: ['A'],
  explanation: '',
})
const at = (questionId: string, correct: boolean): Attempt => ({
  questionId,
  correct,
  ts: 0,
  chosen: [],
  ms: 0,
  mode: 'study',
})

describe('computeStats', () => {
  it('分野と小項目ごとに集計する', () => {
    const questions = [q('a', '1.0', 's1'), q('b', '1.0', 's1'), q('c', '1.0', 's2'), q('d', '2.0', 's3')]
    const attempts = [at('a', true), at('a', false), at('c', true)]
    const cards = new Map<string, Card>([
      ['a', { questionId: 'a', ease: 2.5, intervalDays: 0, reps: 0, lapses: 1, due: 5, last: 0 }],
      ['c', { questionId: 'c', ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, due: 500, last: 0 }],
    ])
    const [d1, d2] = computeStats(questions, attempts, cards, 100)
    expect(d1).toMatchObject({ total: 3, seen: 2, attempts: 3, correct: 2, due: 1 })
    expect(d1.sections.map((s) => [s.key, s.total, s.seen, s.due])).toEqual([
      ['s1', 2, 1, 1],
      ['s2', 1, 1, 0],
    ])
    expect(accuracy(d1)).toBeCloseTo(2 / 3)
    expect(accuracy(d2)).toBeNull()
  })
})
