import { useState } from 'react'
import { loadShufflePref, saveShufflePref } from '../lib/shuffle'
import { groupByExam, type DomainStat } from '../lib/stats'

export interface StartOptions {
  kind: 'study' | 'random' | 'exam' | 'weak'
  domains: string[]
  size: number
}

interface Props {
  stats: DomainStat[]
  onStart: (o: StartOptions) => void
}

const KEY = 'sre-drill:scope'

function loadScope(all: string[]): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown
    if (Array.isArray(saved)) {
      const valid = saved.filter((k): k is string => typeof k === 'string' && all.includes(k))
      if (valid.length) return valid
    }
  } catch {
    // 保存値が読めなければ全分野にする
  }
  return all
}

export function Home({ stats, onStart }: Props) {
  const all = stats.map((d) => d.key)
  const [domains, setDomains] = useState<string[]>(() => loadScope(all))
  const [size, setSize] = useState(10)
  const [shuffleOn, setShuffleOn] = useState(loadShufflePref)

  const update = (next: string[]) => {
    setDomains(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // 保存できなくても動作に支障はない
    }
  }

  const picked = stats.filter((d) => domains.includes(d.key))
  const total = picked.reduce((n, d) => n + d.total, 0)
  const due = picked.reduce((n, d) => n + d.due, 0)
  const unseen = picked.reduce((n, d) => n + d.total - d.seen, 0)
  const weak = picked.reduce((n, d) => n + d.weak, 0)
  const none = domains.length === 0

  return (
    <section className="card">
      <h2>出題範囲</h2>
      {groupByExam(stats).map((g) => {
        const keys = g.domains.map((d) => d.key)
        const on = keys.filter((k) => domains.includes(k)).length
        return (
          <fieldset key={g.key} className="exam-group">
            <legend>
              <label>
                <input
                  type="checkbox"
                  checked={on === keys.length}
                  ref={(el) => {
                    if (el) el.indeterminate = on > 0 && on < keys.length
                  }}
                  onChange={(e) =>
                    update(e.target.checked ? [...new Set([...domains, ...keys])] : domains.filter((k) => !keys.includes(k)))
                  }
                />
                {g.label}
              </label>
              <span className="meta">
                {g.total} 問 ・ 要復習 {g.weak}
              </span>
            </legend>
            <ul className="plain scope">
              {g.domains.map((d) => (
                <li key={d.key}>
                  <label>
                    <input
                      type="checkbox"
                      checked={domains.includes(d.key)}
                      onChange={(e) =>
                        update(e.target.checked ? [...domains, d.key] : domains.filter((k) => k !== d.key))
                      }
                    />
                    <span>{d.shortLabel}</span>
                    <span className="meta">
                      {d.total} 問 ・ 復習待ち {d.due} ・ 未出題 {d.total - d.seen} ・ 要復習 {d.weak}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )
      })}

      <label className="inline">
        問題数
        <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {[5, 10, 20, 40].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="inline">
        <input
          type="checkbox"
          checked={shuffleOn}
          onChange={(e) => {
            setShuffleOn(e.target.checked)
            saveShufflePref(e.target.checked)
          }}
        />
        選択肢の並びを毎回入れ替える
      </label>

      <p className="meta">
        選択中: {total} 問 ・ 復習待ち {due} ・ 未出題 {unseen} ・ 要復習 {weak}
      </p>

      <div className="actions">
        <button className="primary" disabled={none || due + unseen === 0} onClick={() => onStart({ kind: 'study', domains, size })}>
          学習(復習待ち → 未出題)
        </button>
        <button disabled={none || weak === 0} onClick={() => onStart({ kind: 'weak', domains, size })}>
          間違えた問題({weak})
        </button>
        <button disabled={none} onClick={() => onStart({ kind: 'random', domains, size })}>
          ランダム
        </button>
        <button disabled={none} onClick={() => onStart({ kind: 'exam', domains, size })}>
          模擬試験(1 問 90 秒)
        </button>
      </div>
      <p className="meta">要復習: 直近で間違えた問題と、2 回以上解いて正答率が 70% 未満の問題。</p>
      {!none && due + unseen === 0 && (
        <p className="meta">復習待ちも未出題もない。次の復習期限まで待つか、ランダムで解く。</p>
      )}
    </section>
  )
}
