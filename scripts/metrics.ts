// 改善ループの指標を docs/指標.md に記録する。同じ日に実行したら、その日の行を置き換える。
//   npm run metrics
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { countByRule, lintQuestions } from '../src/lib/contentLint'
import type { Question } from '../src/lib/types'
import { analyze } from './coverage/analyze'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', '指標.md')
const qs = JSON.parse(readFileSync(join(root, 'src', 'data', 'questions.json'), 'utf8')) as Question[]
const cov = await analyze(root)
const warns = countByRule(lintQuestions(qs).filter((f) => f.level === 'warn'))

// 改善ログの「記録」の表を数える
const log = readFileSync(join(root, 'docs', '改善ログ.md'), 'utf8').split('\n## 記録')[1] ?? ''
const rows = log
  .split('\n')
  .filter((l) => /^\| \d{4}-\d{2}-\d{2} /.test(l))
  .map((l) => l.split('|').map((c) => c.trim()))
const byKind = new Map<string, number>()
for (const r of rows) byKind.set(r[3], (byKind.get(r[3]) ?? 0) + 1)
const repeated = [...byKind.values()].filter((n) => n >= 2).length
const checked = rows.filter((r) => r[6] && r[6] !== '(なし)').length

const terms = cov.exams.reduce((s, e) => s + e.terms, 0)
const covered = cov.exams.reduce((s, e) => s + e.covered, 0)
const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`
const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
const perExam = cov.exams.map((e) => `${e.exam} ${pct(e.covered, e.terms)}`).join('、')
const row = `| ${date} | ${qs.length} | ${covered}/${terms}(${pct(covered, terms)}) | ${warns['wrong-choice-unexplained'] ?? 0} | ${cov.thinSections.length} | ${rows.length} | ${checked} | ${repeated} | ${perExam} |`

const head = `# 指標

改善ループが回っているかを見る数字。\`npm run metrics\` が 1 日 1 行を書く。週に 1 回は実行してコミットする。

- 用語: 出題範囲の用語のうち、問題に出てくるもの(\`npm run coverage\`)
- 誤答の説明なし: 誤りの選択肢に「- X.」の説明がない問題の数(内容の検査の warn)
- 薄い小項目: 問題が 2 問未満の小項目
- ログ / 検査済み / 再発: docs/改善ログ.md の行数、そのうち検査に変えたもの、2 回以上出た分類の数

| 日付 | 問題 | 用語 | 誤答の説明なし | 薄い小項目 | ログ | 検査済み | 再発 | 試験ごとの用語 |
|---|---|---|---|---|---|---|---|---|
`
const lines = existsSync(out) ? readFileSync(out, 'utf8').split('\n').filter((l) => /^\| \d{4}-/.test(l) && !l.startsWith(`| ${date} `)) : []
writeFileSync(out, head + [...lines, row].join('\n') + '\n')
console.log(row)
