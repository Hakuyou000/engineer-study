import { describe, expect, it } from 'vitest'
import { lampOf } from './lamp'

const s = (o: Partial<{ total: number; seen: number; attempts: number; correct: number; weak: number }>) => ({
  key: 'k', label: 'l', total: 10, seen: 0, attempts: 0, correct: 0, due: 0, weak: 0, ...o,
})

describe('学習の状態のランプ', () => {
  it('未着手、要復習あり、学習中、定着を見分ける', () => {
    expect(lampOf(s({}))).toBe('off')
    expect(lampOf(s({ seen: 3, attempts: 3, correct: 2, weak: 1 }))).toBe('weak')
    expect(lampOf(s({ seen: 3, attempts: 3, correct: 3 }))).toBe('learning')
    expect(lampOf(s({ seen: 10, attempts: 10, correct: 7 }))).toBe('learning')
    expect(lampOf(s({ seen: 10, attempts: 10, correct: 9 }))).toBe('solid')
  })
})
