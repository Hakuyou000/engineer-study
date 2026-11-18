import type { Drill, Rng } from './types'
import { int } from './types'

export const ipToInt = (ip: string): number =>
  ip.split('.').reduce((acc, o) => acc * 256 + Number(o), 0)

export const intToIp = (n: number): string =>
  [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.')

export const blockSize = (prefix: number): number => 2 ** (32 - prefix)

export function subnetOf(ip: string, prefix: number) {
  const size = blockSize(prefix)
  const network = Math.floor(ipToInt(ip) / size) * size
  const broadcast = network + size - 1
  return {
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(network + 1),
    lastHost: intToIp(broadcast - 1),
    hosts: size - 2,
  }
}

/** n 台を収容できる最小サブネットのプレフィックス長 */
export function prefixForHosts(n: number): number {
  let p = 30
  while (blockSize(p) - 2 < n) p--
  return p
}

function randomHost(rng: Rng): { ip: string; prefix: number } {
  const prefix = int(rng, 17, 30)
  const first = [10, 172, 192][int(rng, 0, 2)]
  const base =
    first === 10
      ? `10.${int(rng, 0, 255)}.${int(rng, 0, 255)}.${int(rng, 0, 255)}`
      : first === 172
        ? `172.${int(rng, 16, 31)}.${int(rng, 0, 255)}.${int(rng, 0, 255)}`
        : `192.168.${int(rng, 0, 255)}.${int(rng, 0, 255)}`
  // ネットワークアドレスとブロードキャストアドレスを避け、ホストアドレスにする
  const size = blockSize(prefix)
  const net = Math.floor(ipToInt(base) / size) * size
  return { ip: intToIp(net + int(rng, 1, size - 2)), prefix }
}

const normIp = (s: string) => s.trim()
const normPrefix = (s: string) => s.trim().replace(/^\//, '')

export function genNetworkBroadcast(rng: Rng): Drill {
  const { ip, prefix } = randomHost(rng)
  const s = subnetOf(ip, prefix)
  return {
    type: 'ipv4-netbc',
    prompt: `ホスト \`${ip}/${prefix}\` が属するサブネットのネットワークアドレスとブロードキャストアドレスを答えよ。`,
    fields: [
      { label: 'ネットワークアドレス', answer: s.network, normalize: normIp },
      { label: 'ブロードキャストアドレス', answer: s.broadcast, normalize: normIp },
    ],
    explain: `/${prefix} のブロックサイズは ${blockSize(prefix)}。範囲は ${s.network} 〜 ${s.broadcast}。`,
  }
}

export function genHostRange(rng: Rng): Drill {
  const { ip, prefix } = randomHost(rng)
  const s = subnetOf(ip, prefix)
  return {
    type: 'ipv4-hosts',
    prompt: `ホスト \`${ip}/${prefix}\` が属するサブネットで、ホストに割り当てられる最初と最後のアドレスを答えよ。`,
    fields: [
      { label: '最初のホスト', answer: s.firstHost, normalize: normIp },
      { label: '最後のホスト', answer: s.lastHost, normalize: normIp },
    ],
    explain: `ネットワーク ${s.network}、ブロードキャスト ${s.broadcast}。その間の ${s.hosts} 個がホスト。`,
  }
}

export function genPrefixForHosts(rng: Rng): Drill {
  const n = int(rng, 2, 4000)
  const p = prefixForHosts(n)
  return {
    type: 'ipv4-prefix',
    prompt: `${n} 台のホストを収容できる最小のサブネットのプレフィックス長を答えよ。`,
    fields: [{ label: 'プレフィックス長', answer: String(p), normalize: normPrefix }],
    explain: `/${p} は ${blockSize(p) - 2} 台。/${p + 1} は ${blockSize(p + 1) - 2} 台で不足。`,
  }
}

/** AWS の VPC はサブネットごとに 5 個(先頭 4 個と最後の 1 個)を予約する */
export const AWS_RESERVED = 5

/** VPC のサブネットで使える IP の数。AWS のサブネットは /16〜/28 */
export const awsUsable = (prefix: number): number => blockSize(prefix) - AWS_RESERVED

/** VPC で n 個の IP を使える最小のサブネットのプレフィックス長。/28 より小さくはできない */
export function awsPrefixForHosts(n: number): number {
  let p = 28
  while (awsUsable(p) < n) p--
  return p
}

export function genAwsUsable(rng: Rng): Drill {
  const prefix = int(rng, 16, 28)
  const cidr = `10.${int(rng, 0, 255)}.0.0/${prefix}`
  const total = blockSize(prefix)
  return {
    type: 'aws-usable',
    prompt: `VPC にサブネット \`${cidr}\` を作る。EC2 などに割り当てられる IP アドレスの数を答えよ。`,
    fields: [{ label: '使える IP の数', answer: String(awsUsable(prefix)), normalize: (s) => s.trim().replace(/[,個]/g, '') }],
    explain: `/${prefix} は ${total} 個。AWS が 5 個(ネットワーク、VPC ルーター、DNS、将来用、ブロードキャスト)を予約するので ${total} − 5 = ${awsUsable(prefix)} 個。`,
  }
}

export function genAwsPrefixForHosts(rng: Rng): Drill {
  const n = int(rng, 2, 4000)
  const p = awsPrefixForHosts(n)
  const tooSmall = p < 28 ? ` /${p + 1} は ${awsUsable(p + 1)} 個で不足。` : ' /28 が VPC のサブネットの最小。'
  return {
    type: 'aws-prefix',
    prompt: `VPC のサブネットで ${n} 個の IP アドレスが必要である。最小のサブネットのプレフィックス長を答えよ。`,
    fields: [{ label: 'プレフィックス長', answer: String(p), normalize: normPrefix }],
    explain: `/${p} は ${blockSize(p)} − 5 = ${awsUsable(p)} 個。${tooSmall}`,
  }
}
