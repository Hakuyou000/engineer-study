import { accuracy, examLabel, type ExamStat } from '../lib/stats'

export type Section = 'home' | 'drill' | 'text' | 'stats'

interface Props {
  groups: ExamStat[]
  textCount: (exam: string) => number
  current: string | null
  onOpen: (exam: string | null, section: Section) => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

/** 目次。試験を選び、問題演習・計算ドリル・テキスト・成績のどれを開くかを決める。 */
export function Toc({ groups, textCount, current, onOpen }: Props) {
  const links = (exam: string | null) => (
    <div className="actions">
      <button className="primary" onClick={() => onOpen(exam, 'home')}>
        問題演習
      </button>
      <button onClick={() => onOpen(exam, 'drill')}>計算ドリル</button>
      <button onClick={() => onOpen(exam, 'text')}>テキスト</button>
      <button onClick={() => onOpen(exam, 'stats')}>成績</button>
    </div>
  )

  return (
    <section className="card">
      <h2>目次</h2>
      <ul className="plain toc-list">
        {groups.map((g) => (
          <li key={g.key} className={g.key === current ? 'toc-item cur' : 'toc-item'}>
            <h3>{examLabel(g.key)}</h3>
            <p className="meta">
              {g.domains.length} 分野 ・ {g.total} 問 ・ 着手 {g.seen} ・ 正答率 {pct(accuracy(g))} ・ 要復習 {g.weak} ・
              テキスト {textCount(g.key)} 本
            </p>
            <ul className="plain toc-domains">
              {g.domains.map((d) => (
                <li key={d.key}>{d.shortLabel}</li>
              ))}
            </ul>
            {links(g.key)}
          </li>
        ))}
        <li className={current === null ? 'toc-item cur' : 'toc-item'}>
          <h3>すべての試験</h3>
          <p className="meta">すべての試験から出題します。成績もまとめて表示します。</p>
          {links(null)}
        </li>
      </ul>
    </section>
  )
}
