import { useEffect, useEffectEvent, useState } from 'react'
import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { QuestionView } from './QuestionView'
import { useChoiceKeys } from './useChoiceKeys'

interface Props {
  questions: Question[]
  /** 制限時間(秒) */
  seconds: number
  onFinish: (answers: Map<string, string[]>, elapsedMs: number) => void
  onExit: () => void
  /** 結果の画面から、間違えた問題を問題演習で解き直す */
  onRetry: (questions: Question[]) => void
  /** 解いている間は true。画面を離れる前に確かめるために使う */
  onActive: (active: boolean) => void
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Exam({ questions, seconds, onFinish, onExit, onRetry, onActive }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map())
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)
  const [aborting, setAborting] = useState(false)

  useEffect(() => {
    onActive(!done)
    return () => onActive(false)
    // onActive は App の ref を書くだけなので、done の変化だけを見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])
  const abort = () => {
    onActive(false)
    onExit()
  }

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

  // 問題を移ったら、問題文の先頭から読めるようにする。提出したら結果の先頭を出す
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [idx, done])

  const current = questions[idx]
  useChoiceKeys({
    q: current,
    chosen: answers.get(current.id) ?? [],
    onChange: (c) => setAnswers((m) => new Map(m).set(current.id, c)),
    onPrev: done ? undefined : () => setIdx((i) => Math.max(0, i - 1)),
    onNext: done ? undefined : () => setIdx((i) => Math.min(questions.length - 1, i + 1)),
    selectable: !done,
  })

  if (done) {
    const right = questions.filter((q) => isCorrect(q, answers.get(q.id) ?? []))
    const wrong = questions.filter((q) => !right.includes(q))
    const actions = (
      <div className="actions">
        {wrong.length > 0 && (
          <button className="primary" onClick={() => onRetry(wrong)}>
            間違えた {wrong.length} 問を問題演習で解き直す
          </button>
        )}
        <button className={wrong.length > 0 ? '' : 'primary'} onClick={onExit}>
          問題演習に戻る
        </button>
      </div>
    )
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
        {actions}
        <h3>解答と解説</h3>
        {questions.map((q) => (
          <div key={q.id} className="review">
            <QuestionView q={q} chosen={answers.get(q.id) ?? []} onChange={() => {}} revealed />
          </div>
        ))}
        {actions}
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
        <button className="link" disabled={aborting} onClick={() => setAborting(true)}>
          中止(記録しない)
        </button>
      </div>
      {aborting && (
        <p className="confirm">
          答えを捨てて中止しますか。
          <button className="danger" onClick={abort}>
            中止する
          </button>
          <button onClick={() => setAborting(false)}>続ける</button>
        </p>
      )}
      <QuestionView
        key={q.id}
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
