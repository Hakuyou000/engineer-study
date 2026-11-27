import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { LAMP_LABEL, lampOf } from '../lib/lamp'
import { moveIndex } from '../lib/menu'
import { examLabel, type ExamStat, type SectionStat } from '../lib/stats'

interface Props {
  /** 試験ごとの集計(すべての試験) */
  groups: ExamStat[]
  /** 選んでいる試験。null は「すべての試験」 */
  current: string | null
  /** 問題演習と模擬試験の途中。切り替えると解いている回が消えるので、押せなくする */
  locked: boolean
  /** 試験を選んだ。今の画面のまま、試験だけを切り替える */
  onSelect: (exam: string | null) => void
  /** 目次を開く */
  onToc: () => void
  /** 開いたままにする(テストと確認のため) */
  defaultOpen?: boolean
}

interface Item {
  key: string | null
  label: string
  stat: SectionStat
}

/** 上の帯の「試験の切り替え」。押すとその場に試験の一覧が開く */
export function ExamSwitch({ groups, current, locked, onSelect, onToc, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const button = useRef<HTMLButtonElement>(null)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  const all: SectionStat = groups.reduce(
    (a, g) => ({ ...a, total: a.total + g.total, seen: a.seen + g.seen, attempts: a.attempts + g.attempts, correct: a.correct + g.correct, due: a.due + g.due, weak: a.weak + g.weak }),
    { key: '*', label: 'すべての試験', total: 0, seen: 0, attempts: 0, correct: 0, due: 0, weak: 0 },
  )
  const items: Item[] = [{ key: null, label: 'すべての試験', stat: all }, ...groups.map((g) => ({ key: g.key, label: examLabel(g.key), stat: g }))]
  // 最後の項目は「目次で詳しく見る」
  const count = items.length + 1
  const currentIndex = Math.max(0, items.findIndex((it) => it.key === current))

  // 開いたら、選んでいる試験に焦点を移す
  useEffect(() => {
    if (open && !defaultOpen) refs.current[currentIndex]?.focus()
  }, [open, currentIndex, defaultOpen])

  const close = (focusButton: boolean) => {
    setOpen(false)
    if (focusButton) button.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
      return
    }
    if (e.key === 'Tab') {
      close(false)
      return
    }
    const now = refs.current.findIndex((el) => el === document.activeElement)
    const next = moveIndex(now < 0 ? currentIndex : now, e.key, count)
    if (next !== null) {
      e.preventDefault()
      refs.current[next]?.focus()
    }
  }

  const pick = (key: string | null) => {
    close(true)
    if (key !== current) onSelect(key)
  }

  return (
    <div className="exam-switch-wrap">
      <button
        ref={button}
        className="exam-switch"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={locked}
        title={locked ? '解いている途中は切り替えられません' : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            setOpen(true)
          }
        }}>
        <span className="sr-only">試験: </span>
        <span className="exam-switch-label">{current === null ? 'すべての試験' : examLabel(current)}</span>
        <span aria-hidden="true" className="caret" />
      </button>
      {open && (
        <>
          <div className="exam-menu-backdrop" onClick={() => close(false)} />
          <div className="exam-menu" id={menuId} role="menu" aria-label="試験を選ぶ" onKeyDown={onKeyDown}>
            <p className="exam-menu-title" aria-hidden="true">
              試験を選ぶ
            </p>
            {items.map((it, i) => {
              const st = lampOf(it.stat)
              return (
                <button
                  key={it.key ?? '*'}
                  ref={(el) => {
                    refs.current[i] = el
                  }}
                  role="menuitemradio"
                  aria-checked={it.key === current}
                  tabIndex={-1}
                  className={it.key === current ? 'exam-menu-item on' : 'exam-menu-item'}
                  onClick={() => pick(it.key)}>
                  <span className={`lamp ${st}`} aria-hidden="true" />
                  <span className="exam-menu-name">{it.label}</span>
                  <span className="exam-menu-count">
                    <span className="sr-only">{LAMP_LABEL[st]}、</span>着手 {it.stat.seen} / {it.stat.total}
                  </span>
                </button>
              )
            })}
            <button
              ref={(el) => {
                refs.current[items.length] = el
              }}
              role="menuitem"
              tabIndex={-1}
              className="exam-menu-item exam-menu-toc"
              onClick={() => {
                close(false)
                onToc()
              }}>
              目次で詳しく見る
            </button>
          </div>
        </>
      )}
    </div>
  )
}
