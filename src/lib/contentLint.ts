import type { Question } from './types'

/**
 * 問題の内容の検査。過去に見つかった欠陥を、同じ形で二度と入れないための規則。
 * error は npm run gen を失敗させる。warn は数だけを npm run metrics で記録する。
 * 規則を足したら docs/改善ログ.md の「検査に変えたもの」にも書く。
 */
export interface Finding {
  level: 'error' | 'warn'
  rule: string
  code: string
  message: string
}

/** 試験ごとの禁止パターン。版をそろえたなど、内容の取り決めを破る書き方を見つける */
export interface ForbiddenRule {
  exam?: string
  pattern: RegExp
  message: string
}

export const FORBIDDEN: ForbiddenRule[] = [
  // 2026-11-19: Terraform の AWS プロバイダーは 6 系にそろえた。解説に 5 系が残っていた
  // 一般の制約の例(`~> 1.2.0` など)は対象にしない。hashicorp/aws の version と、解説の「メジャーの 5 は」だけを見る
  {
    exam: 'Terraform',
    pattern: /hashicorp\/aws"\s*\n\s*version\s*=\s*"[~>=<\s]*[1-5]\.|メジャーの\s*[1-5]\s*は/,
    message: 'AWS プロバイダーの版は 6 系にそろえる',
  },
]

// 出題の順番は入れ替わるので、ほかの問題を前提にした書き方は使えない(2026-11-18、2026-11-24 に見つかった)
// 「セキュリティ上の問題」のように、語の一部としての「上の問題」は除く
const XREF = /前の問題|次の問題|(?<![ァ-ヶー一-龠])上の問題|前問|先の問題|問\s*\d+\s*(?:の|で|と|を|に|は|より)/

// 選択肢を並べ替えると、解説の「- A. …」の記号は付け替えられる。「- A と D. …」のように 1 行に記号を複数書くと付け替えられない
const MULTI_BULLET = /^- [A-H]\s*(?:と|、|,|\/)\s*[A-H]/

function normalize(s: string): string {
  return s.replace(/\s+/g, '')
}

/** コードブロックの外の行だけを返す */
function proseLines(text: string): string[] {
  const out: string[] = []
  let fence = false
  for (const l of text.split('\n')) {
    if (l.startsWith('```')) {
      fence = !fence
      continue
    }
    if (!fence) out.push(l)
  }
  return out
}

export function lintQuestions(qs: readonly Question[], forbidden: readonly ForbiddenRule[] = FORBIDDEN): Finding[] {
  const out: Finding[] = []
  const add = (level: Finding['level'], rule: string, q: Question, message: string) => out.push({ level, rule, code: q.code, message })

  const stems = new Map<string, string>()
  for (const q of qs) {
    const input = q.kind === 'input'

    if (q.explanation.trim() === '') add('error', 'explanation-empty', q, '解説がない')

    for (const [where, text] of [['問題文', q.stem], ['解説', q.explanation]] as const) {
      const m = proseLines(text).join('\n').match(XREF)
      if (m) add('error', 'xref', q, `${where}がほかの問題を前提にしている(「${m[0]}」)。出題の順番は入れ替わる`)
    }

    const corpus = [q.stem, ...q.choices.map((c) => c.text), q.explanation].join('\n')
    for (const f of forbidden) {
      if (f.exam && f.exam !== q.exam) continue
      const m = corpus.match(f.pattern)
      if (m) add('error', 'forbidden', q, `${f.message}(「${m[0]}」)`)
    }

    const key = `${q.exam}\n${normalize(q.stem)}`
    const dup = stems.get(key)
    if (dup) add('error', 'dup-stem', q, `問題文が ${dup} と同じ`)
    else stems.set(key, q.code)

    if (input) continue

    const texts = q.choices.map((c) => normalize(c.text))
    if (new Set(texts).size !== texts.length) add('error', 'dup-choice', q, '同じ選択肢がある')

    const keys = new Set(q.choices.map((c) => c.key))
    const explained = new Set<string>()
    for (const l of proseLines(q.explanation)) {
      if (MULTI_BULLET.test(l)) add('error', 'multi-bullet', q, `解説の「${l.slice(0, 12)}…」は、選択肢を並べ替えると記号が付け替えられない。1 行に 1 つの記号で書く`)
      const b = l.match(/^- ([A-Z])\. /)
      if (!b) continue
      if (!keys.has(b[1])) add('error', 'bullet-key', q, `解説の「- ${b[1]}.」に当たる選択肢がない`)
      explained.add(b[1])
    }

    const count = q.stem.match(/\*\*([2-9])つ\*\*|([2-9])つ選/)
    const n = count ? Number(count[1] ?? count[2]) : 0
    if (q.answer.length > 1 && n !== q.answer.length) add('error', 'multi-count', q, `正解は ${q.answer.length} つだが、問題文に「${q.answer.length}つ選べ」がない`)
    if (q.answer.length === 1 && n > 1) add('error', 'multi-count', q, `問題文は ${n} つ選ばせるが、正解は 1 つ`)

    const unexplained = q.choices.filter((c) => !q.answer.includes(c.key) && !explained.has(c.key)).map((c) => c.key)
    if (unexplained.length) add('warn', 'wrong-choice-unexplained', q, `誤りの選択肢 ${unexplained.join('、')} に「- X.」の説明がない`)
  }
  return out
}

/** 規則ごとの件数 */
export function countByRule(fs: readonly Finding[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const f of fs) out[f.rule] = (out[f.rule] ?? 0) + 1
  return out
}

// テキストの図(2026-11-25)。アプリ、Obsidian、claude.ai の Project で同じに見えるように、文字の図の書き方を決めた。
// 罫線(─│┌ など)と三角の矢印(▲▼▶◀)は、フォントによって幅が 1 文字にも 2 文字にもなり、桁がずれる
const WIDE_DRAWING = /[─-╿▲-◅]/
// 日本語などの全角の文字の幅は、フォントによって半角 2 文字ぶんにならない。その後ろで空白を 2 つ以上並べて桁をそろえると、ずれる
const NON_ASCII = /[^\t\x20-\x7e]/
const ALIGN_AFTER = /\S {2,}\S/

/** テキストのコードブロックの中の図の書き方を検査する。見つかった行の番号(1 から)と理由を返す */
export function lintTextDiagrams(md: string): { line: number; message: string }[] {
  const out: { line: number; message: string }[] = []
  let fence: string | null = null
  md.split('\n').forEach((l, i) => {
    if (l.startsWith('```')) {
      fence = fence === null ? l.slice(3).trim() : null
      return
    }
    if (fence === null) return
    if (WIDE_DRAWING.test(l)) out.push({ line: i + 1, message: '罫線や三角の矢印は使わず、ASCII(| + - ` v ^ > <)で描く' })
    if (fence === 'text') {
      const m = NON_ASCII.exec(l)
      if (m && ALIGN_AFTER.test(l.slice(m.index))) out.push({ line: i + 1, message: '日本語の後ろで、空白を並べて桁をそろえない(日本語は行の最後に置く)' })
    }
  })
  return out
}
