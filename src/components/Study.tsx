import { useRef, useState } from 'react'
import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { QuestionView } from './QuestionView'

interface Props {
  questions: Question[]
  onAnswer: (q: Question, chosen: string[], ms: number) => void
  /** 直前の正答を「自信なし」に格下げする */
  onHard: (q: Question) => void
  onExit: () => void
}

export function Study({ questions, onAnswer, onHard, onExit }: Props) {
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const startedAt = useRef(0)

  if (idx >= questions.length) {
    return (
      <section className="card">
        <h2>終了</h2>
        <p className="big">
          {score} / {questions.length} 問正解
        </p>
        <button className="primary" onClick={onExit}>
          戻る
        </button>
      </section>
    )
  }

  const q = questions[idx]
  const ready = chosen.length === q.answer.length
  const correct = revealed && isCorrect(q, chosen)

  const select = (c: string[]) => {
    if (startedAt.current === 0) startedAt.current = Date.now()
    setChosen(c)
  }
  const submit = () => {
    const ms = startedAt.current ? Date.now() - startedAt.current : 0
    if (isCorrect(q, chosen)) setScore((s) => s + 1)
    onAnswer(q, chosen, ms)
    setRevealed(true)
  }
  const next = () => {
    startedAt.current = 0
    setChosen([])
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  return (
    <section className="card">
      <div className="bar">
        <span>
          {idx + 1} / {questions.length}
        </span>
        <button className="link" onClick={onExit}>
          中断
        </button>
      </div>
      <QuestionView q={q} chosen={chosen} onChange={select} revealed={revealed} />
      <div className="actions">
        {!revealed && (
          <button className="primary" disabled={!ready} onClick={submit}>
            解答する
          </button>
        )}
        {revealed && (
          <button className="primary" onClick={next}>
            次へ
          </button>
        )}
        {correct && (
          <button
            onClick={() => {
              onHard(q)
              next()
            }}
          >
            自信なし(早めに再出題)
          </button>
        )}
      </div>
    </section>
  )
}
