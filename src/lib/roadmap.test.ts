import { describe, expect, it } from 'vitest'
import data from '../data/questions.json'
import { STAGES } from './roadmap'

describe('ロードマップ', () => {
  it('チェック項目の ID が重複しない', () => {
    const ids = STAGES.flatMap((s) => s.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('アプリで学べる試験として指定した試験は、問題がある', () => {
    const exams = new Set((data as { exam: string }[]).map((q) => q.exam))
    for (const c of STAGES.flatMap((s) => s.certs)) if (c.exam) expect(exams.has(c.exam)).toBe(true)
  })
})
