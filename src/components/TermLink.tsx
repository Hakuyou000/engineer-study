import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { openGlossary, termByName } from '../lib/glossaryData'
import { Md } from './Md'
import { TermDetail } from './TermDetail'

/** 本文の中の用語。押すと説明を下に出す */
export function TermLink({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false)
  const t = termByName(name)
  // Escape で閉じる
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!t) return <>{text}</>
  return (
    <>
      <button type="button" className="term" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {text}
      </button>
      {open &&
        createPortal(
          <div className="term-sheet-backdrop" onClick={() => setOpen(false)}>
            <div className="term-sheet" role="dialog" aria-label={t.name} onClick={(e) => e.stopPropagation()}>
              <div className="term-head">
                <strong>{t.name}</strong>
                <button type="button" className="link" onClick={() => setOpen(false)} aria-label="閉じる">
                  閉じる
                </button>
              </div>
              {t.aliases.length > 0 && <p className="meta">{t.aliases.join('、')}</p>}
              <div className="term-summary">
                <Md text={t.summary} />
              </div>
              <TermDetail term={t} />
              <button
                type="button"
                className="link"
                onClick={() => {
                  setOpen(false)
                  openGlossary(t.name)
                }}>
                用語集で開く
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
