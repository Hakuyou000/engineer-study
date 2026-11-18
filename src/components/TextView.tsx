import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { TEXTS as ALL_TEXTS, loadText, splitSections, type TextInfo } from '../lib/texts'

const Markdown = lazy(() => import('./Markdown'))

const KEY = 'sre-drill:text'

function initialId(TEXTS: TextInfo[]): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && TEXTS.some((t) => t.id === saved)) return saved
  } catch {
    // 保存値が読めなければ先頭を開く
  }
  return TEXTS[0]?.id ?? ''
}

export function TextView({ exam }: { exam: string | null }) {
  const TEXTS = exam === null ? ALL_TEXTS : ALL_TEXTS.filter((t) => t.exam === exam)
  const [id, setId] = useState(() => initialId(TEXTS))
  const [loaded, setLoaded] = useState<{ id: string; md: string } | { id: string; error: string } | null>(null)
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!id) return
    let alive = true
    loadText(id)
      .then((md) => alive && setLoaded({ id, md }))
      .catch((e: unknown) => alive && setLoaded({ id, error: e instanceof Error ? e.message : String(e) }))
    return () => {
      alive = false
    }
  }, [id])

  const current = loaded?.id === id ? loaded : null
  const md = current && 'md' in current ? current.md : null
  const sections = useMemo(() => (md ? splitSections(md) : []), [md])
  // 最初の ## より前(題名と前書き)
  const intro = useMemo(() => (md && sections.length ? md.slice(0, md.indexOf(sections[0].body)) : (md ?? '')), [md, sections])

  const select = (next: string) => {
    setId(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // 保存できなくても動作に支障はない
    }
  }

  if (TEXTS.length === 0) return <section className="card">テキストがありません。`texts/` に Markdown のファイルを置いてください。</section>

  const exams = [...new Set(TEXTS.map((t) => t.exam))]

  return (
    <section className="card">
      <label className="inline">
        テキスト
        <select value={id} onChange={(e) => select(e.target.value)}>
          {exams.map((exam) => (
            <optgroup key={exam} label={exam}>
              {TEXTS.filter((t) => t.exam === exam).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.number} {t.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {current && 'error' in current && <p>{current.error}</p>}
      {!current && <p className="meta">読み込み中</p>}

      {md !== null && (
        <>
          {sections.length > 1 && (
            <nav className="toc" aria-label="目次">
              {sections.map((s, i) => (
                <button key={i} className="link" onClick={() => refs.current[i]?.scrollIntoView({ block: 'start' })}>
                  {s.heading}
                </button>
              ))}
            </nav>
          )}
          <Suspense fallback={<p className="meta">読み込み中</p>}>
            <Markdown text={intro} />
            {sections.map((s, i) => (
              <section
                key={`${id}-${i}`}
                ref={(el) => {
                  refs.current[i] = el
                }}
              >
                <Markdown text={s.body} />
              </section>
            ))}
          </Suspense>
        </>
      )}
    </section>
  )
}
