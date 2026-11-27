import { useState } from 'react'
import { loadResume } from '../lib/resume'
import { loadShufflePref, saveShufflePref } from '../lib/shuffle'
import { LAMP_LABEL, lampOf } from '../lib/lamp'
import { groupByExam, type DomainStat } from '../lib/stats'

export interface StartOptions {
  kind: 'study' | 'random' | 'exam' | 'weak' | 'input'
  domains: string[]
  size: number
}

interface Props {
  /** 出題範囲の保存先を試験ごとに分けるための名前 */
  scopeKey: string
  stats: DomainStat[]
  /** 選択中の分野で、入力で解ける問題の数 */
  inputCount: (domains: string[]) => number
  onStart: (o: StartOptions) => void
  /** 「すべての試験」を選んでいるとき、試験を選ぶための一覧。1 つの試験を選んでいれば null */
  examChoices: { key: string; label: string }[] | null
  onPickExam: (exam: string) => void
  /** 途中で離れた問題演習を、続きから解く */
  onResume: () => void
  /** 問題 ID を指定して 1 問だけ解く。見つからなければ false */
  onOpenCode: (code: string) => boolean
}

const KEY = 'sre-drill:scope'

function loadScope(key: string, all: string[]): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as unknown
    if (Array.isArray(saved)) {
      const valid = saved.filter((k): k is string => typeof k === 'string' && all.includes(k))
      if (valid.length) return valid
    }
  } catch {
    // 保存値が読めなければ全分野にする
  }
  return all
}

export function Home({ scopeKey, stats, inputCount, onStart, examChoices, onPickExam, onResume, onOpenCode }: Props) {
  const [saved] = useState(loadResume)
  const resume = saved && { done: saved.results.length, total: saved.items.length, group: saved.group }
  const key = `${KEY}:${scopeKey}`
  const all = stats.map((d) => d.key)
  const [domains, setDomains] = useState<string[]>(() => loadScope(key, all))
  const [size, setSize] = useState(10)
  const [shuffleOn, setShuffleOn] = useState(loadShufflePref)
  const [code, setCode] = useState('')
  const [notFound, setNotFound] = useState(false)

  const update = (next: string[]) => {
    setDomains(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
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

  const modes: { kind: StartOptions['kind']; title: string; desc: string; count: number | null; disabled: boolean }[] = [
    { kind: 'weak', title: '間違えた問題', desc: '最後に間違えた問題と、正答率が 70% 未満の問題', count: weak, disabled: none || weak === 0 },
    { kind: 'input', title: '入力で解く', desc: '答えが 1 語の問題を、選択肢を見ずに入力して答える', count: inputCount(domains), disabled: none || inputCount(domains) === 0 },
    { kind: 'random', title: 'ランダム', desc: '復習の予定に関係なく、範囲から無作為に出す', count: null, disabled: none },
    { kind: 'exam', title: '模擬試験', desc: '1 問 90 秒の制限時間で解き、最後にまとめて採点する', count: null, disabled: none },
  ]

  return (
    <section className="page">
      <div className="page-head">
        <h2>問題演習</h2>
        <dl className="figures">
          <div>
            <dt>選んだ範囲</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>復習待ち</dt>
            <dd>{due}</dd>
          </div>
          <div>
            <dt>未出題</dt>
            <dd>{unseen}</dd>
          </div>
          <div>
            <dt>要復習</dt>
            <dd className={weak > 0 ? 'alert' : ''}>{weak}</dd>
          </div>
        </dl>
      </div>

      {examChoices && (
        <div className="pick-exam">
          <p>
            いまは<strong>すべての試験</strong>から出題します。1 つの試験に絞るときは、試験を選んでください。
          </p>
          <ul className="chips">
            {examChoices.map((e) => (
              <li key={e.key}>
                <button className="chip" onClick={() => onPickExam(e.key)}>
                  {e.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="start">
        {resume && (
          <button className="resume" onClick={onResume}>
            前回の続きから解く
            <span className="sub">
              {resume.group ?? 'すべての試験'}の {resume.total} 問のうち {resume.done} 問まで解答済み。{resume.done + 1} 問目から
            </span>
          </button>
        )}
        <button
          className="primary big-action"
          disabled={none || due + unseen === 0}
          onClick={() => onStart({ kind: 'study', domains, size })}>
          学習を始める
          <span className="sub">復習待ちの問題から、次に未出題の問題を {size} 問</span>
        </button>
        {!none && due + unseen === 0 && (
          <p className="note">いま解くべき問題はありません。次の復習日まで待つか、ランダムで解いてください。</p>
        )}
        <ul className="modes">
          {modes.map((m) => (
            <li key={m.kind}>
              <button className="mode" disabled={m.disabled} onClick={() => onStart({ kind: m.kind, domains, size })}>
                <span className="mode-title">
                  {m.title}
                  {m.count !== null && <span className="count">{m.count}</span>}
                </span>
                <span className="mode-desc">{m.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="section-title">設定</h3>
      <div className="settings">
        <div className="setting">
          <span id="size-label">1 回の問題数</span>
          <div className="segmented" role="radiogroup" aria-labelledby="size-label">
            {[5, 10, 20, 40, 60].map((n) => (
              <button key={n} role="radio" aria-checked={size === n} className={size === n ? 'on' : ''} onClick={() => setSize(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="setting check">
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
      </div>

      <h3 className="section-title">出題範囲</h3>
      {groupByExam(stats).map((g) => {
        const keys = g.domains.map((d) => d.key)
        const on = keys.filter((k) => domains.includes(k)).length
        return (
          <fieldset key={g.key} className="scope-group">
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
              <span className="legend-count">{g.total} 問</span>
            </legend>
            <ul className="scope">
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
                    <span className={`lamp ${lampOf(d)}`} title={LAMP_LABEL[lampOf(d)]} aria-hidden="true" />
                    <span className="scope-name">{d.shortLabel}</span>
                    <span className="scope-nums">
                      <span>{d.total} 問</span>
                      {d.due > 0 && <span>復習待ち {d.due}</span>}
                      {d.weak > 0 && <span className="alert">要復習 {d.weak}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )
      })}

      <details className="open-code">
        <summary>問題 ID で 1 問だけ開く</summary>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault()
            setNotFound(!onOpenCode(code))
          }}>
          <input
            type="text"
            aria-label="問題 ID"
            value={code}
            placeholder="例: LinuC102-1.06-019"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setCode(e.target.value)
              setNotFound(false)
            }}
          />
          <button disabled={code.trim() === ''}>開く</button>
          {notFound && <span className="note">その ID の問題は見つかりませんでした。</span>}
        </form>
      </details>
    </section>
  )
}
