import { describe, expect, it } from 'vitest'
import type { Attempt, Question } from './types'
import { weakQuestions } from './weak'

const q = (id: string): Question => ({
  id,
  code: id,
  exam: 'X',
  domain: '1',
  domainTitle: '',
  section: 's',
  number: 1,
  stem: '',
  choices: [],
  answer: ['A'],
  explanation: '',
})
const at = (questionId: string, correct: boolean, ts: number): Attempt => ({
  questionId,
  correct,
  ts,
  chosen: [],
  ms: 0,
  mode: 'study',
})

describe('weakQuestions', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'].map(q)

  it('直近の不正解と、正答率の低い問題を選ぶ', () => {
    const attempts = [
      at('a', true, 1), // 一度正解だけ → 弱点ではない
      at('b', false, 2), // 直近不正解
      at('c', false, 1),
      at('c', true, 5), // 直近正解だが 1/2 = 50%
      at('d', false, 1),
      at('d', true, 2),
      at('d', true, 3),
      at('d', true, 4), // 3/4 = 75% → 弱点ではない
      at('e', true, 1),
      at('e', false, 9), // 直近不正解。正答率 50% なので 0% の b より後
    ]
    expect(weakQuestions(pool, attempts).map((x) => x.id)).toEqual(['b', 'e', 'c'])
  })

  it('未解答の問題は含めない', () => {
    expect(weakQuestions(pool, [])).toEqual([])
  })
})
