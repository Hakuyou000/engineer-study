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
}

export function QuestionView({ q, chosen, onChange, revealed }: Props) {
  const multi = q.answer.length > 1
  const toggle = (key: string) => {
    if (revealed) return
    if (!multi) onChange([key])
    else onChange(chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key].sort())
  }

  return (
    <div>
      <div className="meta">
        {q.exam} {q.section} ・ 問{q.number}
        {multi && ` ・ ${q.answer.length} つ選択`}
      </div>
      <Md text={q.stem} />
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
            {isCorrect(q, chosen) ? '正解' : '不正解'}(正解: {q.answer.join('、')})
          </strong>
          <p>{inline(q.explanation)}</p>
        </div>
      )}
      {revealed && <SectionText key={q.id} q={q} />}
    </div>
  )
}
