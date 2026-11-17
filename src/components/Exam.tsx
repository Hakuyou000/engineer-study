import { useEffect, useEffectEvent, useState } from 'react'
import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { QuestionView } from './QuestionView'

interface Props {
  questions: Question[]
  /** 制限時間(秒) */
  seconds: number
  onFinish: (answers: Map<string, string[]>, elapsedMs: number) => void
  onExit: () => void
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Exam({ questions, seconds, onFinish, onExit }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map())
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)

  const finish = () => {
    if (done) return
    setDone(true)
    onFinish(answers, (seconds - remaining) * 1000)
  }

  // 毎秒の更新。0 になったら自動で提出する
  const tick = useEffectEvent(() => {
    if (remaining <= 1) {
      setRemaining(0)
      finish()
    } else {
      setRemaining(remaining - 1)
    }
  })
  useEffect(() => {
    if (done) return
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [done])

  if (done) {
    const right = questions.filter((q) => isCorrect(q, answers.get(q.id) ?? []))
    const domains = [...new Set(questions.map((q) => `${q.exam} ${q.domain} ${q.domainTitle}`))]
    return (
      <section className="card">
        <h2>結果</h2>
        <p className="big">
          {right.length} / {questions.length} 問正解({Math.round((right.length / questions.length) * 100)}%)
        </p>
        <ul className="plain">
          {domains.map((d) => {
            const qs = questions.filter((q) => `${q.exam} ${q.domain} ${q.domainTitle}` === d)
            return (
              <li key={d}>
                {d}: {qs.filter((q) => right.includes(q)).length} / {qs.length}
              </li>
            )
          })}
        </ul>
        <button className="primary" onClick={onExit}>
          戻る
        </button>
        <h3>解答と解説</h3>
        {questions.map((q) => (
          <div key={q.id} className="review">
            <QuestionView q={q} chosen={answers.get(q.id) ?? []} onChange={() => {}} revealed />
          </div>
        ))}
      </section>
    )
  }

  const q = questions[idx]
  const answered = (x: Question) => (answers.get(x.id)?.length ?? 0) > 0

  return (
    <section className="card">
      <div className="bar">
        <span>
          {idx + 1} / {questions.length}
        </span>
        <span className={remaining < 60 ? 'timer low' : 'timer'}>残り {mmss(remaining)}</span>
        <button className="link" onClick={onExit}>
          中止(記録しない)
        </button>
      </div>
      <QuestionView
        q={q}
        chosen={answers.get(q.id) ?? []}
        onChange={(c) => setAnswers((m) => new Map(m).set(q.id, c))}
        revealed={false}
      />
      <div className="actions">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          前へ
        </button>
        <button disabled={idx === questions.length - 1} onClick={() => setIdx(idx + 1)}>
          次へ
        </button>
        <button className="primary" onClick={finish}>
          提出する(未解答 {questions.filter((x) => !answered(x)).length})
        </button>
      </div>
      <div className="grid">
        {questions.map((x, i) => (
          <button
            key={x.id}
            className={['cell', i === idx && 'cur', answered(x) && 'ans'].filter(Boolean).join(' ')}
            onClick={() => setIdx(i)}
            aria-label={`問題 ${i + 1}${answered(x) ? '(解答済み)' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </section>
  )
}
