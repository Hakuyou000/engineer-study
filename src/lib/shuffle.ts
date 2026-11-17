import { shuffle } from './srs'
import type { Question } from './types'

const KEYS = 'ABCDEFGH'

/**
 * 選択肢の並びを入れ替え、表示上の記号を A から振り直した問題を返す。
 * keyMap は表示上の記号 → 元の記号。履歴には元の記号で保存する。
 */
export function shuffleChoices(q: Question, rng: () => number = Math.random): Question {
  const order = shuffle(q.choices, rng)
  const toNew = new Map(order.map((c, i) => [c.key, KEYS[i]]))
  const keyMap: Record<string, string> = {}
  for (const [orig, shown] of toNew) keyMap[shown] = q.keyMap?.[orig] ?? orig
  return {
    ...q,
    choices: order.map((c, i) => ({ key: KEYS[i], text: c.text })),
    answer: q.answer.map((k) => toNew.get(k)!).sort(),
    keyMap,
  }
}

/** 表示上の記号を、元の記号に戻す。 */
export function originalKeys(q: Question, chosen: readonly string[]): string[] {
  return chosen.map((k) => q.keyMap?.[k] ?? k).sort()
}

const PREF = 'sre-drill:shuffle'

export function loadShufflePref(): boolean {
  try {
    return localStorage.getItem(PREF) !== '0'
  } catch {
    return true
  }
}

export function saveShufflePref(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? '1' : '0')
  } catch {
    // 保存できなくても動作に支障はない
  }
}
