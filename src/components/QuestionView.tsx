import { isCorrect } from '../lib/srs'
import type { Question } from '../lib/types'
import { Md, inline } from './Md'
import { SectionText } from './SectionText'

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
    if (!multi) onChange([key])
    else onChange(chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key].sort())
  }

  return (
    <div>
      <div className="meta">
        <span className="qcode">{q.code}</span> ・ {q.section}
        {multi && ` ・ ${q.answer.length} つ選択`}
        {input && ' ・ 入力'}
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
          <strong>
            {isCorrect(q, chosen) ? '正解' : '不正解'}(正解: {input ? q.answer.join(' / ') : q.answer.join('、')})
          </strong>
          {input && !isCorrect(q, chosen) && <p>入力: {chosen[0] ? <code>{chosen[0]}</code> : '(未入力)'}</p>}
          <p>{inline(q.explanation)}</p>
        </div>
      )}
      {revealed && <SectionText key={q.id} q={q} />}
    </div>
  )
}
