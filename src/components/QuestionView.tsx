import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { Md, inline } from './Md'
import { SectionText } from './SectionText'
import { toggleChoice } from './useChoiceKeys'

interface Props {
  q: Question
  chosen: string[]
  onChange: (chosen: string[]) => void
  /** true で正誤と解説を表示し、選択を固定する */
  revealed: boolean
  /** 入力問題で Enter を押したとき */
  onEnter?: () => void
}

export function QuestionView({ q, chosen, onChange, revealed, onEnter }: Props) {
  const input = q.kind === 'input'
  const multi = !input && q.answer.length > 1
  const toggle = (key: string) => {
    if (revealed) return
    onChange(toggleChoice(q, chosen, key))
  }

  return (
    <div>
      <div className="qmeta">
        <span className="qcode">{q.code}</span>
        {q.tags?.map((t) => (
          <span key={t} className={`qtag ${t === 'CKA' ? 'exam' : 'work'}`}>{t}</span>
        ))}
        <span className="qsection">{q.section}</span>
        {multi && <span className="qhint">{q.answer.length} つ選ぶ</span>}
        {input && <span className="qhint">入力して答える</span>}
      </div>
      <Md text={q.stem} />
      {input && (
        <input
          type="text"
          className={['answer-input', revealed && (isCorrect(q, chosen) ? 'right' : 'wrong')].filter(Boolean).join(' ')}
          aria-label="答え"
          placeholder="答えを入力"
          autoFocus={!revealed}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={revealed}
          value={chosen[0] ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? [] : [e.target.value])}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) onEnter?.()
          }}
        />
      )}
      <ul className="choices">
        {q.choices.map((c) => {
          const picked = chosen.includes(c.key)
          const right = q.answer.includes(c.key)
          const cls = ['choice', picked && 'picked', revealed && right && 'right', revealed && picked && !right && 'wrong']
            .filter(Boolean)
            .join(' ')
          return (
            <li key={c.key}>
              <button type="button" className={cls} aria-pressed={picked} disabled={revealed} onClick={() => toggle(c.key)}>
                <span className="key">{c.key}</span>
                <span>{inline(c.text)}</span>
                {revealed && right && <span className="mark">正解</span>}
                {revealed && picked && !right && <span className="mark">選択</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {revealed && (
        <div className={`verdict ${isCorrect(q, chosen) ? 'ok' : 'ng'}`}>
          <p className="verdict-head">
            <span className="verdict-word">{isCorrect(q, chosen) ? '正解' : '不正解'}</span>
            {input && <span>正解は {q.answer.map((a, i) => <code key={i}>{a}</code>)}</span>}
          </p>
          {!input && (
            // 画面が解説まで送られて選択肢が見えなくても、自分の答えと正解が分かるように、本文も出す
            <dl className="verdict-answers">
              {!isCorrect(q, chosen) && (
                <div>
                  <dt>あなたの答え</dt>
                  <dd>{chosen.length > 0 ? choiceLines(q, chosen) : '(未解答)'}</dd>
                </div>
              )}
              <div>
                <dt>{isCorrect(q, chosen) ? '答え' : '正解'}</dt>
                <dd>{choiceLines(q, q.answer)}</dd>
              </div>
            </dl>
          )}
          {input && !isCorrect(q, chosen) && <p className="meta">あなたの入力: {chosen[0] ? <code>{chosen[0]}</code> : '(未入力)'}</p>}
          <div className="explain">
            <Md text={q.explanation} link={{ exam: q.exam }} />
          </div>
        </div>
      )}
      {revealed && <SectionText key={q.id} q={q} />}
    </div>
  )
}

/** 選択肢の記号と本文を、1 つずつ行に並べる */
function choiceLines(q: Question, keys: readonly string[]) {
  return keys.map((k) => (
    <span key={k} className="verdict-choice">
      <span className="key">{k}</span>
      <span>{inline(q.choices.find((c) => c.key === k)?.text ?? '')}</span>
    </span>
  ))
}
