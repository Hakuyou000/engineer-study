// content/**/*.md を解析し、src/data/questions.json を生成する。glossary/*.md から src/data/glossary.json も作る。
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { countByRule, lintQuestions } from '../src/lib/contentLint'
import { compareExam } from '../src/lib/order'
import { parseQuestions } from '../src/lib/parser'
import { parseGlossary, validateGlossary, type Term } from '../src/lib/glossary'
import type { Question } from '../src/lib/types'

// import.meta.dirname は Node.js 20.11 以降にしかないので、古い Node.js でも動く書き方にする
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content')
const outFile = join(root, 'src', 'data', 'questions.json')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
    .filter((p) => p.endsWith('.md'))
    .sort()
}

const all: Question[] = []
for (const file of walk(contentDir)) {
  const qs = parseQuestions(readFileSync(file, 'utf8'), relative(root, file))
  all.push(...qs)
  console.log(`${relative(root, file)}: ${qs.length} 問`)
}

// 画面の並びを決める。試験の表示順 → 分野番号 → 問番号
all.sort((a, b) => compareExam({ exam: a.exam, number: a.domain }, { exam: b.exam, number: b.domain }) || a.number - b.number)

const ids = new Set(all.map((q) => q.id))
if (ids.size !== all.length) throw new Error('問題 ID が重複している')

// 内容の検査(src/lib/contentLint.ts)。error があれば止める。warn は件数だけ出す
const findings = lintQuestions(all)
const errors = findings.filter((f) => f.level === 'error')
for (const f of errors) console.error(`[${f.rule}] ${f.code}: ${f.message}`)
const warns = countByRule(findings.filter((f) => f.level === 'warn'))
for (const [rule, n] of Object.entries(warns)) console.log(`warn ${rule}: ${n} 問`)
if (errors.length) throw new Error(`内容の検査で ${errors.length} 件の誤り`)

mkdirSync(join(root, 'src', 'data'), { recursive: true })
writeFileSync(outFile, JSON.stringify(all, null, 1) + '\n')
console.log(`合計 ${all.length} 問 → ${relative(root, outFile)}`)

// 用語集。索引の並びはファイルの番号の順(用語集_10 を 用語集_2 の後ろにする)
const glossaryDir = join(root, 'glossary')
const terms: Term[] = []
for (const file of walk(glossaryDir).sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))) {
  const ts = parseGlossary(readFileSync(file, 'utf8'), relative(root, file))
  terms.push(...ts)
  console.log(`${relative(root, file)}: ${ts.length} 語`)
}
validateGlossary(terms, [...new Set(all.map((q) => q.exam))])
const glossaryFile = join(root, 'src', 'data', 'glossary.json')
writeFileSync(glossaryFile, JSON.stringify(terms, null, 1) + '\n')
console.log(`用語 ${terms.length} 語 → ${relative(root, glossaryFile)}`)
