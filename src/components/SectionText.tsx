import { lazy, Suspense, useRef, useState } from 'react'
import { findSubsection, loadText, sectionNumbers, sectionPages, splitSections, textFor, type Page } from '../lib/texts'
import type { Question } from '../lib/types'

const Markdown = lazy(() => import('./Markdown'))

interface Loaded {
  /** 問題に対応する小見出しの範囲。対応が書かれていないか、見つからなければ null */
  sub: { parent: string; body: string } | null
  /** 節全体のページ */
  pages: Page[]
}

/**
 * 問題に対応するテキストの範囲を、その場で開いて読めるようにする。
 * 問題に小見出し(**テキスト**:)があればその範囲だけを出し、「節全体を読む」で節全体に切り替える。
 * 節全体は、テキストの画面と同じページに分けて 1 ページずつ出す。
 */
export function SectionText({ q }: { q: Question }) {
  const text = textFor(q.exam, q.domain)
  const numbers = sectionNumbers(q.section)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [whole, setWhole] = useState(false)
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDetailsElement>(null)

  if (!text || numbers.length === 0) return null

  const load = () => {
    if (loaded !== null) return
    loadText(text.id)
      .then((md) => {
        const sections = splitSections(md).filter((s) => numbers.includes(s.number))
        const found = q.subsection ? findSubsection(sections, q.subsection) : undefined
        setLoaded({
          sub: found ? { parent: found.section.heading, body: found.body } : null,
          pages: sections.flatMap((s) => sectionPages(s)),
        })
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  const top = () => ref.current?.scrollIntoView({ block: 'start' })
  const go = (next: number) => {
    setIndex(next)
    // 次のページは節の先頭から読むので、節の見出しまで戻す
    top()
  }

  const showSub = loaded?.sub && !whole ? loaded.sub : null
  const pages = loaded?.pages ?? []
  const page = showSub ? null : pages[index]
  // 節の途中から始まるページは、どの節の続きかを示す
  const continued = page?.parent !== undefined && index > 0 && pages[index - 1].parent === page.parent ? page.parent : null
  const label = q.subsection ? `${numbers.join('、')} の「${q.subsection}」` : numbers.join('、')

  return (
    <details ref={ref} className="section-text" onToggle={(e) => e.currentTarget.open && load()}>
      <summary>テキストの該当節を読む({label})</summary>
      {error && <p>{error}</p>}
      {!error && loaded === null && <p className="meta">読み込み中</p>}
      {loaded !== null && pages.length === 0 && <p>対応する節が見つかりませんでした。</p>}
      {showSub && (
        <>
          <p className="text-crumb plain">{showSub.parent}</p>
          <Suspense fallback={<p className="meta">読み込み中</p>}>
            <Markdown text={showSub.body} exam={q.exam} textId={text.id} />
          </Suspense>
          <nav className="section-pager" aria-label="該当節">
            <button className="quiet" onClick={() => setWhole(true)}>
              節全体を読む
            </button>
          </nav>
        </>
      )}
      {page && (
        <>
          {continued && <p className="text-crumb">{continued}</p>}
          <Suspense fallback={<p className="meta">読み込み中</p>}>
            <Markdown key={index} text={page.body} exam={q.exam} textId={text.id} />
          </Suspense>
          {(pages.length > 1 || loaded?.sub) && (
            <nav className="section-pager" aria-label="該当節のページ">
              <button disabled={index === 0} onClick={() => go(index - 1)}>
                ‹ 前のページ
              </button>
              <span className="meta">
                ページ {index + 1} / {pages.length}
              </span>
              <button disabled={index === pages.length - 1} onClick={() => go(index + 1)}>
                次のページ ›
              </button>
            </nav>
          )}
          {loaded?.sub && (
            <p>
              <button
                className="link"
                onClick={() => {
                  setWhole(false)
                  top()
                }}
              >
                小見出しの範囲だけに戻す
              </button>
            </p>
          )}
        </>
      )}
    </details>
  )
}
