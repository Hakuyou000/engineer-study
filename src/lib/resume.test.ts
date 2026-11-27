import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadResume, saveResume, type Resume } from './resume'

const r = (n: number, done: number): Resume => ({
  items: Array.from({ length: n }, (_, i) => ({ id: `q${i}`, input: false })),
  results: Array.from({ length: done }, () => 'ok' as const),
  group: null,
  ts: 1,
})

describe('resume', () => {
  beforeEach(() => {
    const m = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    })
  })
  it('途中なら読み戻せる', () => {
    saveResume(r(5, 2))
    expect(loadResume()?.results).toHaveLength(2)
  })
  it('最後まで解いたら消える', () => {
    saveResume(r(5, 2))
    saveResume(r(5, 5))
    expect(loadResume()).toBeNull()
  })
  it('壊れた記録は null', () => {
    localStorage.setItem('sre-drill:resume', '{')
    expect(loadResume()).toBeNull()
  })
})
