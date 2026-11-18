import { useState } from 'react'
import { INTRO, NON_TECH, NOTE, OPTIONAL_CERTS, STAGES, loadChecked, saveChecked } from '../lib/roadmap'
import { accuracy, type ExamStat } from '../lib/stats'

interface Props {
  groups: ExamStat[]
  onOpen: (exam: string) => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

/** SRE を目指す学習の段階と、やることのチェックリスト。 */
export function RoadmapView({ groups, onOpen }: Props) {
  const [checked, setChecked] = useState(loadChecked)

  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
    saveChecked(next)
  }

  const total = STAGES.reduce((n, s) => n + s.items.length, 0)
  const done = STAGES.reduce((n, s) => n + s.items.filter((i) => checked.has(i.id)).length, 0)

  return (
    <section className="card">
      <h2>ロードマップ</h2>
      {INTRO.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p className="meta">
        全体の進み具合: {done} / {total}
      </p>
      <progress className="roadmap-bar" max={total} value={done} />

      {STAGES.map((s) => {
        const n = s.items.filter((i) => checked.has(i.id)).length
        return (
          <div key={s.id} className={n === s.items.length ? 'toc-item stage done' : 'toc-item stage'}>
            <h3>
              {s.title}
              <span className="meta"> {n} / {s.items.length}</span>
            </h3>
            <p>{s.summary}</p>
            <ul className="plain roadmap-items">
              {s.items.map((i) => (
                <li key={i.id}>
                  <label>
                    <input type="checkbox" checked={checked.has(i.id)} onChange={() => toggle(i.id)} />
                    {i.label}
                  </label>
                  {i.detail && <div className="meta">{i.detail}</div>}
                </li>
              ))}
            </ul>

            <h4>資格</h4>
            <ul className="roadmap-list">
              {s.certs.map((c) => {
                const g = c.exam ? groups.find((x) => x.key === c.exam) : undefined
                return (
                  <li key={c.name}>
                    <strong>{c.name}</strong>: {c.note}
                    {g && (
                      <div className="inline roadmap-app">
                        <span className="meta">
                          このアプリ: {g.seen} / {g.total} 問に着手 ・ 正答率 {pct(accuracy(g))}
                        </span>
                        <button onClick={() => onOpen(g.key)}>問題演習を開く</button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <h4>おすすめの本</h4>
            <ul className="roadmap-list">
              {s.books.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            <p className="meta">この段階で作るもの: {s.output}</p>
          </div>
        )
      })}

      <h3>必要に応じて取る資格</h3>
      <ul className="roadmap-list">
        {OPTIONAL_CERTS.map((c) => (
          <li key={c.name}>
            <strong>{c.name}</strong>: {c.note}
          </li>
        ))}
      </ul>

      <h3>技術以外に必要なこと</h3>
      <ul className="roadmap-list">
        {NON_TECH.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <p className="meta">{NOTE}</p>
    </section>
  )
}
