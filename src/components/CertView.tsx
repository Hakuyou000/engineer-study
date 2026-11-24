import { useEffect } from 'react'
import type { Cert } from '../lib/certs'
import { stageOfCert } from '../lib/roadmap'
import { accuracy, examLabel, type ExamStat } from '../lib/stats'
import type { Section } from './Toc'

interface Props {
  cert: Cert
  /** アプリで学べる試験の成績。1 つの資格に試験が複数あれば、その数だけ */
  stats: ExamStat[]
  onOpen: (exam: string, section: Section) => void
  /** ロードマップに戻る。段階を指定すると、その段階を表示する */
  onRoadmap: (stage: string | null) => void
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

/** 資格の表紙。試験の概要、出題範囲、勉強の進め方、このアプリでの学び方をまとめる。 */
export function CertView({ cert, stats, onOpen, onRoadmap }: Props) {
  const stage = stageOfCert(cert.id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [cert.id])

  return (
    <section className="card cert">
      <p className="meta cert-issuer">{cert.issuer}</p>
      <h2 className="cert-title">{cert.name}</h2>
      <p>{cert.summary}</p>
      <p className="meta">
        ロードマップ:{' '}
        <button className="link accent" onClick={() => onRoadmap(stage?.id ?? null)}>
          {stage ? stage.title : '必要に応じて取る資格'}
        </button>
      </p>

      {stats.map((stat, i) => (
        <div key={stat.key} className="cert-app">
          <h3>このアプリで学ぶ{stats.length > 1 ? `: ${examLabel(stat.key)}` : ''}</h3>
          <p className="meta">
            {stat.domains.length} 分野 ・ {stat.total} 問 ・ 着手 {stat.seen} ・ 正答率 {pct(accuracy(stat))} ・ 要復習 {stat.weak}
          </p>
          <progress className="roadmap-bar" max={stat.total} value={stat.seen} />
          <div className="actions">
            {/* 塗りのボタンは 1 画面に 1 つ(DESIGN.md)。最初の試験だけ塗る */}
            <button className={i === 0 ? 'primary' : ''} onClick={() => onOpen(stat.key, 'home')}>
              問題演習
            </button>
            <button onClick={() => onOpen(stat.key, 'text')}>テキスト</button>
            <button onClick={() => onOpen(stat.key, 'drill')}>計算ドリル</button>
            <button onClick={() => onOpen(stat.key, 'stats')}>成績</button>
          </div>
        </div>
      ))}

      <h3>試験の概要</h3>
      <table className="cert-facts">
        <tbody>
          {cert.facts.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {cert.domains && (
        <>
          <h3>出題範囲</h3>
          <ul className="plain cert-domains">
            {cert.domains.map((d) => (
              <li key={d.name}>
                <span>{d.name}</span>
                {d.weight !== undefined && (
                  <>
                    <span className="cert-weight">{d.weight}%</span>
                    <span className="cert-bar" style={{ width: `${d.weight * 2}%` }} />
                  </>
                )}
              </li>
            ))}
          </ul>
          {cert.domainsNote && <p className="meta">{cert.domainsNote}</p>}
        </>
      )}

      <h3>勉強の進め方</h3>
      <ul className="roadmap-list">
        {cert.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h3>公式サイト</h3>
      <p>
        <a href={cert.official.url} target="_blank" rel="noreferrer">
          {cert.official.label}
        </a>
      </p>
      <p className="meta">試験の内容や受験料は改定されることがあります。申し込む前に公式サイトで確認してください。</p>
    </section>
  )
}
