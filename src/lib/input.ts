import type { Question } from './types'

/** 入力の比較用。全角の英数字と記号(NFKC で半角にする)、前後の空白、囲みの記号、連続する空白、末尾の / を無視する。 */
export function normalizeInput(s: string): string {
  return s
    .normalize('NFKC')
    .trim()
    .replace(/^[`'"「]+|[`'"」]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(.)\/$/, '$1')
}

/** 入力が正解か。英大文字だけの答え(シグナル名やレコード種別)は大文字小文字を区別しない。 */
export function inputMatches(accept: readonly string[], input: string): boolean {
  const v = normalizeInput(input)
  if (!v) return false
  return accept.some((a) => {
    const n = normalizeInput(a)
    // プレフィックス長は「/26」と「26」のどちらでもよい
    if (/^\/\d+$/.test(n)) return v.replace(/^\//, '') === n.slice(1)
    // 拡張子は「.tf」と「*.tf」のどちらでもよい
    if (/^\.[A-Za-z0-9.]+$/.test(n) && v === `*${n}`) return true
    // 数(2 進数、16 進数を含む)は、桁の区切りの空白、「,」、「_」を無視する(「1111 0000」「1,000」)
    if (/^(?=.*\d)[0-9A-Fa-f]+$/.test(n) && v.replace(/[\s,_]/g, '').toLowerCase() === n.toLowerCase()) return true
    // 英字を含まない答え(「17日」「500個」)は、数と単位の間の空白を無視する
    if (!/[A-Za-z]/.test(n) && v.replace(/\s/g, '') === n.replace(/\s/g, '')) return true
    return /^[A-Z0-9_-]+$/.test(n) ? n.toLowerCase() === v.toLowerCase() : n === v
  })
}

// 空白を含まない ASCII の1語(コマンド名、ファイル名、キーワードなど)
const TOKEN = /^`?([\x21-\x5f\x61-\x7e]+)`?$/
// 答えが1つに決まる問い方。「プライベートアドレスはどれか」のように候補が無数にある問いは除く
const ASKS_NAME = /(コマンド|ファイル|ディレクトリ|変数|オプション|キーワード|記号|シグナル|モジュール|チェイン|ターゲット|書き方|設定|値|レコード|セレクタ|形式|並び|プレフィックス長|ワイルドカードマスク|サブネットマスク|数|ユーザー?|ID|状態|規格|方式)(名)?(として)?(は|を)(どれか|答えよ)/
const NEGATIVE = /誤って|適切でない|でないもの|ないもの|含まれない|存在しない|必要が\*\*ない|\*\*ない\*\*|ない(ファイル|コマンド|ユーザー)/

/** 選択問題を入力でも解けるか。単一正解で、正解の選択肢が1語で、答えが1つに決まる問い方のもの。 */
export function canInput(q: Question): boolean {
  if (q.kind === 'input') return true
  if (q.answer.length !== 1) return false
  const c = q.choices.find((x) => x.key === q.answer[0])
  const ask = q.stem.split('\n').filter((l) => l.trim()).at(-1) ?? ''
  return !!c && TOKEN.test(c.text) && ASKS_NAME.test(ask) && !NEGATIVE.test(q.stem)
}

/** 選択問題を入力問題として出す。入力問題はそのまま返す。 */
export function toInput(q: Question): Question {
  if (q.kind === 'input' || !canInput(q)) return q
  const c = q.choices.find((x) => x.key === q.answer[0])!
  return {
    ...q,
    kind: 'input',
    stem: `${q.stem}\n\n(選択肢はありません。答えを入力してください)`,
    choices: [],
    answer: [c.text.match(TOKEN)![1], ...(q.inputAlt ?? [])],
    keyMap: undefined,
  }
}
