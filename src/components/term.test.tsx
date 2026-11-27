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

describe('本文の用語の印の上限', () => {
  it('1 つの段落には 3 つまで印を付け、残りは次の段落で付ける', () => {
    const html = renderToStaticMarkup(
      <Markdown text={'TCP、UDP、DNS、DHCP。\n\nDHCP を使う。'} exam="CCNA" />,
    )
    const paras = html.split('</p>')
    expect(paras[0].match(/class="term"/g)?.length).toBe(3)
    expect(paras[1]).toContain('class="term"')
  })
})

describe('Markdown の画像', () => {
  it('見つからない画像は、説明の文を出す', () => {
    const html = renderToStaticMarkup(<Markdown text={'![損益分岐点のグラフ](images/none.svg)'} textId="itpassport/x" />)
    expect(html).toContain('[図: 損益分岐点のグラフ]')
    expect(html).not.toContain('<img')
  })
})
