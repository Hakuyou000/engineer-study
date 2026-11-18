import type { Attempt, Card, Question } from './types'
import { isWeak, recordsByQuestion } from './weak'

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
  /** 直近で間違えた、または正答率の低い問題数 */
  weak: number
}

export interface DomainStat extends SectionStat {
  exam: string
  /** 試験名を除いたラベル。例: 1.06 シェルおよびスクリプト */
  shortLabel: string
  sections: SectionStat[]
}

export interface ExamStat extends SectionStat {
  domains: DomainStat[]
}

/** 表示用の試験名。LinuC102 → LinuC 102 */
/** 表示名が試験コードから作れない試験 */
const LABELS: Record<string, string> = { SAA: 'AWS SAA' }

export const examLabel = (exam: string) => LABELS[exam] ?? exam.replace(/^([A-Za-z]+)(\d+)$/, '$1 $2')

/** 分野の集計を試験ごとにまとめる。順番は元の並び(LinuC → CCNA)を保つ。 */
export function groupByExam(domains: readonly DomainStat[]): ExamStat[] {
  const out: ExamStat[] = []
  for (const d of domains) {
    let g = out.find((x) => x.key === d.exam)
    if (!g) {
      g = { ...empty(d.exam, examLabel(d.exam)), domains: [] }
      out.push(g)
    }
    g.domains.push(d)
    g.total += d.total
    g.seen += d.seen
    g.attempts += d.attempts
    g.correct += d.correct
    g.due += d.due
    g.weak += d.weak
  }
  return out
}

const empty = (key: string, label: string): SectionStat => ({
  key,
  label,
  total: 0,
  seen: 0,
  attempts: 0,
  correct: 0,
  due: 0,
  weak: 0,
})

export function computeStats(
  questions: readonly Question[],
  attempts: readonly Attempt[],
  cards: ReadonlyMap<string, Card>,
  now: number,
): DomainStat[] {
  const byQ = recordsByQuestion(attempts)

  const domains = new Map<string, DomainStat>()
  for (const q of questions) {
    const dk = `${q.exam} ${q.domain}`
    let d = domains.get(dk)
    if (!d) {
      d = {
        ...empty(dk, `${q.exam} ${q.domain} ${q.domainTitle}`),
        exam: q.exam,
        shortLabel: `${q.domain} ${q.domainTitle}`,
        sections: [],
      }
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
      if (isWeak(a)) t.weak += 1
    }
  }
  return [...domains.values()]
}

export function accuracy(s: { attempts: number; correct: number }): number | null {
  return s.attempts === 0 ? null : s.correct / s.attempts
}
