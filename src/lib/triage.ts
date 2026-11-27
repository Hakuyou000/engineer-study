import type { Attempt, Question } from './types'

/** 問題の欠陥の候補として挙げる基準。何度解いても正答率が低い問題は、問題そのものが誤っていることがある */
export const SUSPECT_MIN_ATTEMPTS = 3
export const SUSPECT_MAX_ACCURACY = 0.34

export interface TriageItem {
  code: string
  exam: string
  section: string
  attempts: number
  correct: number
}

/** 解答の履歴から、何度解いても正答率の低い問題を、正答率の低い順に挙げる。 */
export function triage(questions: readonly Question[], attempts: readonly Attempt[]) {
  const stats = new Map<string, { n: number; ok: number }>()
  for (const a of attempts) {
    const s = stats.get(a.questionId) ?? { n: 0, ok: 0 }
    s.n++
    if (a.correct) s.ok++
    stats.set(a.questionId, s)
  }
  const items: TriageItem[] = []
  for (const q of questions) {
    const s = stats.get(q.id)
    if (!s || s.n < SUSPECT_MIN_ATTEMPTS || s.ok / s.n > SUSPECT_MAX_ACCURACY) continue
    items.push({ code: q.code, exam: q.exam, section: q.section, attempts: s.n, correct: s.ok })
  }
  items.sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
  return items
}
