import { useRef, useState } from 'react'
import { checkField, drillsFor, type Drill } from '../lib/drills'
import { inline, Md } from './Md'

interface Props {
  /** 表示する試験。null ならすべて */
  exam: string | null
  onRecord: (type: string, correct: boolean, ms: number) => void
}

export function DrillView({ exam, onRecord }: Props) {
  const DRILLS = drillsFor(exam)
  const [enabled, setEnabled] = useState<string[]>(() => DRILLS.map((d) => d.type))
  const [drill, setDrill] = useState<Drill | null>(null)
  const [inputs, setInputs] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [tally, setTally] = useState({ n: 0, ok: 0 })
  const startedAt = useRef(0)

  const next = () => {
    const kinds = DRILLS.filter((d) => enabled.includes(d.type))
    if (kinds.length === 0) return
    const d = kinds[Math.floor(Math.random() * kinds.length)].gen(Math.random)
    startedAt.current = Date.now()
    setDrill(d)
    setInputs(d.fields.map(() => ''))
    setChecked(false)
  }

  const results = drill ? drill.fields.map((f, i) => checkField(f, inputs[i] ?? '')) : []
  const allOk = results.every(Boolean)

  const check = () => {
    if (!drill || checked) return
    setChecked(true)
    setTally((t) => ({ n: t.n + 1, ok: t.ok + (allOk ? 1 : 0) }))
    onRecord(drill.type, allOk, Date.now() - startedAt.current)
  }

  const groups = [...new Set(DRILLS.map((d) => d.group))]

  return (
    <section className="card">
      <h2>計算ドリル</h2>
      <div className="kinds">
        {groups.map((g) => (
          <fieldset key={g}>
            <legend>{g}</legend>
            {DRILLS.filter((d) => d.group === g).map((d) => (
              <label key={d.type}>
                <input
                  type="checkbox"
                  checked={enabled.includes(d.type)}
                  onChange={(e) =>
                    setEnabled(e.target.checked ? [...enabled, d.type] : enabled.filter((t) => t !== d.type))
                  }
                />
                {d.label}
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      {!drill && (
        <button className="primary" disabled={enabled.length === 0} onClick={next}>
          始める
        </button>
      )}

      {drill && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (checked) next()
            else check()
          }}
        >
          <div className="bar">
            <span>
              今回 {tally.ok} / {tally.n}
            </span>
          </div>
          <Md text={drill.prompt} />
          {drill.fields.map((f, i) => (
            <label key={`${drill.prompt}-${i}`} className="field">
              <span>{f.label}</span>
              <input
                type="text"
                autoFocus={i === 0}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                readOnly={checked}
                value={inputs[i] ?? ''}
                onChange={(e) => setInputs(inputs.map((v, j) => (j === i ? e.target.value : v)))}
                className={checked ? (results[i] ? 'right' : 'wrong') : ''}
              />
              {checked && !results[i] && (
                <span className="correct">
                  正解: <code>{f.answer}</code>
                </span>
              )}
            </label>
          ))}
          {checked && (
            <div className={`verdict ${allOk ? 'ok' : 'ng'}`}>
              <strong>{allOk ? '正解' : '不正解'}</strong>
              <p>{inline(drill.explain)}</p>
            </div>
          )}
          <div className="actions">
            <button className="primary" type="submit" disabled={enabled.length === 0 && checked}>
              {checked ? '次の問題' : '判定する'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
