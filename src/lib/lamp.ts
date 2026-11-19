// 学習の状態を、ラックの状態ランプのような 4 色で表す。
import { accuracy, type SectionStat } from './stats'

/** off: 未着手 / weak: 要復習あり / learning: 学習中 / solid: 全問に着手し正答率 80% 以上 */
export type LampState = 'off' | 'weak' | 'learning' | 'solid'

export const LAMP_LABEL: Record<LampState, string> = {
  off: '未着手',
  weak: '要復習あり',
  learning: '学習中',
  solid: '定着',
}

export function lampOf(s: SectionStat): LampState {
  if (s.seen === 0) return 'off'
  if (s.weak > 0) return 'weak'
  const acc = accuracy(s)
  return s.seen === s.total && acc !== null && acc >= 0.8 ? 'solid' : 'learning'
}
