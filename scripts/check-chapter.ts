// 1 章ぶんの問題とテキストを、全体を生成する前に確かめる。教材を量産するときに、章ごとに使う。
// 使い方: npm run check-chapter -- <問題のファイル> <テキストのファイル> [用語の表.json]
// 用語の表は { "1.1": [["表示名", "正規表現"], …], … } の形。小項目ごとに、問題に出てくる用語の数を表示する
import { readFileSync } from 'node:fs'
import { lintQuestions } from '../src/lib/contentLint'
import { parseQuestions } from '../src/lib/parser'

// src/lib/texts.ts は Vite でしか読めない(import.meta.glob)ので、節の番号の取り出しをここに書く
function textSections(md: string): Set<string> {
  const out = new Set<string>()
  let fence = false
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('```')) fence = !fence
    const m = fence ? null : line.match(/^## (\d+(?:\.\d+)+)/)
    if (m) out.add(m[1])
  }
  return out
}

function sectionNumbers(label: string): string[] {
  const out: string[] = []
  for (const token of label.split(/\s+/)) {
    if (/^\d+(?:\.\d+)+$/.test(token)) out.push(token)
    else if (token !== '/') break
  }
  return out
}

const [qFile, tFile, termsFile] = process.argv.slice(2)
if (!qFile || !tFile) throw new Error('使い方: npm run check-chapter -- <問題のファイル> <テキストのファイル> [用語の表.json]')

const qs = parseQuestions(readFileSync(qFile, 'utf8'), qFile)
const findings = lintQuestions(qs)
for (const f of findings) console.log(`[${f.level}] [${f.rule}] ${f.code}: ${f.message}`)

let errors = findings.filter((f) => f.level === 'error').length
const secs = textSections(readFileSync(tFile, 'utf8'))
const bySec = new Map<string, number>()
for (const q of qs) {
  for (const n of sectionNumbers(q.section)) {
    bySec.set(n, (bySec.get(n) ?? 0) + 1)
    if (!secs.has(n)) {
      console.log(`[error] テキストに「## ${n}」の節がない(${q.code})`)
      errors++
    }
  }
}
const pos = new Map<string, number>()
for (const q of qs) if (q.kind !== 'input') for (const a of q.answer) pos.set(a, (pos.get(a) ?? 0) + 1)
console.log(`${qs.length} 問`)
console.log('小項目ごとの問題の数:', Object.fromEntries(bySec))
console.log('正解の位置:', Object.fromEntries([...pos].sort()))

if (termsFile) {
  const table = JSON.parse(readFileSync(termsFile, 'utf8')) as Record<string, [string, string][]>
  for (const [sec, terms] of Object.entries(table)) {
    const text = qs
      .filter((q) => sectionNumbers(q.section).includes(sec))
      .map((q) => [q.stem, ...q.choices.map((c) => c.text), ...q.answer, q.explanation].join('\n'))
      .join('\n')
    const missing = terms.filter(([, p]) => !new RegExp(p).test(text)).map(([label]) => label)
    console.log(`${sec}: 用語 ${terms.length - missing.length}/${terms.length}${missing.length ? ` 不足: ${missing.join('、')}` : ''}`)
  }
}
if (errors) {
  console.log(`誤り ${errors} 件`)
  process.exit(1)
}
