// 出題範囲の用語が問題に出てくるかを集計する。npm run coverage と npm run metrics が使う
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Question } from '../../src/lib/types'
import type { Table } from './types'

export interface ObjectiveResult {
  objective: string
  weight: number | null
  questions: number
  terms: number
  covered: string[]
  missing: string[]
}

export interface ExamResult {
  exam: string
  questions: number
  terms: number
  covered: number
  objectives: ObjectiveResult[]
  /** 表にあるのに、問題が 1 問もない小項目 */
  emptyObjectives: string[]
}

export interface Coverage {
  exams: ExamResult[]
  /** 問題が 2 問未満の小項目(問題の section ごと) */
  thinSections: { exam: string; section: string; questions: number }[]
  /** 表のない試験 */
  untracked: string[]
  /** SAA の対象サービスのうち、テキストと問題に出てこないもの */
  saaServices?: { total: number; missingInTexts: string[]; missingInQuestions: string[] }
}

export const MIN_PER_SECTION = 2

export function corpus(q: Question): string {
  return [q.stem, ...q.choices.map((c) => c.text), ...(q.kind === 'input' ? q.answer : []), q.explanation].join('\n')
}

/** 問題の section の最初の語。CCNA の「2.0 / 2.1 …」は両方を返す */
function objectivesOf(q: Question): string[] {
  return q.section.replace(/\//g, ' ').split(/\s+/).filter((w) => /^\d+(\.\d+)+$/.test(w))
}

export function analyzeExam(exam: string, table: Table, qs: readonly Question[]): ExamResult {
  const mine = qs.filter((q) => q.exam === exam)
  const objectives: ObjectiveResult[] = []
  for (const [objective, { weight, terms }] of Object.entries(table)) {
    const oq = mine.filter((q) => objectivesOf(q).includes(objective))
    const text = oq.map(corpus).join('\n')
    const covered: string[] = []
    const missing: string[] = []
    for (const [label, pattern] of terms) (new RegExp(pattern).test(text) ? covered : missing).push(label)
    objectives.push({ objective, weight, questions: oq.length, terms: terms.length, covered, missing })
  }
  return {
    exam,
    questions: mine.length,
    terms: objectives.reduce((s, o) => s + o.terms, 0),
    covered: objectives.reduce((s, o) => s + o.covered.length, 0),
    objectives,
    emptyObjectives: objectives.filter((o) => o.questions === 0).map((o) => o.objective),
  }
}

export async function loadTables(root: string): Promise<{ exam: string; table: Table; services?: string[] }[]> {
  const dir = join(root, 'scripts', 'coverage', 'terms')
  const out = []
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
    const m = (await import(pathToFileURL(join(dir, f)).href)) as { exam: string; table: Table; services?: string[] }
    out.push(m)
  }
  return out
}

function readTexts(dir: string): string {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')
}

export async function analyze(root: string): Promise<Coverage> {
  const qs = JSON.parse(readFileSync(join(root, 'src', 'data', 'questions.json'), 'utf8')) as Question[]
  const tables = await loadTables(root)
  const exams = tables.map((t) => analyzeExam(t.exam, t.table, qs))

  const bySection = new Map<string, number>()
  for (const q of qs) bySection.set(`${q.exam}\n${q.section}`, (bySection.get(`${q.exam}\n${q.section}`) ?? 0) + 1)
  const thinSections = [...bySection]
    .filter(([, n]) => n < MIN_PER_SECTION)
    .map(([k, n]) => ({ exam: k.split('\n')[0], section: k.split('\n')[1], questions: n }))

  const tracked = new Set(tables.map((t) => t.exam))
  const untracked = [...new Set(qs.map((q) => q.exam))].filter((e) => !tracked.has(e))

  const result: Coverage = { exams, thinSections, untracked }
  const saa = tables.find((t) => t.services)
  if (saa?.services) {
    const ttext = readTexts(join(root, 'texts', 'aws-saa'))
    const qtext = qs.filter((q) => q.exam === saa.exam).map(corpus).join('\n')
    result.saaServices = {
      total: saa.services.length,
      missingInTexts: saa.services.filter((s) => !ttext.includes(s)),
      missingInQuestions: saa.services.filter((s) => !qtext.includes(s)),
    }
  }
  return result
}

/** 基準(baseline.json)は、試験ごとの「出てくる用語」の一覧。「小項目 表示名」の形 */
export type Baseline = Record<string, string[]>

export function toBaseline(c: Coverage): Baseline {
  const out: Baseline = {}
  for (const e of c.exams) out[e.exam] = e.objectives.flatMap((o) => o.covered.map((l) => `${o.objective} ${l}`)).sort()
  return out
}

/** 基準で出てきていた用語のうち、今は出てこないもの。表から消した用語は数えない */
export function regressions(c: Coverage, base: Baseline): string[] {
  const out: string[] = []
  for (const e of c.exams) {
    const now = new Set(e.objectives.flatMap((o) => o.covered.map((l) => `${o.objective} ${l}`)))
    const exists = new Set(e.objectives.flatMap((o) => [...o.covered, ...o.missing].map((l) => `${o.objective} ${l}`)))
    for (const t of base[e.exam] ?? []) if (exists.has(t) && !now.has(t)) out.push(`${e.exam} ${t}`)
  }
  return out
}
