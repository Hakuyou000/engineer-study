import { CERTS } from '../lib/certs'
import { lampOf, LAMP_LABEL } from '../lib/lamp'
import { accuracy, examLabel, type ExamStat } from '../lib/stats'
import { LampLegend, Lamps } from './Lamps'

export type Section = 'home' | 'drill' | 'text' | 'stats'

interface Props {
  groups: ExamStat[]
  textCount: (exam: string) => number
  current: string | null
  onOpen: (exam: string | null, section: Section) => void
  onCert: (id: string) => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

/** 目次。試験を選び、問題演習・計算ドリル・テキスト・成績のどれを開くかを決める。 */
export function Toc({ groups, textCount, current, onOpen, onCert }: Props) {
  const certOf = (exam: string) => CERTS.find((c) => c.exams?.includes(exam))
  const actions = (exam: string | null) => {
    return (
      <div className="row-actions">
        {/* 塗りのボタンは 1 画面に 1 つ(DESIGN.md)。選んでいる試験だけ塗る */}
        <button className={exam === current ? 'primary' : ''} onClick={() => onOpen(exam, 'home')}>
          問題演習
        </button>
        <button className="quiet" onClick={() => onOpen(exam, 'drill')}>
          計算ドリル
        </button>
        <button className="quiet" onClick={() => onOpen(exam, 'text')}>
          テキスト
        </button>
        <button className="quiet" onClick={() => onOpen(exam, 'stats')}>
          成績
        </button>
      </div>
    )
  }

  return (
    <section className="page">
      <div className="page-head">
        <h2>目次</h2>
        <p className="lede">試験を選ぶと、問題演習、計算ドリル、テキスト、成績がその試験に絞られます。</p>
        <LampLegend />
      </div>

      <ul className="exam-list">
        {groups.map((g) => (
          <li key={g.key} className={g.key === current ? 'exam-row cur' : 'exam-row'}>
            <div className="exam-row-head">
              <h3>{examLabel(g.key)}</h3>
              {g.key === current && <span className="badge">選択中</span>}
              {certOf(g.key) && (
                <button className="link head-link" onClick={() => onCert(certOf(g.key)!.id)}>
                  資格の表紙
                </button>
              )}
            </div>
            <Lamps items={g.domains} label={`${examLabel(g.key)} の分野ごとの状態`} />
            <dl className="figures">
              <div>
                <dt>問題</dt>
                <dd>{g.total}</dd>
              </div>
              <div>
                <dt>着手</dt>
                <dd>{g.seen}</dd>
              </div>
              <div>
                <dt>正答率</dt>
                <dd>{pct(accuracy(g))}</dd>
              </div>
              <div>
                <dt>要復習</dt>
                <dd className={g.weak > 0 ? 'alert' : ''}>{g.weak}</dd>
              </div>
              <div>
                <dt>テキスト</dt>
                <dd>{textCount(g.key)}</dd>
              </div>
            </dl>
            <details className="domains">
              <summary>分野を見る({g.domains.length})</summary>
              <ul>
                {g.domains.map((d) => (
                  <li key={d.key}>
                    <span className={`lamp ${lampOf(d)}`} aria-hidden="true" />
                    <span className="domain-name">{d.shortLabel}</span>
                    <span className="domain-count">
                      {d.seen} / {d.total}
                      <span className="sr-only">問に着手、{LAMP_LABEL[lampOf(d)]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
            {actions(g.key)}
          </li>
        ))}
        <li className={current === null ? 'exam-row all cur' : 'exam-row all'}>
          <div className="exam-row-head">
            <h3>すべての試験</h3>
            {current === null && <span className="badge">選択中</span>}
          </div>
          <p className="lede">すべての試験から出題し、成績もまとめて表示します。</p>
          {actions(null)}
        </li>
      </ul>
    </section>
  )
}
