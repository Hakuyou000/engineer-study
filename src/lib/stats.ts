import type { Attempt, Card, Question } from './types'

export interface SectionStat {
  key: string
  label: string
  total: number
  /** 1 回以上解いた問題数 */
  seen: number
  attempts: number
  correct: number
  /** 復習期限が来ている問題数 */
  due: number
}

export interface DomainStat extends SectionStat {
  sections: SectionStat[]
}

const empty = (key: string, label: string): SectionStat => ({
  key,
  label,
  total: 0,
  seen: 0,
  attempts: 0,
  correct: 0,
  due: 0,
})

export function computeStats(
  questions: readonly Question[],
  attempts: readonly Attempt[],
  cards: ReadonlyMap<string, Card>,
  now: number,
): DomainStat[] {
  const byQ = new Map<string, { n: number; ok: number }>()
  for (const a of attempts) {
    const s = byQ.get(a.questionId) ?? { n: 0, ok: 0 }
    s.n += 1
    if (a.correct) s.ok += 1
    byQ.set(a.questionId, s)
  }

  const domains = new Map<string, DomainStat>()
  for (const q of questions) {
    const dk = `${q.exam} ${q.domain}`
    let d = domains.get(dk)
    if (!d) {
      d = { ...empty(dk, `${q.exam} ${q.domain} ${q.domainTitle}`), sections: [] }
      domains.set(dk, d)
    }
    let s = d.sections.find((x) => x.key === q.section)
    if (!s) {
      s = empty(q.section, q.section)
      d.sections.push(s)
    }
    const a = byQ.get(q.id)
    const c = cards.get(q.id)
    for (const t of [d, s]) {
      t.total += 1
      if (a) {
        t.seen += 1
        t.attempts += a.n
        t.correct += a.ok
      }
      if (c && c.due <= now) t.due += 1
    }
  }
  return [...domains.values()]
}

export function accuracy(s: { attempts: number; correct: number }): number | null {
  return s.attempts === 0 ? null : s.correct / s.attempts
}
