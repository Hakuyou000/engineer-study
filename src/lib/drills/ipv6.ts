import type { Drill, Rng } from './types'
import { int } from './types'

/** 省略表記を 8 グループの 4 桁表記に展開する。不正な入力は null。 */
export function expand(addr: string): string | null {
  const a = addr.trim().toLowerCase()
  if (!/^[0-9a-f:]+$/.test(a)) return null
  const parts = a.split('::')
  if (parts.length > 2) return null
  const head = parts[0] ? parts[0].split(':') : []
  const tail = parts.length === 2 && parts[1] ? parts[1].split(':') : []
  let groups: string[]
  if (parts.length === 2) {
    const fill = 8 - head.length - tail.length
    if (fill < 1) return null
    groups = [...head, ...Array<string>(fill).fill('0'), ...tail]
  } else {
    groups = head
  }
  if (groups.length !== 8 || groups.some((g) => g.length < 1 || g.length > 4)) return null
  return groups.map((g) => g.padStart(4, '0')).join(':')
}

/** RFC 5952 の正規形。最長の 0 の連続(2 グループ以上)を :: にし、同じ長さなら左側。 */
export function compress(addr: string): string | null {
  const full = expand(addr)
  if (!full) return null
  const g = full.split(':').map((x) => x.replace(/^0+(?=.)/, ''))
  let best = -1
  let bestLen = 1
  for (let i = 0; i < 8; ) {
    if (g[i] !== '0') {
      i++
      continue
    }
    let j = i
    while (j < 8 && g[j] === '0') j++
    if (j - i > bestLen) {
      best = i
      bestLen = j - i
    }
    i = j
  }
  if (best < 0) return g.join(':')
  return `${g.slice(0, best).join(':')}::${g.slice(best + bestLen).join(':')}`
}

/** MAC アドレスから EUI-64 のインターフェース ID(4 グループ)を作る。 */
export function eui64InterfaceId(mac: string): string {
  const hex = mac.toLowerCase().replace(/[^0-9a-f]/g, '')
  if (hex.length !== 12) throw new Error(`MAC アドレスが不正: ${mac}`)
  const first = (parseInt(hex.slice(0, 2), 16) ^ 0x02).toString(16).padStart(2, '0')
  const full = first + hex.slice(2, 6) + 'fffe' + hex.slice(6)
  return full.match(/.{4}/g)!.join(':')
}

const hex = (rng: Rng, digits: number) =>
  int(rng, 0, 16 ** digits - 1)
    .toString(16)
    .padStart(digits, '0')

const normCanonical = (s: string) => compress(s) ?? s.trim().toLowerCase()

export function genCompress(rng: Rng): Drill {
  const groups = ['2001', '0db8', ...Array.from({ length: 6 }, () => hex(rng, 4))]
  // 0 のグループと先頭 0 を意図的に混ぜる
  for (let i = 2; i < 8; i++) {
    const r = rng()
    if (r < 0.45) groups[i] = '0000'
    else if (r < 0.7) groups[i] = hex(rng, int(rng, 1, 3)).padStart(4, '0')
  }
  const full = groups.join(':')
  const answer = compress(full)!
  return {
    type: 'ipv6-compress',
    prompt: `\`${full}\` の最も短い正しい表記を答えよ。`,
    // 最短表記そのものを問うので、正規化は大文字小文字と空白だけ
    fields: [{ label: '省略表記', answer, normalize: (s) => s.trim().toLowerCase() }],
    explain:
      '各グループの先頭の 0 を省略する。`::` は 1 か所だけ。0 の連続が最も長い箇所に使い、同じ長さなら左側。',
  }
}

export function genEui64(rng: Rng): Drill {
  const mac = Array.from({ length: 3 }, () => hex(rng, 4)).join('.')
  const prefix = `2001:db8:${hex(rng, 2).replace(/^0+(?=.)/, '')}:${int(rng, 1, 9)}`
  const iid = eui64InterfaceId(mac)
  const answer = compress(`${prefix}:${iid}`)!
  return {
    type: 'ipv6-eui64',
    prompt: `MAC アドレス \`${mac}\` のインターフェースに \`ipv6 address ${prefix}::/64 eui-64\` を設定した。生成されるアドレスを答えよ。`,
    fields: [{ label: 'IPv6 アドレス', answer, normalize: normCanonical }],
    explain: `MAC の中央に fffe を挿入し、先頭バイトの 7 ビット目(U/L ビット)を反転する。インターフェース ID は ${iid}。`,
  }
}
