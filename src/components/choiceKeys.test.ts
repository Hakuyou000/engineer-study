import { describe, expect, it } from 'vitest'
import type { Question } from '../lib/types'
import { keyToChoice, toggleChoice } from './useChoiceKeys'

const q = (answer: string[], kind?: 'input') =>
  ({
    id: 'x',
    kind,
    choices: kind ? [] : ['A', 'B', 'C', 'D'].map((key) => ({ key, text: key })),
    answer,
  }) as unknown as Question

describe('keyToChoice', () => {
  it('数字は上から何番目か、文字は記号そのもの', () => {
    expect(keyToChoice(q(['A']), '2')).toBe('B')
    expect(keyToChoice(q(['A']), 'c')).toBe('C')
    expect(keyToChoice(q(['A']), 'D')).toBe('D')
  })
  it('ない選択肢と入力問題は null', () => {
    expect(keyToChoice(q(['A']), '5')).toBeNull()
    expect(keyToChoice(q(['A']), 'e')).toBeNull()
    expect(keyToChoice(q(['A']), 'x')).toBeNull()
    expect(keyToChoice(q(['ls'], 'input'), '1')).toBeNull()
  })
})

describe('toggleChoice', () => {
  it('単一選択は置き換える', () => {
    expect(toggleChoice(q(['A']), ['B'], 'C')).toEqual(['C'])
  })
  it('複数選択は付け外しして並べる', () => {
    expect(toggleChoice(q(['A', 'C']), ['C'], 'A')).toEqual(['A', 'C'])
    expect(toggleChoice(q(['A', 'C']), ['A', 'C'], 'A')).toEqual(['C'])
  })
})
