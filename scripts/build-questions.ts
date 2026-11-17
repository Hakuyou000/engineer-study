// content/**/*.md を解析し、src/data/questions.json を生成する。
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { compareExam } from '../src/lib/order'
import { parseQuestions } from '../src/lib/parser'
import type { Question } from '../src/lib/types'

const root = join(import.meta.dirname, '..')
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

mkdirSync(join(root, 'src', 'data'), { recursive: true })
writeFileSync(outFile, JSON.stringify(all, null, 1) + '\n')
console.log(`合計 ${all.length} 問 → ${relative(root, outFile)}`)
