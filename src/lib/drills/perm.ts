import type { Drill, Rng } from './types'
import { int } from './types'

/** 8 進のモード(3 桁または 4 桁)を ls -l の記号表記(9 文字)にする。 */
export function octalToSymbolic(octal: string): string {
  if (!/^[0-7]{3,4}$/.test(octal)) throw new Error(`モードが不正: ${octal}`)
  const o = octal.padStart(4, '0')
  const special = Number(o[0])
  const flags = [special & 4, special & 2, special & 1]
  const letters = ['s', 's', 't']
  return [1, 2, 3]
    .map((i) => {
      const n = Number(o[i])
      const x = n & 1
      const sp = flags[i - 1]
      const last = sp ? (x ? letters[i - 1] : letters[i - 1].toUpperCase()) : x ? 'x' : '-'
      return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + last
    })
    .join('')
}

function randomMode(rng: Rng): string {
  const special = rng() < 0.25 ? [4, 2, 1][int(rng, 0, 2)] : 0
  // 実在しやすい組み合わせに寄せる。特殊ビットありのときは実行権を付ける
  const u = special ? 7 : [4, 6, 7][int(rng, 0, 2)]
  const g = special === 2 ? [5, 7][int(rng, 0, 1)] : int(rng, 0, 7)
  const o = special === 1 ? [5, 7][int(rng, 0, 1)] : int(rng, 0, 7)
  return `${special || ''}${u}${g}${o}`
}

const stripZero = (s: string) => s.trim().replace(/^0+(?=\d{3}$)/, '')

export function genOctalToSymbolic(rng: Rng): Drill {
  const mode = randomMode(rng)
  return {
    type: 'perm-to-symbolic',
    prompt: `\`chmod ${mode} file\` を実行した。\`ls -l\` に表示されるパーミッション(先頭の種別 1 文字を除く 9 文字)を答えよ。`,
    fields: [{ label: '記号表記', answer: octalToSymbolic(mode) }],
    explain:
      'r=4、w=2、x=1 を所有者・グループ・その他の順に足す。4 桁目は SUID=4、SGID=2、スティッキービット=1。実行権があれば s / t、なければ S / T。',
  }
}

export function genSymbolicToOctal(rng: Rng): Drill {
  const mode = randomMode(rng)
  return {
    type: 'perm-to-octal',
    prompt: `パーミッションが \`${octalToSymbolic(mode)}\` のファイルがある。同じ設定にする \`chmod\` の 8 進数を答えよ。`,
    fields: [{ label: '8 進数', answer: mode, normalize: stripZero }],
    explain: 'r=4、w=2、x=1。s / t は実行権に加えて特殊ビット(SUID=4、SGID=2、スティッキービット=1)が立っている。',
  }
}
