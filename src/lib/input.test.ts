import { describe, expect, it } from 'vitest'
import questions from '../data/questions.json'
import { canInput, inputMatches, normalizeInput, toInput } from './input'
import { isCorrect } from './srs'
import type { Question } from './types'

const all = questions as Question[]

describe('入力の判定', () => {
  it('表記ゆれを吸収する', () => {
    expect(normalizeInput('  `ssh-keygen`  ')).toBe('ssh-keygen')
    expect(normalizeInput('/etc/skel/')).toBe('/etc/skel')
    expect(normalizeInput('locale   -a')).toBe('locale -a')
    expect(normalizeInput('/')).toBe('/')
  })

  it('複数の正解のどれかに一致すればよい', () => {
    expect(inputMatches(['atq', 'at -l'], 'at -l')).toBe(true)
    expect(inputMatches(['atq', 'at -l'], 'atrm')).toBe(false)
    expect(inputMatches(['atq'], '')).toBe(false)
  })

  it('コマンド名は大文字小文字を区別し、大文字だけの答えは区別しない', () => {
    expect(inputMatches(['who'], 'WHO')).toBe(false)
    expect(inputMatches(['KILL'], 'kill')).toBe(true)
    expect(inputMatches(['PTR'], 'ptr')).toBe(true)
    expect(inputMatches(['/26'], '26')).toBe(true)
    expect(inputMatches(['/26'], '/26')).toBe(true)
    expect(inputMatches(['/26'], '/27')).toBe(false)
  })
})

describe('選択問題の入力化', () => {
  it('1語の正解だけを入力化し、入力化した問題は正解の語で正解になる', () => {
    const inputable = all.filter(canInput)
    expect(inputable.length).toBeGreaterThan(20)
    for (const q of inputable) {
      const i = toInput(q)
      expect(i.kind, q.id).toBe('input')
      expect(i.choices).toEqual([])
      expect(isCorrect(i, [i.answer[0]]), q.id).toBe(true)
      expect(isCorrect(i, ['__wrong__'])).toBe(false)
    }
  })

  it('入力の別解(長い形のオプションなど)でも正解になる', () => {
    const q = all.find((x) => x.code === 'LinuC102-1.08-004')!
    const i = toInput(q)
    expect(isCorrect(i, ['-m'])).toBe(true)
    expect(isCorrect(i, ['--create-home'])).toBe(true)
    expect(isCorrect(i, ['-d'])).toBe(false)
  })

  it('入力の別解は、入力化できる問題にだけ書く', () => {
    for (const q of all.filter((x) => x.inputAlt)) expect(canInput(q), q.id).toBe(true)
  })

  it('複数選択や文章の正解は入力化しない', () => {
    for (const q of all.filter((x) => x.kind !== 'input' && (x.answer.length > 1 || /\s/.test(x.choices.find((c) => c.key === x.answer[0])?.text.replace(/`/g, '') ?? '')))) {
      expect(canInput(q), q.id).toBe(false)
    }
  })
})
