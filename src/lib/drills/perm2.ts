import type { Drill, Rng } from './types'
import { int } from './types'

const oct3 = (n: number) => n.toString(8).padStart(3, '0')
const stripZero = (s: string) => s.trim().replace(/^0+(?=\d{3}$)/, '')

/** umask から、新規作成されるファイルとディレクトリのパーミッションを求める。 */
export function applyUmask(umask: string): { file: string; dir: string } {
  const m = parseInt(umask, 8)
  return { file: oct3(0o666 & ~m & 0o777), dir: oct3(0o777 & ~m & 0o777) }
}

const WHO: Record<string, number[]> = { u: [6], g: [3], o: [0], a: [6, 3, 0] }
const BIT: Record<string, number> = { r: 4, w: 2, x: 1 }

/** 3 桁の 8 進モードに、chmod の記号モード(例: `u+x,g-w,o=r`)を適用する。特殊ビットは扱わない。 */
export function applySymbolic(mode: string, spec: string): string {
  let v = parseInt(mode, 8)
  for (const clause of spec.split(',')) {
    const m = clause.match(/^([ugoa]+)([+=-])([rwx]*)$/)
    if (!m) throw new Error(`記号モードが不正: ${clause}`)
    const bits = [...m[3]].reduce((n, c) => n | BIT[c], 0)
    for (const w of new Set([...m[1]].flatMap((c) => WHO[c]))) {
      if (m[2] === '+') v |= bits << w
      else if (m[2] === '-') v &= ~(bits << w)
      else v = (v & ~(7 << w)) | (bits << w)
    }
  }
  return oct3(v & 0o777)
}

export function genUmask(rng: Rng): Drill {
  const umask = ['022', '002', '027', '077', '007', '026', '023', '037', '012'][int(rng, 0, 8)]
  const r = applyUmask(umask)
  return {
    type: 'umask',
    prompt: `umask が \`${umask}\` のとき、新しく作るファイルとディレクトリのパーミッションを 8 進数で答えよ。`,
    fields: [
      { label: 'ファイル', answer: r.file, normalize: stripZero },
      { label: 'ディレクトリ', answer: r.dir, normalize: stripZero },
    ],
    explain: `ファイルは 666、ディレクトリは 777 から、umask のビットを落とす(論理積の否定)。ファイルは ${r.file}、ディレクトリは ${r.dir}。ファイルには実行権が最初から付かない。`,
  }
}

export function genSymbolic(rng: Rng): Drill {
  const mode = ['644', '755', '600', '640', '750', '700', '664', '775', '444', '711'][int(rng, 0, 9)]
  const clauses: string[] = []
  const whos = ['u', 'g', 'o', 'a', 'go', 'ug']
  const n = int(rng, 1, 3)
  const used = new Set<string>()
  while (clauses.length < n) {
    const who = whos[int(rng, 0, whos.length - 1)]
    if (used.has(who)) continue
    used.add(who)
    const op = ['+', '-', '='][int(rng, 0, 2)]
    let perms = ['r', 'w', 'x'].filter(() => rng() < 0.5).join('')
    if (!perms) perms = ['r', 'w', 'x'][int(rng, 0, 2)]
    clauses.push(`${who}${op}${perms}`)
  }
  const spec = clauses.join(',')
  const answer = applySymbolic(mode, spec)
  return {
    type: 'chmod-symbolic',
    prompt: `パーミッションが \`${mode}\` のファイルに \`chmod ${spec} file\` を実行した。実行後のパーミッションを 8 進数で答えよ。`,
    fields: [{ label: '8 進数', answer, normalize: stripZero }],
    explain: `u は所有者、g はグループ、o はその他、a は全員。+ は追加、- は削除、= はその値に置き換え。左から順に適用して ${answer}。`,
  }
}
