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
 *
 * 入力問題は選択肢を書かず、正解の欄に入力として認める答えをコードで書く。
 *   | N | `ssh-keygen` | 解説 |      複数あれば「`atq`、`at -l`」
 */
export function parseQuestions(md: string, source = '(input)'): Question[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')

  const title = lines.find((l) => l.startsWith('# '))
  const tm = title?.match(/^# (\S+) 問題 (\S+) (.+)$/)
  if (!tm) throw new Error(`${source}: タイトル行「# <試験> 問題 <番号> <分野名>」がない`)
  const [, exam, domain, domainTitle] = tm

  const answerStart = lines.findIndex((l) => /^## 解答/.test(l))
  if (answerStart < 0) throw new Error(`${source}: 「## 解答」節がない`)

  const answers = new Map<number, { answer: string[]; accept: string[] | null; explanation: string }>()
  for (const l of lines.slice(answerStart)) {
    const m = l.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/)
    if (!m) continue
    if (/^[A-Z](?:\s*[、,]\s*[A-Z])*$/.test(m[2])) {
      answers.set(Number(m[1]), { answer: m[2].split(/[、,]/).map((s) => s.trim()), accept: null, explanation: m[3] })
    } else if (m[2].startsWith('`')) {
      const accept = [...m[2].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim())
      answers.set(Number(m[1]), { answer: accept, accept, explanation: m[3] })
    }
  }

  const questions: Question[] = []
  let section = ''
  let cur: Question | null = null
  let stem: string[] = []
  let inFence = false
  // 小項目の見出しと最初の問題の間に書かれた共通の前置き(表や出力)。
  // 「問1〜問4 は…」と範囲があればその問題だけ、なければその小項目の全問題の問題文の先頭に付ける。
  let preface: string[] = []
  let shared: { text: string; from: number; to: number } | null = null

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
        preface = []
        shared = null
        continue
      }
      const qm = l.match(/^\*\*問(\d+)\*\*\s*(.*)$/)
      if (qm) {
        flush()
        if (preface.some((x) => x.trim())) {
          const text = preface.join('\n').trim()
          const range = text.match(/問(\d+)\s*[〜~-]\s*問(\d+)/)
          // 出題順は入れ替わるので、「問1〜問4 は、」の部分は問題文に残さない
          const body = text.replace(/^問\d+\s*[〜~-]\s*問\d+\s*は、?\s*/, '')
          shared = range ? { text: body, from: Number(range[1]), to: Number(range[2]) } : { text, from: 0, to: Infinity }
        }
        preface = []
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
        stem = shared && number >= shared.from && number <= shared.to ? [shared.text, '', qm[2]] : [qm[2]]
        continue
      }
      const cm = l.match(/^- ([A-Z])\. (.+)$/)
      if (cm && cur) {
        cur.choices.push({ key: cm[1], text: cm[2].trim() })
        continue
      }
    }
    if (cur && cur.choices.length === 0) stem.push(l)
    else if (!cur && section) preface.push(l)
  }
  flush()

  for (const q of questions) {
    const a = answers.get(q.number)
    if (!a) throw new Error(`${source}: 問${q.number} の解答がない`)
    if (a.accept) {
      if (q.choices.length > 0) throw new Error(`${source}: 問${q.number} は入力問題なのに選択肢がある`)
      if (a.accept.length === 0) throw new Error(`${source}: 問${q.number} の正解が空`)
      q.kind = 'input'
      q.answer = a.accept
      q.explanation = a.explanation
      continue
    }
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
