import { lazy, Suspense, useRef, useState } from 'react'
import { loadText, sectionNumbers, sectionPages, splitSections, textFor, type Page } from '../lib/texts'
import type { Question } from '../lib/types'

const Markdown = lazy(() => import('./Markdown'))

/** 問題に対応するテキストの節を、その場で開いて読めるようにする。長い節は、テキストの画面と同じページに分けて 1 ページずつ出す */
export function SectionText({ q }: { q: Question }) {
  const text = textFor(q.exam, q.domain)
  const numbers = sectionNumbers(q.section)
  const [pages, setPages] = useState<Page[] | null>(null)
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDetailsElement>(null)

  if (!text || numbers.length === 0) return null

  const load = () => {
    if (pages !== null) return
    loadText(text.id)
      .then((md) => setPages(splitSections(md).filter((s) => numbers.includes(s.number)).flatMap((s) => sectionPages(s))))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  const go = (next: number) => {
    setIndex(next)
    // 次のページは節の先頭から読むので、節の見出しまで戻す
    ref.current?.scrollIntoView({ block: 'start' })
  }

  const page = pages?.[index]
  // 節の途中から始まるページは、どの節の続きかを示す
  const continued = page?.parent !== undefined && index > 0 && pages?.[index - 1].parent === page.parent ? page.parent : null

  return (
    <details ref={ref} className="section-text" onToggle={(e) => e.currentTarget.open && load()}>
      <summary>テキストの該当節を読む({numbers.join('、')})</summary>
      {error && <p>{error}</p>}
      {!error && pages === null && <p className="meta">読み込み中</p>}
      {pages !== null && pages.length === 0 && <p>対応する節が見つかりませんでした。</p>}
      {page && (
        <>
          {continued && <p className="text-crumb">{continued}</p>}
          <Suspense fallback={<p className="meta">読み込み中</p>}>
            <Markdown key={index} text={page.body} exam={q.exam} textId={text.id} />
          </Suspense>
          {pages.length > 1 && (
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
        </>
      )}
    </details>
  )
}
