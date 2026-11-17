import { useRef, useState } from 'react'
import { DRILLS } from '../lib/drills'
import { accuracy, type DomainStat, type SectionStat } from '../lib/stats'
import type { DrillAttempt } from '../lib/types'

interface Props {
  stats: DomainStat[]
  drills: DrillAttempt[]
  onPractice: (domainKey: string, section: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

function Row({ s, sub, onPractice }: { s: SectionStat; sub?: boolean; onPractice?: () => void }) {
  const acc = accuracy(s)
  return (
    <tr className={sub ? 'sub' : 'domain'}>
      <th scope="row">{s.label}</th>
      <td>
        {s.seen} / {s.total}
      </td>
      <td>
        <span className="meter" aria-hidden="true">
          <span style={{ width: `${(acc ?? 0) * 100}%` }} className={acc !== null && acc < 0.7 ? 'low' : ''} />
        </span>
        {pct(acc)}
      </td>
      <td>{s.attempts}</td>
      <td>{s.due}</td>
      <td>
        {s.weak}
        {onPractice && s.weak > 0 && (
          <button className="link" onClick={onPractice}>
            解く
          </button>
        )}
      </td>
    </tr>
  )
}

export function StatsView({ stats, drills, onPractice, onExport, onImport, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  return (
    <section className="card">
      <h2>成績</h2>
      <div className="scroll">
        <table className="stats">
          <thead>
            <tr>
              <th>分野</th>
              <th>着手</th>
              <th>正答率</th>
              <th>解答数</th>
              <th>復習待ち</th>
              <th>要復習</th>
            </tr>
          </thead>
          <tbody>
            {stats.flatMap((d) => [
              <Row key={d.key} s={d} />,
              ...d.sections.map((s) => (
                <Row key={`${d.key}/${s.key}`} s={s} sub onPractice={() => onPractice(d.key, s.key)} />
              )),
            ])}
          </tbody>
        </table>
      </div>

      <h3>計算ドリル</h3>
      <table className="stats">
        <thead>
          <tr>
            <th>種類</th>
            <th>正答率</th>
            <th>解答数</th>
          </tr>
        </thead>
        <tbody>
          {DRILLS.map((k) => {
            const xs = drills.filter((a) => a.type === k.type)
            return (
              <tr key={k.type} className="sub">
                <th scope="row">
                  {k.group}: {k.label}
                </th>
                <td>{pct(accuracy({ attempts: xs.length, correct: xs.filter((a) => a.correct).length }))}</td>
                <td>{xs.length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3>履歴データ</h3>
      <p className="meta">履歴はこのブラウザの IndexedDB にだけ保存される。別の PC やブラウザへ移すにはエクスポートを使う。</p>
      <div className="actions">
        <button onClick={onExport}>エクスポート(JSON)</button>
        <button onClick={() => file.current?.click()}>インポート(置き換え)</button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
        {!confirming && <button onClick={() => setConfirming(true)}>履歴を消去</button>}
        {confirming && (
          <>
            <button
              className="danger"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
            >
              すべて消去する
            </button>
            <button onClick={() => setConfirming(false)}>やめる</button>
          </>
        )}
      </div>
    </section>
  )
}
