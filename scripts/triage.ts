// エクスポートしたバックアップから、直す候補の問題を一覧にする。
//   npm run triage -- <sre-drill-backup-YYYY-MM-DD.json>
// 指摘のある問題と、3 回以上解いて正答率が 34% 以下の問題を、Markdown の表で出す。
// 直したら、アプリの成績画面の「問題への指摘」で消し、docs/改善ログ.md に書く。
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Backup } from '../src/lib/db'
import { SUSPECT_MAX_ACCURACY, SUSPECT_MIN_ATTEMPTS, triage } from '../src/lib/triage'
import type { Question } from '../src/lib/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = process.argv[2]
if (!file) {
  console.error('使い方: npm run triage -- <バックアップの JSON>')
  process.exit(2)
}
const backup = JSON.parse(readFileSync(file, 'utf8')) as Backup
const questions = JSON.parse(readFileSync(join(root, 'src', 'data', 'questions.json'), 'utf8')) as Question[]

// 問題 ID から、問題のファイルを引く
const where = new Map<string, string>()
const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.md') ? [join(d, e.name)] : []))
for (const f of walk(join(root, 'content'))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/`([A-Za-z0-9]+-[\d.]+-\d{3})`/g)) if (!where.has(m[1])) where.set(m[1], relative(root, f).replace(/\\/g, '/'))
}

const { items, unknown } = triage(questions, backup.attempts, backup.flags ?? [])
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
console.log(`# 直す候補(${backup.exportedAt} のバックアップ)\n`)
console.log(`指摘 ${items.filter((i) => i.flag).length} 問、正答率の低い問題(${SUSPECT_MIN_ATTEMPTS} 回以上、${Math.round(SUSPECT_MAX_ACCURACY * 100)}% 以下)${items.filter((i) => i.suspect).length} 問\n`)
if (items.length) {
  console.log('| 問題 ID | ファイル | 指摘 | 内容 | 正答 |')
  console.log('|---|---|---|---|---|')
  for (const i of items) {
    console.log(`| ${i.code} | ${where.get(i.code) ?? '?'} | ${i.flag?.kind ?? '(正答率)'} | ${cell(i.flag?.note ?? '')} | ${i.correct}/${i.attempts} |`)
  }
}
if (unknown.length) {
  console.log(`\n問題が見つからない指摘(ID が変わったか、消した問題): ${unknown.map((f) => f.code).join('、')}`)
}
