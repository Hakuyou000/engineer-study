import { inputMatches } from './input'
import type { Card, Question } from './types'

export type Grade = 'again' | 'hard' | 'good'

const DAY = 86_400_000
const MIN_EASE = 1.3

/** SM-2 を簡略化した間隔反復。誤答は 10 分後、正答は 1 日 → 3 日 → 間隔×ease。 */
export function review(prev: Card | undefined, questionId: string, grade: Grade, now: number): Card {
  const c: Card = prev
    ? { ...prev }
    : { questionId, ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: now, last: now }
  c.last = now

  if (grade === 'again') {
    c.reps = 0
    c.lapses += 1
    c.intervalDays = 0
    c.ease = Math.max(MIN_EASE, c.ease - 0.2)
    c.due = now + 10 * 60_000
    return c
  }

  if (grade === 'hard') {
    c.intervalDays = c.reps === 0 ? 1 : Math.max(1, Math.round(c.intervalDays * 1.2))
    c.ease = Math.max(MIN_EASE, c.ease - 0.15)
  } else {
    c.intervalDays = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.max(1, Math.round(c.intervalDays * c.ease))
  }
  c.reps += 1
  c.due = now + c.intervalDays * DAY
  return c
}

export function shuffle<T>(xs: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 学習セッションの出題順。期限切れ(古い順)→ 未出題(ランダム)。期限前のカードは出さない。 */
export function buildStudySession(
  pool: readonly Question[],
  cards: ReadonlyMap<string, Card>,
  now: number,
  size: number,
  rng: () => number = Math.random,
): Question[] {
  const due = pool
    .filter((q) => {
      const c = cards.get(q.id)
      return c !== undefined && c.due <= now
    })
    .sort((a, b) => cards.get(a.id)!.due - cards.get(b.id)!.due)
  const unseen = shuffle(
    pool.filter((q) => !cards.has(q.id)),
    rng,
  )
  return [...due, ...unseen].slice(0, size)
}

export function isCorrect(q: Question, chosen: readonly string[]): boolean {
  if (q.kind === 'input') return inputMatches(q.answer, chosen[0] ?? '')
  return chosen.length === q.answer.length && q.answer.every((k) => chosen.includes(k))
}
