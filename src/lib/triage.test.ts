import { describe, expect, it } from 'vitest'
import { triage } from './triage'
import type { Attempt, Question } from './types'

const q = (n: number): Question => ({
  id: `t-1.0-q${n}`,
  code: `T-1.0-00${n}`,
  exam: 'T',
  domain: '1.0',
  domainTitle: '分野',
  section: '1.1 小項目',
  number: n,
  stem: 's',
  choices: [],
  answer: ['A'],
  explanation: 'e',
})
const at = (n: number, correct: boolean): Attempt => ({ questionId: `t-1.0-q${n}`, ts: 0, chosen: [], correct, ms: 0, mode: 'study' })

describe('triage', () => {
  it('3 回以上解いて正答率が 34% 以下の問題だけを、正答率の低い順に挙げる', () => {
    const qs = [q(1), q(2), q(3), q(4), q(5)]
    const attempts = [
      ...[true, false, false].map((c) => at(1, c)),
      ...[false, false, false].map((c) => at(2, c)),
      ...[true, true, false].map((c) => at(3, c)),
      ...[false, false].map((c) => at(4, c)),
    ]
    expect(triage(qs, attempts).map((i) => [i.code, i.correct, i.attempts])).toEqual([
      ['T-1.0-002', 0, 3],
      ['T-1.0-001', 1, 3],
    ])
  })
})
