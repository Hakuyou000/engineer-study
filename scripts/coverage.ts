// 出題範囲の網羅性を表示し、検査する。
//   npm run coverage              試験ごとの結果を表示する
//   npm run coverage -- --check   CI 用。次のどれかがあれば失敗する
//                                  - 基準(scripts/coverage/baseline.json)で出てきていた用語が出てこなくなった
//                                  - 表にある小項目に問題が 1 問もない
//                                  - 問題が 2 問未満の小項目がある
//                                  - 用語の表がない試験がある
//   npm run coverage -- --update  今の結果を基準にする。用語が増えたら実行してコミットする
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyze, MIN_PER_SECTION, regressions, toBaseline, type Baseline } from './coverage/analyze'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const baselineFile = join(root, 'scripts', 'coverage', 'baseline.json')
const args = new Set(process.argv.slice(2))
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '-')

const c = await analyze(root)

for (const e of c.exams) {
  console.log(`== ${e.exam}: ${e.questions} 問、用語 ${e.covered}/${e.terms}(${pct(e.covered, e.terms)})`)
  const wsum = e.objectives.reduce((s, o) => s + (o.weight ?? 0), 0)
  for (const o of e.objectives) {
    const share = wsum && o.weight != null ? ` 問題 ${pct(o.questions, e.questions)} / 重要度 ${pct(o.weight, wsum)}` : ''
    const miss = o.missing.length ? ` 出てこない: ${o.missing.join('、')}` : ''
    console.log(`  ${o.objective.padEnd(7)} ${String(o.questions).padStart(3)} 問 ${o.covered.length}/${o.terms}${share}${miss}`)
  }
}
if (c.saaServices) {
  const s = c.saaServices
  console.log(`== SAA 対象サービス ${s.total}: テキスト ${s.total - s.missingInTexts.length}、問題 ${s.total - s.missingInQuestions.length}`)
  if (s.missingInTexts.length) console.log(`  テキストにない: ${s.missingInTexts.join('、')}`)
  if (s.missingInQuestions.length) console.log(`  問題にない: ${s.missingInQuestions.join('、')}`)
}

if (args.has('--update')) {
  writeFileSync(baselineFile, JSON.stringify(toBaseline(c), null, 1) + '\n')
  console.log(`基準を更新した → scripts/coverage/baseline.json`)
}

if (args.has('--check')) {
  const base: Baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, 'utf8')) : {}
  const problems = [
    ...regressions(c, base).map((t) => `出てこなくなった用語: ${t}`),
    ...c.exams.flatMap((e) => e.emptyObjectives.map((o) => `問題のない小項目: ${e.exam} ${o}`)),
    ...c.thinSections.map((s) => `問題が ${MIN_PER_SECTION} 問未満: ${s.exam} ${s.section}(${s.questions} 問)`),
    ...c.untracked.map((e) => `用語の表がない試験: ${e}(scripts/coverage/terms/ に足す)`),
  ]
  for (const p of problems) console.error(p)
  if (problems.length) {
    console.error(`網羅性の検査で ${problems.length} 件。用語を消したのが意図どおりなら、npm run coverage -- --update で基準を更新する`)
    process.exit(1)
  }
  console.log('網羅性の検査: 問題なし')
}
