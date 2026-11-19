import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Markdown from './Markdown'
import { Md } from './Md'

describe('本文の用語の印', () => {
  it('解説(Md)では link を付けたときだけ、用語ごとに 1 回だけ印を付ける', () => {
    const html = renderToStaticMarkup(<Md text={'TCP と UDP。TCP は `TCP` です。'} link={{ exam: 'CCNA' }} />)
    expect(html.match(/class="term"/g)?.length).toBe(2)
    expect(renderToStaticMarkup(<Md text="TCP と UDP" />)).not.toContain('class="term"')
  })

  it('テキスト(Markdown)では本文に印を付け、見出しとコードには付けない', () => {
    const html = renderToStaticMarkup(<Markdown text={'## TCP\n\nTCP と DNS。\n\n```\nUDP\n```'} exam="CCNA" />)
    expect(html).toContain('<h2>TCP</h2>')
    expect(html.match(/class="term"/g)?.length).toBe(2)
    expect(html).toContain('<code>UDP')
  })
})
