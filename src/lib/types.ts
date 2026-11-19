export interface Choice {
  key: string
  text: string
}

export interface Question {
  /** 履歴のキー。例: ccna-1.0-q12 */
  id: string
  /** 画面と Markdown に表示する問題 ID。例: CCNA-1.0-012 */
  code: string
  exam: string
  /** 例: 1.0 */
  domain: string
  domainTitle: string
  section: string
  number: number
  /** Markdown(コードブロック、インラインコード、太字) */
  stem: string
  choices: Choice[]
  /** 正解の選択肢キー。複数選択問題は 2 つ以上 */
  answer: string[]
  explanation: string
  /** 入力問題。answer に入力として認める答えが入る */
  kind?: 'input'
  /** 問題の区分。例: ['CKA'](試験の範囲)、['実務'](試験の外の実務の知識) */
  tags?: string[]
  /** 選択肢を並べ替えたときの、表示上の記号 → 元の記号 */
  keyMap?: Record<string, string>
}

export interface Attempt {
  id?: number
  questionId: string
  ts: number
  chosen: string[]
  correct: boolean
  ms: number
  mode: 'study' | 'exam'
}

export interface Card {
  questionId: string
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  due: number
  last: number
}

export interface DrillAttempt {
  id?: number
  type: string
  ts: number
  correct: boolean
  ms: number
}
