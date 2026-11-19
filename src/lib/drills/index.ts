import { genAwsPrefixForHosts, genAwsUsable, genHostRange, genNetworkBroadcast, genPrefixForHosts } from './ipv4'
import { genCompress, genEui64 } from './ipv6'
import { genCronNext } from './cron'
import { genOctalToSymbolic, genSymbolicToOctal } from './perm'
import { genSymbolic, genUmask } from './perm2'
import type { Drill, Rng } from './types'

export interface DrillKind {
  type: string
  label: string
  group: string
  /** このドリルを表示する試験 */
  exams: string[]
  gen: (rng: Rng) => Drill
}

// 表示順は LinuC → CCNA → AWS SAA
export const DRILLS: DrillKind[] = [
  { type: 'perm-to-symbolic', label: '8 進 → 記号', group: 'パーミッション', exams: ['LinuC101', 'LinuC102'], gen: genOctalToSymbolic },
  { type: 'perm-to-octal', label: '記号 → 8 進', group: 'パーミッション', exams: ['LinuC101', 'LinuC102'], gen: genSymbolicToOctal },
  { type: 'chmod-symbolic', label: 'chmod 記号モード', group: 'パーミッション', exams: ['LinuC101', 'LinuC102'], gen: genSymbolic },
  { type: 'umask', label: 'umask', group: 'パーミッション', exams: ['LinuC101', 'LinuC102'], gen: genUmask },
  { type: 'cron-next', label: '次の実行日時', group: 'cron', exams: ['LinuC102'], gen: genCronNext },
  { type: 'ipv4-netbc', label: 'ネットワーク / ブロードキャスト', group: 'IPv4', exams: ['LinuC102', 'CCNA', 'SAA'], gen: genNetworkBroadcast },
  { type: 'ipv4-hosts', label: 'ホスト範囲', group: 'IPv4', exams: ['LinuC102', 'CCNA'], gen: genHostRange },
  { type: 'ipv4-prefix', label: '台数 → プレフィックス長', group: 'IPv4', exams: ['LinuC102', 'CCNA'], gen: genPrefixForHosts },
  { type: 'ipv6-compress', label: '省略表記', group: 'IPv6', exams: ['LinuC102', 'CCNA'], gen: genCompress },
  { type: 'ipv6-eui64', label: 'EUI-64', group: 'IPv6', exams: ['CCNA'], gen: genEui64 },
  { type: 'aws-usable', label: 'サブネットで使える IP 数', group: 'VPC', exams: ['SAA'], gen: genAwsUsable },
  { type: 'aws-prefix', label: '必要な IP 数 → プレフィックス長', group: 'VPC', exams: ['SAA'], gen: genAwsPrefixForHosts },
]

/** 試験に対応するドリル。exam が null ならすべて。 */
export function drillsFor(exam: string | null): DrillKind[] {
  return exam === null ? DRILLS : DRILLS.filter((d) => d.exams.includes(exam))
}

export { checkField } from './types'
export type { Drill } from './types'
