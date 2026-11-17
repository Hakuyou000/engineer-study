import { describe, expect, it } from 'vitest'
import questions from '../data/questions.json'
import { TEXTS, loadText, parseTextPath, sectionNumbers, splitSections, textFor } from './texts'

describe('parseTextPath', () => {
  it('試験名、番号、題名を取り出す', () => {
    expect(parseTextPath('../../texts/ccna/CCNA_1.0_ネットワーク_接続.md')).toEqual({
      id: 'ccna/CCNA_1.0_ネットワーク_接続',
      exam: 'CCNA',
      number: '1.0',
      title: 'ネットワーク_接続',
    })
    expect(parseTextPath('../../texts/linuc102/LinuC102_1.06_シェル.md')).toMatchObject({ exam: 'LinuC102', number: '1.06' })
    expect(parseTextPath('../../texts/ccna/README.md')).toBeNull()
  })
})

describe('splitSections', () => {
  const md = ['# 題名', '前書き', '## 1.1 節A', '本文A', '```', '## コード内', '```', '### 小見出し', '## 補足', '本文B', ''].join('\n')
  const s = splitSections(md)

  it('## で分割し、コードブロック内は無視する', () => {
    expect(s.map((x) => [x.number, x.heading])).toEqual([
      ['1.1', '1.1 節A'],
      ['', '補足'],
    ])
    expect(s[0].body).toContain('## コード内')
    expect(s[0].body).toContain('### 小見出し')
    expect(s[1].body).toBe('## 補足\n本文B')
  })
})

describe('sectionNumbers', () => {
  it('先頭の節番号を取り出す', () => {
    expect(sectionNumbers('1.1 インターフェースとケーブル')).toEqual(['1.1'])
    expect(sectionNumbers('2.0 / 2.1 スイッチの基本、トランク')).toEqual(['2.0', '2.1'])
    expect(sectionNumbers('4.7 L2 セキュリティ 802.1X')).toEqual(['4.7'])
    expect(sectionNumbers('番号なし')).toEqual([])
  })
})

describe('同梱のテキスト', () => {
  it('一覧は番号順に並ぶ', () => {
    expect(TEXTS.length).toBeGreaterThan(0)
    const linuc = TEXTS.filter((t) => t.exam === 'LinuC102').map((t) => t.number)
    expect(linuc).toEqual([...linuc].sort())
    const ccna = TEXTS.filter((t) => t.exam === 'CCNA').map((t) => t.number)
    expect(ccna).toEqual(['0', '1.0', '2.0', '3.0', '4.0', '5.0'])
  })

  it('LinuC が CCNA より先に並ぶ', () => {
    const exams = [...new Set(TEXTS.map((t) => t.exam))]
    expect(exams).toEqual(['LinuC102', 'CCNA'])
  })

  it('全問題の小項目に、対応するテキストの節がある', async () => {
    const cache = new Map<string, string[]>()
    for (const q of questions) {
      const t = textFor(q.exam, q.domain)
      expect(t, q.id).toBeDefined()
      if (!cache.has(t!.id)) cache.set(t!.id, splitSections(await loadText(t!.id)).map((s) => s.number))
      const nums = sectionNumbers(q.section)
      expect(nums.length, q.id).toBeGreaterThan(0)
      for (const n of nums) expect(cache.get(t!.id), `${q.id} → ${n}`).toContain(n)
    }
  })
})
