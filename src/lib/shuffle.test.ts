import { describe, expect, it } from 'vitest'
import questions from '../data/questions.json'
import { mulberry32 } from './drills/types'
import { originalKeys, shuffleChoices } from './shuffle'
import { isCorrect } from './srs'
import type { Question } from './types'

const all = questions as Question[]

describe('shuffleChoices', () => {
  it('正解の選択肢の本文は入れ替え後も正解のまま', () => {
    const rng = mulberry32(3)
    for (const q of all.filter((x) => x.kind !== 'input')) {
      const s = shuffleChoices(q, rng)
      expect(s.choices.map((c) => c.key)).toEqual(q.choices.map((_, i) => 'ABCDEFGH'[i]))
      const text = (x: Question, keys: string[]) => keys.map((k) => x.choices.find((c) => c.key === k)!.text).sort()
      expect(text(s, s.answer), q.id).toEqual(text(q, q.answer))
      expect(isCorrect(s, s.answer)).toBe(true)
      expect(originalKeys(s, s.answer)).toEqual([...q.answer].sort())
    }
  })

  it('並びが変わる', () => {
    const rng = mulberry32(1)
    const choice = all.filter((x) => x.kind !== 'input')
    const moved = choice.filter((q) => shuffleChoices(q, rng).answer.join() !== q.answer.join()).length
    expect(moved).toBeGreaterThan(choice.length / 2)
  })

  it('2回入れ替えても元の記号に戻せる', () => {
    const q = all[0]
    const twice = shuffleChoices(shuffleChoices(q, mulberry32(5)), mulberry32(6))
    expect(originalKeys(twice, twice.answer)).toEqual(q.answer)
  })
})

describe('解説', () => {
  it('選択肢の記号を参照しない(並べ替えると記号が変わるため)', () => {
    const ref = /(^|。|<br>)\s*[A-D](、[A-D])*\s?(は|が|も)/
    expect(all.filter((q) => ref.test(q.explanation)).map((q) => q.id)).toEqual([])
  })
})
