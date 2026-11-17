import type { Question } from './types'

/**
 * 問題 Markdown を Question[] に変換する。
 *
 * 前提とする書式:
 *   # <試験名> 問題 <分野番号> <分野名>
 *   ## 問題
 *   ### <小項目>
 *   **問N** 問題文(複数行、コードブロック可)
 *   - A. 選択肢
 *   ## 解答・解説
 *   | N | A | 解説 |      複数選択は「A、C」
 */
export function parseQuestions(md: string, source = '(input)'): Question[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')

  const title = lines.find((l) => l.startsWith('# '))
  const tm = title?.match(/^# (\S+) 問題 (\S+) (.+)$/)
  if (!tm) throw new Error(`${source}: タイトル行「# <試験> 問題 <番号> <分野名>」がない`)
  const [, exam, domain, domainTitle] = tm

  const answerStart = lines.findIndex((l) => /^## 解答/.test(l))
  if (answerStart < 0) throw new Error(`${source}: 「## 解答」節がない`)

  const answers = new Map<number, { answer: string[]; explanation: string }>()
  for (const l of lines.slice(answerStart)) {
    const m = l.match(/^\|\s*(\d+)\s*\|\s*([A-Z](?:\s*[、,]\s*[A-Z])*)\s*\|\s*(.*?)\s*\|\s*$/)
    if (!m) continue
    answers.set(Number(m[1]), {
      answer: m[2].split(/[、,]/).map((s) => s.trim()),
      explanation: m[3],
    })
  }

  const questions: Question[] = []
  let section = ''
  let cur: Question | null = null
  let stem: string[] = []
  let inFence = false

  const flush = () => {
    if (!cur) return
    cur.stem = stem.join('\n').trim()
    questions.push(cur)
    cur = null
    stem = []
  }

  for (const l of lines.slice(0, answerStart)) {
    if (l.startsWith('```')) inFence = !inFence
    if (!inFence) {
      const sm = l.match(/^### (.+)$/)
      if (sm) {
        flush()
        section = sm[1].trim()
        continue
      }
      const qm = l.match(/^\*\*問(\d+)\*\*\s*(.*)$/)
      if (qm) {
        flush()
        const number = Number(qm[1])
        cur = {
          id: `${exam.toLowerCase()}-${domain}-q${number}`,
          exam,
          domain,
          domainTitle,
          section,
          number,
          stem: '',
          choices: [],
          answer: [],
          explanation: '',
        }
        stem = [qm[2]]
        continue
      }
      const cm = l.match(/^- ([A-Z])\. (.+)$/)
      if (cm && cur) {
        cur.choices.push({ key: cm[1], text: cm[2].trim() })
        continue
      }
    }
    if (cur && cur.choices.length === 0) stem.push(l)
  }
  flush()

  for (const q of questions) {
    const a = answers.get(q.number)
    if (!a) throw new Error(`${source}: 問${q.number} の解答がない`)
    if (q.choices.length < 2) throw new Error(`${source}: 問${q.number} の選択肢が不足`)
    const keys = new Set(q.choices.map((c) => c.key))
    for (const k of a.answer) {
      if (!keys.has(k)) throw new Error(`${source}: 問${q.number} の正解 ${k} が選択肢にない`)
    }
    q.answer = a.answer
    q.explanation = a.explanation
  }

  const declared = md.match(/全(\d+)問/)
  if (declared && Number(declared[1]) !== questions.length) {
    throw new Error(`${source}: 宣言は全${declared[1]}問、抽出は${questions.length}問`)
  }
  const numbers = new Set(questions.map((q) => q.number))
  if (numbers.size !== questions.length) throw new Error(`${source}: 問番号が重複`)

  return questions
}
