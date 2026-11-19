import type { Term } from '../lib/glossary'
import { Md } from './Md'

/** 用語の詳しい説明、例、注意。用語集と本文の用語のシートで共通 */
export function TermDetail({ term }: { term: Term }) {
  return (
    <div className="term-detail">
      <Md text={term.body} />
      {term.examples.length > 0 && (
        <div className="term-examples">
          <p className="term-label">例</p>
          <ul>
            {term.examples.map((e, i) => (
              <li key={i}>
                <Md text={e} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {term.note && (
        <div className="term-note">
          <p className="term-label">注意</p>
          <Md text={term.note} />
        </div>
      )}
    </div>
  )
}
