import { genHostRange, genNetworkBroadcast, genPrefixForHosts } from './ipv4'
import { genCompress, genEui64 } from './ipv6'
import { genOctalToSymbolic, genSymbolicToOctal } from './perm'
import type { Drill, Rng } from './types'

export interface DrillKind {
  type: string
  label: string
  group: string
  gen: (rng: Rng) => Drill
}

export const DRILLS: DrillKind[] = [
  { type: 'ipv4-netbc', label: 'ネットワーク / ブロードキャスト', group: 'IPv4', gen: genNetworkBroadcast },
  { type: 'ipv4-hosts', label: 'ホスト範囲', group: 'IPv4', gen: genHostRange },
  { type: 'ipv4-prefix', label: '台数 → プレフィックス長', group: 'IPv4', gen: genPrefixForHosts },
  { type: 'ipv6-compress', label: '省略表記', group: 'IPv6', gen: genCompress },
  { type: 'ipv6-eui64', label: 'EUI-64', group: 'IPv6', gen: genEui64 },
  { type: 'perm-to-symbolic', label: '8 進 → 記号', group: 'パーミッション', gen: genOctalToSymbolic },
  { type: 'perm-to-octal', label: '記号 → 8 進', group: 'パーミッション', gen: genSymbolicToOctal },
]

export { checkField } from './types'
export type { Drill } from './types'
