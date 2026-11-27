import { useEffect, useRef, useState } from 'react'
import * as db from '../lib/db'
import type { Flag } from '../lib/types'
import { drillsFor } from '../lib/drills'
import { accuracy, groupByExam, type DomainStat, type SectionStat } from '../lib/stats'
import type { DrillAttempt } from '../lib/types'
import { LampLegend, Lamps } from './Lamps'

interface Props {
  /** 表示中の試験。null ならすべて */
  exam: string | null
  stats: DomainStat[]
  drills: DrillAttempt[]
  onPractice: (domainKey: string, section: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

function Row({
  s,
  level,
  onPractice,
  open,
  onToggle,
}: {
  s: SectionStat
  level: 'exam' | 'domain' | 'sub'
  onPractice?: () => void
  open?: boolean
  onToggle?: () => void
}) {
  const acc = accuracy(s)
  return (
    <tr className={level}>
      <th scope="row">
        {onToggle ? (
          <button className="row-toggle" aria-expanded={open} onClick={onToggle}>
            <span className="caret" aria-hidden="true" />
            {s.label}
          </button>
        ) : (
          s.label
        )}
      </th>
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

/** 問題への指摘の一覧。解説の下の「この問題に指摘する」で付けたもの */
function FlagList() {
  const [flags, setFlags] = useState<Flag[]>([])
  useEffect(() => {
    let live = true
    db.loadFlags()
      .then((fs) => live && setFlags(fs.sort((a, b) => b.ts - a.ts)))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  const remove = (id: string) => void db.deleteFlag(id).then(() => setFlags((fs) => fs.filter((f) => f.questionId !== id)))

  return (
    <>
      <h3 className="section-title">問題への指摘({flags.length})</h3>
      <p className="note">
        解説の下の「この問題に指摘する」で付けた指摘です。エクスポートしたファイルに含まれます。直したら「消す」を押してください。
      </p>
      {flags.length > 0 && (
        <ul className="flag-list">
          {flags.map((f) => (
            <li key={f.questionId}>
              <span className="qcode">{f.code}</span> {f.kind}
              {f.note && `「${f.note}」`}
              <button type="button" className="link" onClick={() => remove(f.questionId)}>
                消す
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function StatsView({ exam, stats, drills, onPractice, onExport, onImport, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)
  // インポートは今の履歴を消すので、ファイルを選んだ後に確かめる
  const [pending, setPending] = useState<File | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  const groups = groupByExam(stats)
  const file = useRef<HTMLInputElement>(null)

  return (
    <section className="page">
      <div className="page-head">
        <h2>成績</h2>
        <LampLegend />
      </div>
      <ul className="stat-summary">
        {groups.map((g) => (
          <li key={g.key}>
            <h3>{g.label}</h3>
            <Lamps items={g.domains} label={`${g.label} の分野ごとの状態`} />
            <dl className="figures">
              <div>
                <dt>着手</dt>
                <dd>
                  {g.seen}
                  <small> / {g.total}</small>
                </dd>
              </div>
              <div>
                <dt>正答率</dt>
                <dd>{pct(accuracy(g))}</dd>
              </div>
              <div>
                <dt>解答数</dt>
                <dd>{g.attempts}</dd>
              </div>
              <div>
                <dt>要復習</dt>
                <dd className={g.weak > 0 ? 'alert' : ''}>{g.weak}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <h3 className="section-title">分野と小項目</h3>
      <p className="note">分野の名前を押すと、小項目が開きます。要復習のある小項目は「解く」から演習できます。</p>
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
            {groups.flatMap((g) => [
              <Row key={g.key} s={g} level="exam" />,
              ...g.domains.flatMap((d) => [
                <Row key={d.key} s={{ ...d, label: d.shortLabel }} level="domain" open={open.has(d.key)} onToggle={() => toggle(d.key)} />,
                ...(open.has(d.key) ? d.sections : []).map((s) => (
                  <Row key={`${d.key}/${s.key}`} s={s} level="sub" onPractice={() => onPractice(d.key, s.key)} />
                )),
              ]),
            ])}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">計算ドリル</h3>
      <table className="stats">
        <thead>
          <tr>
            <th>種類</th>
            <th>正答率</th>
            <th>解答数</th>
          </tr>
        </thead>
        <tbody>
          {drillsFor(exam).map((k) => {
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

      {/* インポートや消去で履歴が変わったら読み直す */}
      <FlagList key={`${drills.length}:${groups.reduce((s, g) => s + g.attempts, 0)}`} />

      <h3 className="section-title">履歴データ</h3>
      <p className="note">解答の履歴は、このブラウザの中(IndexedDB)にだけ保存されます。別の PC やブラウザに移すときは、エクスポートしたファイルをインポートしてください。</p>
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
            if (f) setPending(f)
            e.target.value = ''
          }}
        />
        {!confirming && <button onClick={() => setConfirming(true)}>履歴を消去</button>}
        {pending && (
          <p className="confirm-box">
            今の履歴をすべて消して、「{pending.name}」の内容に置き換えます。先にエクスポートしておくと、元に戻せます。
            <span className="actions">
              <button
                className="danger"
                onClick={() => {
                  onImport(pending)
                  setPending(null)
                }}
              >
                置き換える
              </button>
              <button onClick={() => setPending(null)}>やめる</button>
            </span>
          </p>
        )}
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
