import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import data from '../data/questions.json'
import type { Question } from '../lib/types'
import { TEXTS as ALL_TEXTS, loadText, splitSections, type TextInfo } from '../lib/texts'

const Markdown = lazy(() => import('./Markdown'))

const KEY = 'sre-drill:text'
const QUESTIONS = data as Question[]

function initialId(TEXTS: TextInfo[]): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && TEXTS.some((t) => t.id === saved)) return saved
  } catch {
    // 保存値が読めなければ先頭を開く
  }
  return TEXTS[0]?.id ?? ''
}

interface Props {
  exam: string | null
  /** この章(分野)の問題を解く */
  onPractice: (exam: string, domain: string) => void
  /** その試験の問題演習の画面を開く */
  onOpenHome: (exam: string) => void
}

export function TextView({ exam, onPractice, onOpenHome }: Props) {
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

  const select = (next: string, top = false) => {
    setId(next)
    if (top) window.scrollTo(0, 0)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // 保存できなくても動作に支障はない
    }
  }

  if (TEXTS.length === 0) return <section className="card">テキストがありません。`texts/` に Markdown のファイルを置いてください。</section>

  const exams = [...new Set(TEXTS.map((t) => t.exam))]
  const info = ALL_TEXTS.find((t) => t.id === id)
  const textExam = info?.exam ?? null
  const index = TEXTS.findIndex((t) => t.id === id)
  const prev = index > 0 ? TEXTS[index - 1] : null
  const next = index >= 0 && index < TEXTS.length - 1 ? TEXTS[index + 1] : null
  const count = info ? QUESTIONS.filter((q) => q.exam === info.exam && q.domain === info.number).length : 0

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
            <Markdown text={intro} exam={textExam} />
            {sections.map((s, i) => (
              <section
                key={`${id}-${i}`}
                ref={(el) => {
                  refs.current[i] = el
                }}
              >
                <Markdown text={s.body} exam={textExam} />
              </section>
            ))}
          </Suspense>

          {info && (
            <nav className="text-end" aria-label="次に進む">
              <div className="text-end-practice">
                {count > 0 ? (
                  <button className="primary" onClick={() => onPractice(info.exam, info.number)}>
                    この章の問題を解く({count} 問)
                  </button>
                ) : null}
                <button className={count > 0 ? '' : 'primary'} onClick={() => onOpenHome(info.exam)}>
                  問題演習を開く
                </button>
              </div>
              <div className="text-end-pager">
                {prev ? (
                  <button className="pager prev" onClick={() => select(prev.id, true)}>
                    <span className="meta">前のテキスト</span>
                    <span>
                      {prev.number} {prev.title}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {next && (
                  <button className="pager next" onClick={() => select(next.id, true)}>
                    <span className="meta">次のテキスト</span>
                    <span>
                      {next.number} {next.title}
                    </span>
                  </button>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
