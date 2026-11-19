import { useEffect, useMemo, useRef, useState } from 'react'
import { termId } from '../lib/glossary'
import { TERMS } from '../lib/glossaryData'
import { examLabel } from '../lib/stats'
import { Md } from './Md'

/** 用語集。検索と、試験での絞り込み。focus の用語を開いた状態で表示する */
export function GlossaryView({ exam, focus }: { exam: string | null; focus?: string | null }) {
  const [query, setQuery] = useState('')
  const [onlyExam, setOnlyExam] = useState(exam !== null)
  const [current, setCurrent] = useState<string | null>(focus ?? null)
  const refs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (current) refs.current.get(current)?.scrollIntoView({ block: 'center' })
  }, [current])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TERMS.filter((t) => {
      if (onlyExam && exam !== null && t.exams.length > 0 && !t.exams.includes(exam) && t.name !== current) return false
      if (!q) return true
      return [t.name, ...t.aliases, t.body].some((s) => s.toLowerCase().includes(q))
    })
  }, [query, onlyExam, exam, current])

  const categories = [...new Set(list.map((t) => t.category))]

  return (
    <section className="card glossary">
      <h2>用語集</h2>
      <p className="meta">
        {TERMS.length} 語。テキストと解説の中の点線の付いた語を押しても、説明を見られます。
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
      </div>
      {list.length === 0 && <p>見つかりませんでした。</p>}
      {categories.map((c) => (
        <div key={c}>
          <h3>{c}</h3>
          <dl>
            {list
              .filter((t) => t.category === c)
              .map((t) => (
                <div
                  key={t.name}
                  id={`term-${termId(t.name)}`}
                  className={t.name === current ? 'term-entry on' : 'term-entry'}
                  ref={(el) => {
                    if (el) refs.current.set(t.name, el)
                    else refs.current.delete(t.name)
                  }}>
                  <dt>
                    {t.name}
                    {t.aliases.length > 0 && <span className="meta">({t.aliases.join('、')})</span>}
                  </dt>
                  <dd>
                    <Md text={t.body} />
                    <p className="meta">
                      {t.exams.length > 0 && <span>{t.exams.map(examLabel).join('、')}</span>}
                      {t.related.length > 0 && (
                        <span>
                          {' '}関連:{' '}
                          {t.related.map((r, i) => (
                            <span key={r}>
                              {i > 0 && '、'}
                              <button
                                className="link"
                                onClick={() => {
                                  setQuery('')
                                  setCurrent(r)
                                }}>
                                {r}
                              </button>
                            </span>
                          ))}
                        </span>
                      )}
                    </p>
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </section>
  )
}
