import { describe, expect, it } from 'vitest'
import data from '../data/questions.json'
import { STAGES } from './roadmap'

describe('ロードマップ', () => {
  it('チェック項目の ID が重複しない', () => {
    const ids = STAGES.flatMap((s) => s.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

})

describe('資格の表紙', () => {
  it('ロードマップに載せた資格は、すべて表紙がある', async () => {
    const { CERTS } = await import('./certs')
    const { OPTIONAL_CERTS } = await import('./roadmap')
    const ids = new Set(CERTS.map((c) => c.id))
    expect(ids.size).toBe(CERTS.length)
    for (const c of [...STAGES.flatMap((s) => s.certs), ...OPTIONAL_CERTS]) expect(ids.has(c.cert)).toBe(true)
  })

  it('アプリで学べる試験として指定した試験は、問題がある', async () => {
    const { CERTS } = await import('./certs')
    const exams = new Set((data as { exam: string }[]).map((q) => q.exam))
    for (const c of CERTS) if (c.exam) expect(exams.has(c.exam)).toBe(true)
  })

  it('出題の割合を書いた資格は、合計が 100%', async () => {
    const { CERTS } = await import('./certs')
    for (const c of CERTS) {
      const ws = (c.domains ?? []).map((d) => d.weight).filter((w): w is number => w !== undefined)
      if (ws.length) expect(ws.reduce((a, b) => a + b, 0)).toBe(100)
    }
  })
})
