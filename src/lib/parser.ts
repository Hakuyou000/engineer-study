import type { Question } from './types'

/**
 * 問題 Markdown を Question[] に変換する。
 *
 * 前提とする書式:
 *   # <試験名> 問題 <分野番号> <分野名>
 *   ## 問題
 *   ### <小項目>
 *   **問N** `問題ID` [タグ] 問題文(複数行、コードブロック可)。問題 ID は省略できるが、書くなら questionCode と一致させる
 *   タグは任意。ID の直後に [CKA] や [実務] のように書く(TAGS にあるものだけ)
 *   - A. 選択肢
 *   ## 解答・解説
 *   ### 問N `問題ID`
 *   **正解**: A                 複数選択は「A、C」
 *   解説(複数行、段落、コードブロック可。次の「### 問」まで)
 *
 * 入力問題は選択肢を書かず、正解に入力として認める答えをコードで書く。
 *   **正解**: `ssh-keygen`      複数あれば「`atq`、`at -l`」
 *
 * 選択問題を入力でも出すとき、正解の選択肢と同じ意味の別の書き方(長い形のオプションなど)は、
 * 正解の行の次に書く。
 *   **入力の別解**: `--create-home`
 */
/** 問題に付けられるタグ。試験の範囲(CKA)と、試験の外の実務の知識(実務)を見分ける */
export const TAGS = ['CKA', '実務'] as const

/** 画面と Markdown に表示する問題 ID。試験名-分野番号-問番号(3 桁)。例: LinuC102-1.06-019 */
export function questionCode(exam: string, domain: string, number: number): string {
  return `${exam}-${domain}-${String(number).padStart(3, '0')}`
}

export function parseQuestions(md: string, source = '(input)'): Question[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')

  const title = lines.find((l) => l.startsWith('# '))
  const tm = title?.match(/^# (\S+) 問題 (\S+) (.+)$/)
  if (!tm) throw new Error(`${source}: タイトル行「# <試験> 問題 <番号> <分野名>」がない`)
  const [, exam, domain, domainTitle] = tm

  const answerStart = lines.findIndex((l) => /^## 解答/.test(l))
  if (answerStart < 0) throw new Error(`${source}: 「## 解答」節がない`)

  const answers = new Map<number, { answer: string[]; accept: string[] | null; alt: string[]; explanation: string }>()
  const parseAnswer = (number: number, body: string[]) => {
    const i = body.findIndex((l) => /^\*\*正解\*\*[:：]/.test(l))
    if (i < 0) throw new Error(`${source}: 問${number} の解答に「**正解**:」の行がない`)
    const value = body[i].replace(/^\*\*正解\*\*[:：]\s*/, '').trim()
    let rest = body.slice(i + 1)
    const j = rest.findIndex((l) => l.trim() !== '')
    let alt: string[] = []
    if (j >= 0 && /^\*\*入力の別解\*\*[:：]/.test(rest[j])) {
      alt = [...rest[j].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim())
      if (alt.length === 0) throw new Error(`${source}: 問${number} の入力の別解が空`)
      rest = rest.slice(j + 1)
    }
    const explanation = rest.join('\n').trim()
    if (answers.has(number)) throw new Error(`${source}: 問${number} の解答が重複`)
    if (/^[A-Z](?:\s*[、,]\s*[A-Z])*$/.test(value)) {
      answers.set(number, { answer: value.split(/[、,]/).map((x) => x.trim()), accept: null, alt, explanation })
    } else if (value.startsWith('`')) {
      const accept = [...value.matchAll(/`([^`]+)`/g)].map((x) => x[1].trim())
      if (alt.length) throw new Error(`${source}: 問${number} は入力問題なので、別解は正解の行に並べる`)
      answers.set(number, { answer: accept, accept, alt, explanation })
    } else {
      throw new Error(`${source}: 問${number} の正解「${value}」の書き方が誤り`)
    }
  }
  {
    let num = 0
    let body: string[] = []
    let fence = false
    for (const l of lines.slice(answerStart + 1)) {
      if (l.startsWith('```')) fence = !fence
      const hm = fence ? null : l.match(/^### 問(\d+)(?:\s+`([^`]+)`)?\s*$/)
      if (hm) {
        if (num) parseAnswer(num, body)
        num = Number(hm[1])
        body = []
        if (hm[2] && hm[2] !== questionCode(exam, domain, num)) {
          throw new Error(`${source}: 解答の問${num} の問題 ID ${hm[2]} は ${questionCode(exam, domain, num)} であるべき`)
        }
        continue
      }
      if (num) body.push(l)
    }
    if (num) parseAnswer(num, body)
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
        const code = questionCode(exam, domain, number)
        let rest = qm[2]
        const idm = rest.match(/^`([A-Za-z0-9]+-[\d.]+-\d{3})`\s*(.*)$/)
        if (idm) {
          if (idm[1] !== code) throw new Error(`${source}: 問${number} の問題 ID ${idm[1]} は ${code} であるべき`)
          rest = idm[2]
        }
        const tags: string[] = []
        for (let tm2 = rest.match(/^\[([^\]\s]+)\]\s*(.*)$/); tm2; tm2 = rest.match(/^\[([^\]\s]+)\]\s*(.*)$/)) {
          if (!(TAGS as readonly string[]).includes(tm2[1])) throw new Error(`${source}: 問${number} のタグ [${tm2[1]}] は ${TAGS.join('、')} のどれかにする`)
          tags.push(tm2[1])
          rest = tm2[2]
        }
        cur = {
          id: `${exam.toLowerCase()}-${domain}-q${number}`,
          code,
          exam,
          domain,
          domainTitle,
          section,
          number,
          stem: '',
          choices: [],
          answer: [],
          explanation: '',
          ...(tags.length ? { tags } : {}),
        }
        stem = shared && number >= shared.from && number <= shared.to ? [shared.text, '', rest] : [rest]
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
    if (a.alt.length && a.answer.length !== 1) throw new Error(`${source}: 問${q.number} は複数選択なので、入力の別解は書けない`)
    q.answer = a.answer
    q.explanation = a.explanation
    if (a.alt.length) q.inputAlt = a.alt
  }

  const declared = md.match(/全(\d+)問/)
  if (declared && Number(declared[1]) !== questions.length) {
    throw new Error(`${source}: 宣言は全${declared[1]}問、抽出は${questions.length}問`)
  }
  const numbers = new Set(questions.map((q) => q.number))
  if (numbers.size !== questions.length) throw new Error(`${source}: 問番号が重複`)

  return questions
}
