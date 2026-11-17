import type { Attempt, Question } from './types'

/** 正答率がこれ未満(かつ 2 回以上解答)なら、直近で正解していても弱点とみなす。 */
export const WEAK_ACCURACY = 0.7

export interface QuestionRecord {
  n: number
  ok: number
  lastCorrect: boolean
  lastTs: number
}

export function recordsByQuestion(attempts: readonly Attempt[]): Map<string, QuestionRecord> {
  const out = new Map<string, QuestionRecord>()
  for (const a of attempts) {
    const r = out.get(a.questionId) ?? { n: 0, ok: 0, lastCorrect: false, lastTs: -Infinity }
    r.n += 1
    if (a.correct) r.ok += 1
    if (a.ts >= r.lastTs) {
      r.lastTs = a.ts
      r.lastCorrect = a.correct
    }
    out.set(a.questionId, r)
  }
  return out
}

/** 直近の解答が不正解か、2 回以上解いて正答率が WEAK_ACCURACY 未満。 */
export function isWeak(r: QuestionRecord | undefined): boolean {
  if (!r) return false
  return !r.lastCorrect || (r.n >= 2 && r.ok / r.n < WEAK_ACCURACY)
}

/** 弱点の問題を、直近で間違えたもの → 正答率の低いもの → 最近解いたものの順に並べる。 */
export function weakQuestions(pool: readonly Question[], attempts: readonly Attempt[]): Question[] {
  const recs = recordsByQuestion(attempts)
  return pool
    .filter((q) => isWeak(recs.get(q.id)))
    .sort((a, b) => {
      const ra = recs.get(a.id)!
      const rb = recs.get(b.id)!
      return (
        Number(ra.lastCorrect) - Number(rb.lastCorrect) ||
        ra.ok / ra.n - rb.ok / rb.n ||
        rb.lastTs - ra.lastTs
      )
    })
}
