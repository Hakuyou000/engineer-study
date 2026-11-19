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
  const [results, setResults] = useState<('ok' | 'ng')[]>([])
  const startedAt = useRef(0)

  if (idx >= questions.length) {
    return (
      <section className="page">
        <div className="page-head">
          <h2>おつかれさまでした</h2>
        </div>
        <Progress results={results} total={questions.length} current={-1} />
        <p className="result-score">
          <strong>{score}</strong> / {questions.length} 問正解
        </p>
        <button className="primary" onClick={onExit}>
          戻る
        </button>
      </section>
    )
  }

  const q = questions[idx]
  const ready = q.kind === 'input' ? (chosen[0] ?? '').trim() !== '' : chosen.length === q.answer.length
  const correct = revealed && isCorrect(q, chosen)

  const select = (c: string[]) => {
    if (startedAt.current === 0) startedAt.current = Date.now()
    setChosen(c)
  }
  const submit = () => {
    const ms = startedAt.current ? Date.now() - startedAt.current : 0
    const ok = isCorrect(q, chosen)
    if (ok) setScore((s) => s + 1)
    setResults((r) => [...r, ok ? 'ok' : 'ng'])
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
    <section className="page question-page">
      <div className="bar">
        <span className="count-label">
          {idx + 1} / {questions.length} 問目
        </span>
        <button className="link" onClick={onExit}>
          中断して戻る
        </button>
      </div>
      <Progress results={results} total={questions.length} current={idx} />
      <QuestionView
        key={q.id}
        q={q}
        chosen={chosen}
        onChange={select}
        revealed={revealed}
        onEnter={() => {
          if (!revealed && ready) submit()
          else if (revealed) next()
        }}
      />
      <div className={revealed ? 'actions sticky-actions' : 'actions sticky-actions pending'}>
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

/** 問題ごとの結果のランプ。正解は緑、不正解は赤、今の問題は枠で示す */
function Progress({ results, total, current }: { results: ('ok' | 'ng')[]; total: number; current: number }) {
  return (
    <ol className="progress" aria-label={`${total} 問中 ${results.length} 問解答済み`}>
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={['lamp', results[i] === 'ok' ? 'solid' : results[i] === 'ng' ? 'weak' : 'off', i === current && 'now'].filter(Boolean).join(' ')} />
      ))}
    </ol>
  )
}
