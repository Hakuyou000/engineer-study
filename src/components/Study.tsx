import { useEffect, useRef, useState } from 'react'
import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { QuestionView } from './QuestionView'
import { useChoiceKeys } from './useChoiceKeys'

interface Props {
  questions: Question[]
  onAnswer: (q: Question, chosen: string[], ms: number) => void
  /** 直前の正答を「自信なし」に格下げする */
  onHard: (q: Question) => void
  onExit: () => void
  /** 終わった後に、選んだ問題をもう一度解く */
  onRetry: (questions: Question[]) => void
  /** 途中から再開するとき、すでに解いた問題の結果 */
  resumed?: ('ok' | 'ng')[]
  /** 1 問解くたびに、それまでの結果を知らせる(途中で離れても再開できるように) */
  onProgress?: (results: ('ok' | 'ng')[]) => void
}

export function Study({ questions, onAnswer, onHard, onExit, onRetry, resumed = [], onProgress }: Props) {
  const [idx, setIdx] = useState(resumed.length)
  const [chosen, setChosen] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(() => resumed.filter((r) => r === 'ok').length)
  const [results, setResults] = useState<('ok' | 'ng')[]>(resumed)
  const startedAt = useRef(0)

  // 次の問題は、問題文の先頭から読めるようにする
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [idx])

  const finished = idx >= questions.length
  const q = finished ? null : questions[idx]
  const ready = !q ? false : q.kind === 'input' ? (chosen[0] ?? '').trim() !== '' : chosen.length === q.answer.length

  const select = (c: string[]) => {
    if (startedAt.current === 0) startedAt.current = Date.now()
    setChosen(c)
  }
  const submit = () => {
    if (!q) return
    const ms = startedAt.current ? Date.now() - startedAt.current : 0
    const ok = isCorrect(q, chosen)
    if (ok) setScore((s) => s + 1)
    const nextResults: ('ok' | 'ng')[] = [...results, ok ? 'ok' : 'ng']
    setResults(nextResults)
    onAnswer(q, chosen, ms)
    onProgress?.(nextResults)
    setRevealed(true)
    // 正誤と解説が画面の下に隠れていれば、見える位置まで送る
    requestAnimationFrame(() => {
      const v = document.querySelector('.verdict')
      if (v && v.getBoundingClientRect().top > window.innerHeight * 0.5) v.scrollIntoView({ block: 'start' })
    })
  }
  const next = () => {
    startedAt.current = 0
    setChosen([])
    setRevealed(false)
    setIdx((i) => i + 1)
  }
  const enter = () => {
    if (!revealed && ready) submit()
    else if (revealed) next()
  }

  useChoiceKeys({ q: q ?? questions[0], chosen, onChange: select, onEnter: finished ? undefined : enter, selectable: !finished && !revealed })

  if (!q) {
    const wrong = questions.filter((_, i) => results[i] === 'ng')
    return (
      <section className="page">
        <div className="page-head">
          <h2>おつかれさまでした</h2>
        </div>
        <Progress results={results} total={questions.length} current={-1} />
        <p className="result-score">
          <strong>{score}</strong> / {questions.length} 問正解
        </p>
        {wrong.length > 0 && (
          <>
            <h3 className="section-title">間違えた問題</h3>
            <ul className="plain wrong-list">
              {wrong.map((w) => (
                <li key={w.id}>
                  <span className="qcode">{w.code}</span> {w.section}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="actions">
          {wrong.length > 0 && (
            <button className="primary" onClick={() => onRetry(wrong)}>
              間違えた {wrong.length} 問をもう一度解く
            </button>
          )}
          <button className={wrong.length > 0 ? '' : 'primary'} onClick={onExit}>
            問題演習に戻る
          </button>
        </div>
      </section>
    )
  }

  const correct = revealed && isCorrect(q, chosen)

  return (
    <section className="page question-page">
      <div className="bar">
        <span className="count-label">
          {idx + 1} / {questions.length} 問目
        </span>
        <span className="meta">やめるときは上の「‹ 戻る」。解いた分は記録済みです</span>
      </div>
      <Progress results={results} total={questions.length} current={idx} />
      <QuestionView
        key={q.id}
        q={q}
        chosen={chosen}
        onChange={select}
        revealed={revealed}
        onEnter={enter}
      />
      <div className="actions sticky-actions">
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
      <p className="key-hint meta">
        {q.kind === 'input'
          ? `キーボード: 答えを入力して Enter で${revealed ? '次へ' : '解答'}`
          : `キーボード: 1〜${q.choices.length} か A〜${q.choices[q.choices.length - 1]?.key} で選び、Enter で${revealed ? '次へ' : '解答'}`}
      </p>
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
