import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import data from '../data/questions.json'
import type { Question } from '../lib/types'
import { TEXTS as ALL_TEXTS, loadText, splitPages, type Page, type TextInfo } from '../lib/texts'

const Markdown = lazy(() => import('./Markdown'))

const KEY = 'sre-drill:text'
/** テキストごとに、最後に開いていたページの番号 */
const PAGE_KEY = 'sre-drill:text-page'
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

function readPages(): Record<string, number> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PAGE_KEY) ?? '{}')
    return v && typeof v === 'object' ? (v as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function savePage(id: string, page: number) {
  try {
    localStorage.setItem(PAGE_KEY, JSON.stringify({ ...readPages(), [id]: page }))
  } catch {
    // 保存できなくても動作に支障はない
  }
}

/** 目次の 1 項目。### で分けた ## の節は、子にそのページを持つ */
interface TocItem {
  heading: string
  /** 分けていない節のページ番号。分けた節は undefined */
  page?: number
  children: { heading: string; page: number }[]
}

function tocOf(pages: Page[]): TocItem[] {
  const items: TocItem[] = []
  pages.forEach((p, i) => {
    if (p.parent === undefined) items.push({ heading: p.heading, page: i, children: [] })
    else {
      const last = items[items.length - 1]
      if (last && last.page === undefined && last.heading === p.parent) last.children.push({ heading: p.heading, page: i })
      else items.push({ heading: p.parent, children: [{ heading: p.heading, page: i }] })
    }
  })
  return items
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
  /** 開くページ。'last' は読み込んだ後に最後のページにする(前のテキストへ戻るとき) */
  const [page, setPage] = useState<number | 'last'>(() => readPages()[id] ?? 0)
  const [loaded, setLoaded] = useState<{ id: string; md: string } | { id: string; error: string } | null>(null)

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
  const pages = useMemo(() => (md ? splitPages(md) : []), [md])
  const toc = useMemo(() => tocOf(pages), [pages])
  const pageIndex = pages.length === 0 ? 0 : page === 'last' ? pages.length - 1 : Math.min(Math.max(page, 0), pages.length - 1)

  const open = (nextId: string, nextPage: number | 'last') => {
    setId(nextId)
    setPage(nextPage)
    window.scrollTo(0, 0)
    try {
      localStorage.setItem(KEY, nextId)
    } catch {
      // 保存できなくても動作に支障はない
    }
    if (typeof nextPage === 'number') savePage(nextId, nextPage)
  }

  useEffect(() => {
    // 'last' で開いたときは、決まったページ番号を保存する
    if (page === 'last' && pages.length > 0) savePage(id, pageIndex)
  }, [page, pages, id, pageIndex])

  if (TEXTS.length === 0) return <section className="card">テキストがありません。`texts/` に Markdown のファイルを置いてください。</section>

  const exams = [...new Set(TEXTS.map((t) => t.exam))]
  const info = ALL_TEXTS.find((t) => t.id === id)
  const textExam = info?.exam ?? null
  const index = TEXTS.findIndex((t) => t.id === id)
  const prevText = index > 0 ? TEXTS[index - 1] : null
  const nextText = index >= 0 && index < TEXTS.length - 1 ? TEXTS[index + 1] : null
  const count = info ? QUESTIONS.filter((q) => q.exam === info.exam && q.domain === info.number).length : 0
  const cur = pages[pageIndex]
  const hasPrevPage = pageIndex > 0
  const hasNextPage = pageIndex < pages.length - 1
  const textLabel = (t: TextInfo) => `${t.number} ${t.title}`
  // 節の途中から始まるページは、どの節の続きかを示す
  const continued = cur?.parent !== undefined && pageIndex > 0 && pages[pageIndex - 1].parent === cur.parent ? cur.parent : null

  const goPrev = () => {
    if (hasPrevPage) open(id, pageIndex - 1)
    else if (prevText) open(prevText.id, 'last')
  }
  const goNext = () => {
    if (hasNextPage) open(id, pageIndex + 1)
    else if (nextText) open(nextText.id, 0)
  }

  const pageButton = (heading: string, i: number) => (
    <button className="link" aria-current={i === pageIndex ? 'page' : undefined} onClick={() => open(id, i)}>
      {heading}
    </button>
  )

  return (
    <section className="card">
      <label className="text-head">
        <span className="text-head-label">テキスト</span>
        <select value={id} onChange={(e) => open(e.target.value, readPages()[e.target.value] ?? 0)}>
          {exams.map((exam) => (
            <optgroup key={exam} label={exam}>
              {TEXTS.filter((t) => t.exam === exam).map((t) => (
                <option key={t.id} value={t.id}>
                  {textLabel(t)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {current && 'error' in current && <p>{current.error}</p>}
      {!current && <p className="meta">読み込み中</p>}

      {md !== null && cur && (
        <>
          {pages.length > 1 && (
            <details key={`${id}-${pageIndex}`} className="toc" open={pageIndex === 0}>
              <summary className="toc-label">
                目次(ページ {pageIndex + 1} / {pages.length})
              </summary>
              <ol>
                {toc.map((item, k) => (
                  <li key={k}>
                    {pageButton(item.heading, item.page ?? item.children[0].page)}
                    {item.children.length > 1 && (
                      <ol className="toc-sub">
                        {item.children.slice(1).map((c) => (
                          <li key={c.page}>{pageButton(c.heading, c.page)}</li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            </details>
          )}

          {continued && <p className="text-crumb">{continued}</p>}
          <Suspense fallback={<p className="meta">読み込み中</p>}>
            <Markdown key={`${id}-${pageIndex}`} text={cur.body} exam={textExam} textId={id} />
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
              {pages.length > 1 && (
                <p className="meta text-page-count">
                  ページ {pageIndex + 1} / {pages.length}
                </p>
              )}
              <div className="text-end-pager">
                <button className="pager prev" disabled={!hasPrevPage && !prevText} onClick={goPrev}>
                  <span className="pager-label">{hasPrevPage || !prevText ? '‹ 前のページ' : '‹ 前のテキスト'}</span>
                  <span className="pager-title">
                    {hasPrevPage ? pages[pageIndex - 1].heading : prevText ? textLabel(prevText) : 'なし'}
                  </span>
                </button>
                <button className="pager next" disabled={!hasNextPage && !nextText} onClick={goNext}>
                  <span className="pager-label">{hasNextPage || !nextText ? '次のページ ›' : '次のテキスト ›'}</span>
                  <span className="pager-title">
                    {hasNextPage ? pages[pageIndex + 1].heading : nextText ? textLabel(nextText) : 'なし'}
                  </span>
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
