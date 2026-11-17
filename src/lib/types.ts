export interface Choice {
  key: string
  text: string
}

export interface Question {
  /** 例: ccna-1.0-q12 */
  id: string
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
