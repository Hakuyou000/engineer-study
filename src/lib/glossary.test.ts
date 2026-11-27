import { describe, expect, it } from 'vitest'
import data from '../data/glossary.json'
import questions from '../data/questions.json'
import { createLinker, parseGlossary, validateGlossary, type Term } from './glossary'

const TERMS = data as Term[]
const EXAMS = [...new Set((questions as { exam: string }[]).map((q) => q.exam))]

const md = `# 用語集 テスト

### TCP
別名: Transmission Control Protocol
試験: CCNA
接続を作る **プロトコル** です。
2 行目。
関連: UDP

### UDP
接続を作らないプロトコルです。

### ポート番号
サービスを区別する番号です。
`

describe('用語集の解析', () => {
  const terms = parseGlossary(md)

  it('名前、別名、試験、説明、関連を取り出す', () => {
    expect(terms.map((t) => t.name)).toEqual(['TCP', 'UDP', 'ポート番号'])
    expect(terms[0]).toMatchObject({
      aliases: ['Transmission Control Protocol'],
      exams: ['CCNA'],
      category: 'テスト',
      body: '接続を作る **プロトコル** です。\n2 行目。',
      related: ['UDP'],
    })
  })

  it('タイトル行がなければエラーにする', () => {
    expect(() => parseGlossary(md.replace('# 用語集 テスト', '# テスト'))).toThrow(/タイトル/)
  })

  it('説明がなければエラーにする', () => {
    expect(() => parseGlossary('# 用語集 x\n\n### A\n関連: B\n')).toThrow(/説明/)
  })

  it('重複、存在しない関連語、知らない試験をエラーにする', () => {
    expect(() => validateGlossary(terms, ['CCNA'])).not.toThrow()
    expect(() => validateGlossary([...terms, { ...terms[1], aliases: ['TCP'] }], ['CCNA'])).toThrow(/重複/)
    expect(() => validateGlossary([{ ...terms[1], related: ['なし'] }], ['CCNA'])).toThrow(/関連語/)
    expect(() => validateGlossary(terms, ['SAA'])).toThrow(/試験/)
  })
})

describe('小分類、要約、例、注意', () => {
  const src = `# 用語集 テスト

## 層

### TCP
要約: 信頼性のあるプロトコルです。
接続を作ります。
例: \`ss -tan\`
例: HTTP、SSH
注意: UDP と混同しないことです。

### UDP
軽いプロトコルです。2 文目です。
`
  const [tcp, udp] = parseGlossary(src)

  it('## を小分類として、続く用語に付ける', () => {
    expect(tcp.group).toBe('層')
    expect(udp.group).toBe('層')
  })

  it('要約、例(複数行、読点で分けない)、注意を取り出し、説明から外す', () => {
    expect(tcp).toMatchObject({
      summary: '信頼性のあるプロトコルです。',
      body: '接続を作ります。',
      examples: ['`ss -tan`', 'HTTP、SSH'],
      note: 'UDP と混同しないことです。',
    })
  })

  it('要約がなければ、説明の最初の文を使う', () => {
    expect(udp.summary).toBe('軽いプロトコルです。')
  })
})

describe('同梱の用語集の書き方', () => {
  it('すべての用語に小分類、要約、例、注意がある', () => {
    for (const t of TERMS) {
      expect(t.group, t.name).not.toBe('')
      expect(t.summary, t.name).toMatch(/。$/)
      expect(t.examples.length, t.name).toBeGreaterThan(0)
      expect(t.note, t.name).toMatch(/。$/)
    }
  })
})

describe('本文の用語の検出', () => {
  const linker = createLinker(parseGlossary(md))
  const names = (s: string, exam?: string | null) =>
    linker.split(s, new Set(), exam).flatMap((p) => (typeof p === 'string' ? [] : [p.term.name]))

  it('用語ごとに最初の 1 回だけ印を付ける', () => {
    expect(names('TCP と UDP。TCP はポート番号を使う')).toEqual(['TCP', 'UDP', 'ポート番号'])
  })

  it('英数字の語の途中では一致させない', () => {
    expect(names('TCPIP や xTCP')).toEqual([])
  })

  it('カタカナの語の途中では一致させない', () => {
    expect(names('サポート番号')).toEqual([])
  })

  it('別名でも一致し、長い語を優先する', () => {
    expect(names('Transmission Control Protocol です')).toEqual(['TCP'])
  })

  it('試験を指定すると、ほかの試験の用語には印を付けない', () => {
    expect(names('TCP と UDP', 'SAA')).toEqual(['UDP'])
    expect(names('TCP と UDP', 'CCNA')).toEqual(['TCP', 'UDP'])
  })

  it('分けた結果をつなぐと元の文になる', () => {
    const s = 'TCP と UDP、ポート番号。'
    expect(linker.split(s, new Set()).map((p) => (typeof p === 'string' ? p : p.text)).join('')).toBe(s)
  })
})

describe('同梱の用語集', () => {
  it('2,300 語前後あり、整合している', () => {
    expect(TERMS.length).toBeGreaterThanOrEqual(2200)
    expect(() => validateGlossary(TERMS, EXAMS)).not.toThrow()
  })

  it('説明は「です・ます」で終わる文で書く', () => {
    for (const t of TERMS) expect(t.body.trimEnd(), t.name).toMatch(/(す|ん|た)((.+))?。$/)
  })
})
