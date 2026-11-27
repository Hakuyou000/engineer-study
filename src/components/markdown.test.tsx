import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Markdown from './Markdown'

describe('Markdown', () => {
  it('閉じ括弧の直後の ** に日本語が続いても太字にする', () => {
    const html = renderToStaticMarkup(<Markdown text="読み取り専用の**層(レイヤー)**を重ねる" />)
    expect(html).toMatch(/<strong>層\(.*\)<\/strong>を/)
    expect(html).not.toContain('**')
  })
})
