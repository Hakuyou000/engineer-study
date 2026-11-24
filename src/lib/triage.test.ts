import { describe, expect, it } from 'vitest'
import { triage } from './triage'
import type { Attempt, Flag, Question } from './types'

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
const flag = (n: number): Flag => ({ questionId: `t-1.0-q${n}`, code: `T-1.0-00${n}`, ts: 1, kind: '答えが違う', note: 'x' })

describe('triage', () => {
  it('指摘のある問題と、何度解いても正答率の低い問題を挙げる', () => {
    const qs = [q(1), q(2), q(3), q(4)]
    const attempts = [
      ...[false, false, false].map((c) => at(2, c)),
      ...[true, true, false].map((c) => at(3, c)),
      ...[false, false].map((c) => at(4, c)),
    ]
    const { items } = triage(qs, attempts, [flag(1)])
    expect(items.map((i) => [i.code, !!i.flag, i.suspect])).toEqual([
      ['T-1.0-001', true, false],
      ['T-1.0-002', false, true],
    ])
  })

  it('もうない問題への指摘は unknown に入れる', () => {
    expect(triage([q(1)], [], [flag(9)]).unknown.map((f) => f.code)).toEqual(['T-1.0-009'])
  })
})
