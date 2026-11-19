import { useEffect, useMemo, useRef, useState } from 'react'
import { termId, type Term } from '../lib/glossary'
import { TERMS } from '../lib/glossaryData'
import { examLabel } from '../lib/stats'
import { Md } from './Md'
import { TermDetail } from './TermDetail'

const anchor = (category: string, group = '') => `glossary-${termId(category)}${group ? `-${termId(group)}` : ''}`

interface Section {
  category: string
  groups: { name: string; terms: Term[] }[]
}

/** 分類 → 小分類 → 用語の順にまとめる。並びは用語集のファイルのとおり */
function sectionsOf(list: Term[]): Section[] {
  const out: Section[] = []
  for (const t of list) {
    let c = out.find((s) => s.category === t.category)
    if (!c) out.push((c = { category: t.category, groups: [] }))
    let g = c.groups.find((x) => x.name === t.group)
    if (!g) c.groups.push((g = { name: t.group, terms: [] }))
    g.terms.push(t)
  }
  return out
}

/** 用語集。分類と小分類の索引、検索、試験での絞り込み。focus の用語を開いた状態で表示する */
export function GlossaryView({ exam, focus }: { exam: string | null; focus?: string | null }) {
  const [query, setQuery] = useState('')
  const [onlyExam, setOnlyExam] = useState(exam !== null)
  const [current, setCurrent] = useState<string | null>(focus ?? null)
  const [open, setOpen] = useState<Set<string>>(() => new Set(focus ? [focus] : []))
  const refs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (current) refs.current.get(current)?.scrollIntoView({ block: 'start' })
  }, [current])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TERMS.filter((t) => {
      if (onlyExam && exam !== null && t.exams.length > 0 && !t.exams.includes(exam) && t.name !== current) return false
      if (!q) return true
      return [t.name, ...t.aliases, t.summary, t.body, ...t.examples, t.note].some((s) => s.toLowerCase().includes(q))
    })
  }, [query, onlyExam, exam, current])
  const sections = useMemo(() => sectionsOf(list), [list])

  const toggle = (name: string, value: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (value) next.add(name)
      else next.delete(name)
      return next
    })
  const jump = (name: string) => {
    setQuery('')
    toggle(name, true)
    setCurrent(name)
    refs.current.get(name)?.scrollIntoView({ block: 'start' })
  }
  const allOpen = list.length > 0 && list.every((t) => open.has(t.name))

  return (
    <section className="card glossary">
      <h2>用語集</h2>
      <p className="meta">
        {TERMS.length} 語。用語を押すと、詳しい説明、例、注意が開きます。テキストと解説の中の点線の付いた語からも開けます。
      </p>
      <div className="glossary-tools">
        <input
          type="search"
          placeholder="用語を検索(例: DNS、冪等性)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="用語を検索"
        />
        {exam !== null && (
          <label className="inline">
            <input type="checkbox" checked={onlyExam} onChange={(e) => setOnlyExam(e.target.checked)} />
            {examLabel(exam)} の用語だけ
          </label>
        )}
        <button className="quiet" onClick={() => setOpen(allOpen ? new Set() : new Set(list.map((t) => t.name)))}>
          {allOpen ? 'すべて閉じる' : 'すべて開く'}
        </button>
      </div>

      {sections.length > 0 && (
        <details className="glossary-index" open>
          <summary>索引({list.length} 語)</summary>
          <ul>
            {sections.map((s) => (
              <li key={s.category}>
                <a href={`#${anchor(s.category)}`} className="index-category">
                  {s.category}
                </a>
                <span className="index-groups">
                  {s.groups.map((g) => (
                    <a key={g.name} href={`#${anchor(s.category, g.name)}`} className="index-group">
                      {g.name || 'その他'}
                      <span className="count">{g.terms.length}</span>
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {list.length === 0 && <p>見つかりませんでした。</p>}
      {sections.map((s) => (
        <section key={s.category} className="glossary-category">
          <h3 id={anchor(s.category)}>{s.category}</h3>
          {s.groups.map((g) => (
            <div key={g.name} className="glossary-group">
              {g.name && <h4 id={anchor(s.category, g.name)}>{g.name}</h4>}
              {g.terms.map((t) => (
                <details
                  key={t.name}
                  id={`term-${termId(t.name)}`}
                  className={t.name === current ? 'term-entry on' : 'term-entry'}
                  open={open.has(t.name)}
                  onToggle={(e) => {
                    const v = (e.currentTarget as HTMLDetailsElement).open
                    if (v !== open.has(t.name)) toggle(t.name, v)
                  }}
                  ref={(el) => {
                    if (el) refs.current.set(t.name, el)
                    else refs.current.delete(t.name)
                  }}>
                  <summary>
                    <span className="term-name">
                      {t.name}
                      {t.aliases.length > 0 && <span className="meta">{t.aliases.join('、')}</span>}
                    </span>
                    <span className="term-summary">
                      <Md text={t.summary} />
                    </span>
                  </summary>
                  <TermDetail term={t} />
                  <p className="meta term-foot">
                    {t.exams.length > 0 && <span>{t.exams.map(examLabel).join('、')}</span>}
                    {t.related.length > 0 && (
                      <span>
                        関連:{' '}
                        {t.related.map((r, i) => (
                          <span key={r}>
                            {i > 0 && '、'}
                            <button className="link" onClick={() => jump(r)}>
                              {r}
                            </button>
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </details>
              ))}
            </div>
          ))}
        </section>
      ))}
    </section>
  )
}
