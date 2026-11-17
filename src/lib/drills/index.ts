import { genHostRange, genNetworkBroadcast, genPrefixForHosts } from './ipv4'
import { genCompress, genEui64 } from './ipv6'
import { genCronNext } from './cron'
import { genOctalToSymbolic, genSymbolicToOctal } from './perm'
import { genSymbolic, genUmask } from './perm2'
import type { Drill, Rng } from './types'

export interface DrillKind {
  type: string
  label: string
  group: string
  gen: (rng: Rng) => Drill
}

// 表示順は LinuC → CCNA
export const DRILLS: DrillKind[] = [
  { type: 'perm-to-symbolic', label: '8 進 → 記号', group: 'パーミッション', gen: genOctalToSymbolic },
  { type: 'perm-to-octal', label: '記号 → 8 進', group: 'パーミッション', gen: genSymbolicToOctal },
  { type: 'chmod-symbolic', label: 'chmod 記号モード', group: 'パーミッション', gen: genSymbolic },
  { type: 'umask', label: 'umask', group: 'パーミッション', gen: genUmask },
  { type: 'cron-next', label: '次の実行日時', group: 'cron', gen: genCronNext },
  { type: 'ipv4-netbc', label: 'ネットワーク / ブロードキャスト', group: 'IPv4', gen: genNetworkBroadcast },
  { type: 'ipv4-hosts', label: 'ホスト範囲', group: 'IPv4', gen: genHostRange },
  { type: 'ipv4-prefix', label: '台数 → プレフィックス長', group: 'IPv4', gen: genPrefixForHosts },
  { type: 'ipv6-compress', label: '省略表記', group: 'IPv6', gen: genCompress },
  { type: 'ipv6-eui64', label: 'EUI-64', group: 'IPv6', gen: genEui64 },
]

export { checkField } from './types'
export type { Drill } from './types'
