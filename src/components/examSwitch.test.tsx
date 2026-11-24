import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ExamStat } from '../lib/stats'
import { ExamSwitch } from './ExamSwitch'

const stat = (key: string, total: number, seen: number): ExamStat => ({
  key,
  label: key,
  total,
  seen,
  attempts: seen,
  correct: seen,
  due: 0,
  weak: 0,
  domains: [],
})
const groups = [stat('LinuC101', 110, 5), stat('CCNA', 177, 0)]
const noop = () => {}

describe('試験の切り替え', () => {
  it('閉じているときは、選んでいる試験とメニューのボタンだけを出す', () => {
    const html = renderToStaticMarkup(<ExamSwitch groups={groups} current="CCNA" locked={false} onSelect={noop} onToc={noop} />)
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('CCNA')
    expect(html).not.toContain('role="menu"')
  })

  it('開くと、すべての試験と各試験と目次への入口を並べ、選んでいる試験に印を付ける', () => {
    const html = renderToStaticMarkup(<ExamSwitch groups={groups} current="LinuC101" locked={false} onSelect={noop} onToc={noop} defaultOpen />)
    expect(html.match(/role="menuitemradio"/g)?.length).toBe(3)
    expect(html.match(/aria-checked="true"/g)?.length).toBe(1)
    expect(html).toMatch(/aria-checked="true"[^>]*>.*?LinuC 101/)
    // すべての試験は、各試験の合計
    expect(html).toContain('着手 5 / 287')
    expect(html).toContain('目次で詳しく見る')
  })

  it('解いている途中は押せない', () => {
    const html = renderToStaticMarkup(<ExamSwitch groups={groups} current={null} locked onSelect={noop} onToc={noop} />)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>/)
  })
})
