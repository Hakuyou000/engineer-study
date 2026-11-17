export type Rng = () => number

export interface DrillField {
  label: string
  answer: string
  /** 入力と正解の両方に適用してから比較する。既定は trim */
  normalize?: (s: string) => string
}

export interface Drill {
  type: string
  /** Markdown */
  prompt: string
  fields: DrillField[]
  explain: string
}

/** lo 以上 hi 以下の整数 */
export const int = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1))

/** 再現可能な乱数(テスト用) */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function checkField(f: DrillField, input: string): boolean {
  const n = f.normalize ?? ((s: string) => s.trim())
  return n(input) === n(f.answer)
}
