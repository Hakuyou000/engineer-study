import { describe, expect, it } from 'vitest'
import { buildStudySession, isCorrect, review } from './srs'
import type { Card, Question } from './types'

const DAY = 86_400_000
const q = (id: string, answer = ['A']): Question => ({
  id,
  exam: 'X',
  domain: '1.0',
  domainTitle: '',
  section: 's',
  number: 1,
  stem: '',
  choices: [],
  answer,
  explanation: '',
})

describe('review', () => {
  it('正答が続くと 1 日 → 3 日 → 間隔×ease に伸びる', () => {
    let c = review(undefined, 'q', 'good', 0)
    expect(c.intervalDays).toBe(1)
    c = review(c, 'q', 'good', c.due)
    expect(c.intervalDays).toBe(3)
    c = review(c, 'q', 'good', c.due)
    expect(c.intervalDays).toBe(8) // round(3 × 2.5)
    expect(c.due).toBe(DAY * (1 + 3 + 8))
  })

  it('誤答で 10 分後に戻し、ease を下げる(下限 1.3)', () => {
    let c = review(undefined, 'q', 'good', 0)
    c = review(c, 'q', 'again', 1000)
    expect(c).toMatchObject({ reps: 0, lapses: 1, intervalDays: 0, due: 1000 + 600_000 })
    expect(c.ease).toBeCloseTo(2.3)
    for (let i = 0; i < 20; i++) c = review(c, 'q', 'again', 0)
    expect(c.ease).toBe(1.3)
  })

  it('hard は good より間隔が短い', () => {
    const base = review(review(undefined, 'q', 'good', 0), 'q', 'good', 0)
    expect(review(base, 'q', 'hard', 0).intervalDays).toBeLessThan(review(base, 'q', 'good', 0).intervalDays)
  })

  it('元のカードを書き換えない', () => {
    const c = review(undefined, 'q', 'good', 0)
    const copy = { ...c }
    review(c, 'q', 'again', 5)
    expect(c).toEqual(copy)
  })
})

describe('buildStudySession', () => {
  const pool = ['a', 'b', 'c', 'd'].map((id) => q(id))
  const card = (questionId: string, due: number): Card => ({
    questionId,
    ease: 2.5,
    intervalDays: 1,
    reps: 1,
    lapses: 0,
    due,
    last: 0,
  })

  it('期限切れを古い順に先頭へ、次に未出題。期限前は出さない', () => {
    const cards = new Map([
      ['a', card('a', 50)],
      ['b', card('b', 10)],
      ['c', card('c', 999)],
    ])
    expect(buildStudySession(pool, cards, 100, 10).map((x) => x.id)).toEqual(['b', 'a', 'd'])
  })

  it('size で打ち切る', () => {
    expect(buildStudySession(pool, new Map(), 0, 2)).toHaveLength(2)
  })
})

describe('isCorrect', () => {
  it('複数選択は過不足なく一致したときだけ正解', () => {
    const multi = q('m', ['A', 'C'])
    expect(isCorrect(multi, ['C', 'A'])).toBe(true)
    expect(isCorrect(multi, ['A'])).toBe(false)
    expect(isCorrect(multi, ['A', 'B', 'C'])).toBe(false)
  })
})
