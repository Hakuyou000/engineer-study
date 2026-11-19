import { LAMP_LABEL, lampOf, type LampState } from '../lib/lamp'
import type { SectionStat } from '../lib/stats'

/** 分野ごとの状態ランプの列 */
export function Lamps({ items, label }: { items: (SectionStat & { shortLabel?: string })[]; label: string }) {
  return (
    <ol className="lamps" aria-label={label}>
      {items.map((d) => {
        const st = lampOf(d)
        const name = d.shortLabel ?? d.label
        return (
          <li key={d.key} className={`lamp ${st}`} title={`${name}: ${LAMP_LABEL[st]}(${d.seen} / ${d.total} 問)`}>
            <span className="sr-only">
              {name}: {LAMP_LABEL[st]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** ランプの色の意味 */
export function LampLegend() {
  const states: LampState[] = ['off', 'learning', 'weak', 'solid']
  return (
    <ul className="lamp-legend" aria-label="ランプの色の意味">
      {states.map((s) => (
        <li key={s}>
          <span className={`lamp ${s}`} aria-hidden="true" />
          {LAMP_LABEL[s]}
        </li>
      ))}
    </ul>
  )
}
