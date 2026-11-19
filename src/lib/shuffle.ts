import { shuffle } from './srs'
import type { Question } from './types'

const KEYS = 'ABCDEFGH'

/**
 * 選択肢の並びを入れ替え、表示上の記号を A から振り直した問題を返す。
 * keyMap は表示上の記号 → 元の記号。履歴には元の記号で保存する。
 */
export function shuffleChoices(q: Question, rng: () => number = Math.random): Question {
  if (q.kind === 'input') return q
  const order = shuffle(q.choices, rng)
  const toNew = new Map(order.map((c, i) => [c.key, KEYS[i]]))
  const keyMap: Record<string, string> = {}
  for (const [orig, shown] of toNew) keyMap[shown] = q.keyMap?.[orig] ?? orig
  return {
    ...q,
    explanation: relabel(q.explanation, toNew),
    choices: order.map((c, i) => ({ key: KEYS[i], text: c.text })),
    answer: q.answer.map((k) => toNew.get(k)!).sort(),
    keyMap,
  }
}

const BULLET = /^- ([A-H])\. /

/**
 * 解説の「- A. …」で始まる行(選択肢ごとの説明)の記号を、入れ替えた後の記号に付け替える。
 * 続いている行のまとまりは、新しい記号の順に並べ直す。
 */
export function relabel(text: string, toNew: ReadonlyMap<string, string>): string {
  const out: string[] = []
  let run: string[] = []
  const flush = () => {
    run.sort((a, b) => a[2].localeCompare(b[2]))
    out.push(...run)
    run = []
  }
  for (const line of text.split('\n')) {
    const m = line.match(BULLET)
    if (m && toNew.has(m[1])) run.push(`- ${toNew.get(m[1])}. ${line.slice(5)}`)
    else {
      flush()
      out.push(line)
    }
  }
  flush()
  return out.join('\n')
}

/** 表示上の記号を、元の記号に戻す。 */
export function originalKeys(q: Question, chosen: readonly string[]): string[] {
  if (q.kind === 'input') return [...chosen]
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
