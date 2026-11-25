import { lazy, Suspense, useState } from 'react'
import { loadText, sectionNumbers, splitSections, textFor } from '../lib/texts'
import type { Question } from '../lib/types'

const Markdown = lazy(() => import('./Markdown'))

/** 問題に対応するテキストの節を、その場で開いて読めるようにする。 */
export function SectionText({ q }: { q: Question }) {
  const text = textFor(q.exam, q.domain)
  const numbers = sectionNumbers(q.section)
  const [body, setBody] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!text || numbers.length === 0) return null

  const load = () => {
    if (body !== null) return
    loadText(text.id)
      .then((md) => {
        const found = splitSections(md).filter((s) => numbers.includes(s.number))
        setBody(found.map((s) => s.body).join('\n\n') || '対応する節が見つかりませんでした。')
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  return (
    <details className="section-text" onToggle={(e) => e.currentTarget.open && load()}>
      <summary>テキストの該当節を読む({numbers.join('、')})</summary>
      {error && <p>{error}</p>}
      {!error && body === null && <p className="meta">読み込み中</p>}
      {body !== null && (
        <Suspense fallback={<p className="meta">読み込み中</p>}>
          <Markdown text={body} exam={q.exam} textId={text.id} />
        </Suspense>
      )}
    </details>
  )
}
