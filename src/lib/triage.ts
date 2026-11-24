import type { Attempt, Flag, Question } from './types'

/** 問題の欠陥の候補として挙げる基準。何度解いても正答率が低い問題は、問題そのものが誤っていることがある */
export const SUSPECT_MIN_ATTEMPTS = 3
export const SUSPECT_MAX_ACCURACY = 0.34

export interface TriageItem {
  code: string
  exam: string
  section: string
  /** 指摘があれば、その種類と内容 */
  flag?: { kind: string; note: string; ts: number }
  attempts: number
  correct: number
  /** 正答率が低い問題として挙げたか */
  suspect: boolean
}

/**
 * バックアップの指摘と解答の履歴から、直す候補の一覧を作る。
 * 指摘のある問題が先、次に正答率の低い問題。問題がもうないもの(ID の変わったもの)は unknown に入れる。
 */
export function triage(questions: readonly Question[], attempts: readonly Attempt[], flags: readonly Flag[]) {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const stats = new Map<string, { n: number; ok: number }>()
  for (const a of attempts) {
    const s = stats.get(a.questionId) ?? { n: 0, ok: 0 }
    s.n++
    if (a.correct) s.ok++
    stats.set(a.questionId, s)
  }
  const flagById = new Map(flags.map((f) => [f.questionId, f]))
  const items: TriageItem[] = []
  const unknown: Flag[] = []
  for (const f of flags) if (!byId.has(f.questionId)) unknown.push(f)

  for (const q of questions) {
    const s = stats.get(q.id) ?? { n: 0, ok: 0 }
    const f = flagById.get(q.id)
    const suspect = s.n >= SUSPECT_MIN_ATTEMPTS && s.ok / s.n <= SUSPECT_MAX_ACCURACY
    if (!f && !suspect) continue
    items.push({
      code: q.code,
      exam: q.exam,
      section: q.section,
      ...(f ? { flag: { kind: f.kind, note: f.note, ts: f.ts } } : {}),
      attempts: s.n,
      correct: s.ok,
      suspect,
    })
  }
  items.sort((a, b) => Number(!!b.flag) - Number(!!a.flag) || a.correct / (a.attempts || 1) - b.correct / (b.attempts || 1))
  return { items, unknown }
}
