import { describe, expect, it } from 'vitest'
import questions from '../data/questions.json'
import { parseQuestions } from './parser'
import type { Question } from './types'

const sample = `# CCNA 問題 9.0 テスト分野

対象: 全3問

## 問題

### 9.1 小項目A

**問1** 次の出力から考えられる原因はどれか。

\`\`\`
- A. これは出力の一部で選択肢ではない
### これも見出しではない
\`\`\`

- A. 選択肢1
- B. 選択肢2

**問2** 正しいものを**2つ**選べ。

- A. a
- B. b
- C. c

### 9.2 小項目B

**問3** \`show\` はどれか。

- A. x
- B. y

## 解答・解説

### 問1

**正解**: B

解説1。

### 問2

**正解**: A、C

解説2。

### 問3

**正解**: A

解説3。

`

describe('parseQuestions', () => {
  const qs = parseQuestions(sample)

  it('問題数、ID、分野、小項目を取り出す', () => {
    expect(qs.map((q) => q.id)).toEqual(['ccna-9.0-q1', 'ccna-9.0-q2', 'ccna-9.0-q3'])
    expect(qs[0]).toMatchObject({ exam: 'CCNA', domain: '9.0', domainTitle: 'テスト分野', section: '9.1 小項目A' })
    expect(qs[2].section).toBe('9.2 小項目B')
  })

  it('コードブロック内の行を選択肢や見出しとして扱わない', () => {
    expect(qs[0].choices.map((c) => c.key)).toEqual(['A', 'B'])
    expect(qs[0].stem).toContain('- A. これは出力の一部')
    expect(qs[0].stem).toContain('### これも見出しではない')
  })

  it('複数選択の正解を配列にする', () => {
    expect(qs[1].answer).toEqual(['A', 'C'])
    expect(qs[1].explanation).toBe('解説2。')
  })

  it('宣言した問題数と合わなければ失敗する', () => {
    expect(() => parseQuestions(sample.replace('全3問', '全4問'))).toThrow(/全4問/)
  })

  it('解答が欠けていれば失敗する', () => {
    expect(() => parseQuestions(sample.replace(/### 問3[\s\S]*$/, ''))).toThrow(/問3/)
  })

  it('正解が選択肢にないと失敗する', () => {
    expect(() => parseQuestions(sample.replace('**正解**: A\n\n解説3。', '**正解**: D\n\n解説3。'))).toThrow(/D/)
  })
})

describe('入力問題', () => {
  const md = `# LinuC102 問題 9.9 入力

## 問題

### 9.9.1 小項目

**問1** 鍵ペアを作るコマンド名を答えよ。

**問2** 選択。

- A. x
- B. y

## 解答・解説

### 問1

**正解**: \`ssh-keygen\`

解説1。

### 問2

**正解**: B

解説2。

`
  it('選択肢がなく、正解の欄がコードなら入力問題', () => {
    const [a, b] = parseQuestions(md)
    expect(a).toMatchObject({ kind: 'input', answer: ['ssh-keygen'], choices: [], stem: '鍵ペアを作るコマンド名を答えよ。' })
    expect(b.kind).toBeUndefined()
  })

  it('複数の正解を読む', () => {
    const q = parseQuestions(md.replace('`ssh-keygen`', '`atq`、`at -l`'))[0]
    expect(q.answer).toEqual(['atq', 'at -l'])
  })

  it('入力問題に選択肢があれば失敗する', () => {
    expect(() => parseQuestions(md.replace('**正解**: B', '**正解**: `x`'))).toThrow(/入力問題なのに選択肢/)
  })
})

describe('小項目の前置き', () => {
  const md = `# CCNA 問題 8.0 前置き

## 問題

### 8.1 表を使う

問1〜問2 は次の表を使う。

| a | b |
|---|---|
| 1 | 2 |

**問1** 一つ目。

- A. x
- B. y

**問2** 二つ目。

- A. x
- B. y

**問3** 三つ目。

- A. x
- B. y

### 8.2 範囲なし

共通の出力。

**問4** 四つ目。

- A. x
- B. y

## 解答・解説

### 問1

**正解**: A

.

### 問2

**正解**: A

.

### 問3

**正解**: A

.

### 問4

**正解**: A

.

`
  const qs = parseQuestions(md)

  it('範囲の問題にだけ前置きを付ける', () => {
    expect(qs[0].stem).toContain('| 1 | 2 |')
    expect(qs[0].stem.startsWith('次の表を使う。')).toBe(true)
    expect(qs[0].stem.endsWith('一つ目。')).toBe(true)
    expect(qs[1].stem).toContain('| 1 | 2 |')
    expect(qs[2].stem).toBe('三つ目。')
  })

  it('範囲がなければ小項目の全問題に付ける', () => {
    expect(qs[3].stem).toBe('共通の出力。\n\n四つ目。')
  })
})

describe('生成済みの問題データ', () => {
  it('他の問題を参照しない(出題順が変わるため)', () => {
    const ref = /問\d+|(前|上|先|次)の問題/
    expect(questions.filter((q) => ref.test(q.stem)).map((q) => q.id)).toEqual([])
  })

  it('全問に選択肢、正解、解説がある', () => {
    expect(questions.length).toBeGreaterThan(0)
    for (const q of questions as Question[]) {
      expect(q.stem.length, q.id).toBeGreaterThan(0)
      if (q.kind === 'input') expect(q.choices.length, q.id).toBe(0)
      else expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.answer.length, q.id).toBeGreaterThanOrEqual(1)
      expect(q.explanation.length, q.id).toBeGreaterThan(0)
      expect(q.section.length, q.id).toBeGreaterThan(0)
    }
  })

  it('選択問題の解説の箇条書きは、選択肢の記号で始まる(並べ替えで付け替えるため)', () => {
    for (const q of questions as Question[]) {
      if (q.kind === 'input') continue
      const labels = q.choices.map((_, i) => String.fromCharCode(65 + i))
      for (const line of q.explanation.split('\n').filter((l) => l.startsWith('- '))) {
        const m = /^- ([A-H])\. /.exec(line)
        expect(m, `${q.id}: ${line}`).not.toBeNull()
        expect(labels, `${q.id}: ${line}`).toContain(m![1])
      }
    }
  })
})

describe('問題 ID', () => {
  it('試験名-分野番号-問番号(3 桁)にする', async () => {
    const { questionCode } = await import('./parser')
    expect(questionCode('LinuC102', '1.06', 19)).toBe('LinuC102-1.06-019')
  })

  it('Markdown の問題 ID が合わなければエラーにする', async () => {
    const { parseQuestions } = await import('./parser')
    const md = '# CCNA 問題 1.0 x\n\n## 問題\n\n### 1.1 a\n\n**問1** `CCNA-1.0-002` 問題文\n\n- A. a\n- B. b\n\n## 解答・解説\n\n### 問1\n\n**正解**: A\n\nx\n'
    expect(() => parseQuestions(md)).toThrow('CCNA-1.0-001')
    const [q] = parseQuestions(md.replace('002', '001'))
    expect(q.code).toBe('CCNA-1.0-001')
    expect(q.stem).toBe('問題文')
  })

  it('すべての問題ファイルに問題 ID が書かれ、重複しない', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const data = (await import('../data/questions.json')).default as { code: string }[]
    expect(new Set(data.map((q) => q.code)).size).toBe(data.length)
    const files = readdirSync('content', { recursive: true }).map(String).filter((p) => p.endsWith('.md'))
    for (const f of files) {
      const lines = readFileSync(`content/${f}`, 'utf8').split('\n').filter((l) => l.startsWith('**問'))
      for (const l of lines) expect(l).toMatch(/^\*\*問\d+\*\* `[A-Za-z0-9]+-[\d.]+-\d{3}`/)
    }
  })
})

describe('解答の書式', () => {
  const md = '# CCNA 問題 1.0 x\n\n## 問題\n\n### 1.1 a\n\n**問1** `CCNA-1.0-001` 問題文\n\n- A. a\n- B. b\n\n## 解答・解説\n\n### 問1 `CCNA-1.0-001`\n\n**正解**: B\n\n手順です。\n① 一つ目\n② 二つ目\n\n誤りの説明です。\n'

  it('解説の改行と段落をそのまま残す', () => {
    const [q] = parseQuestions(md)
    expect(q.answer).toEqual(['B'])
    expect(q.explanation).toBe('手順です。\n① 一つ目\n② 二つ目\n\n誤りの説明です。')
  })

  it('解答の見出しの問題 ID が合わなければエラーにする', () => {
    expect(() => parseQuestions(md.replace('### 問1 `CCNA-1.0-001`', '### 問1 `CCNA-1.0-009`'))).toThrow('CCNA-1.0-009')
  })

  it('正解の行がなければエラーにする', () => {
    expect(() => parseQuestions(md.replace('**正解**: B', 'B'))).toThrow(/正解/)
  })

  it('入力の別解を読み、解説には含めない', () => {
    const [q] = parseQuestions(md.replace('**正解**: B\n', '**正解**: B\n\n**入力の別解**: `bb`、`b2`\n'))
    expect(q.inputAlt).toEqual(['bb', 'b2'])
    expect(q.explanation.startsWith('手順です。')).toBe(true)
  })

  it('別解のない問題には inputAlt を付けない', () => {
    expect(parseQuestions(md)[0].inputAlt).toBeUndefined()
  })

  it('複数選択に入力の別解を書くとエラーにする', () => {
    expect(() => parseQuestions(md.replace('**正解**: B\n', '**正解**: A、B\n\n**入力の別解**: `x`\n'))).toThrow(/別解/)
  })

  it('テキストの小見出しを読み、解説には含めない', () => {
    const [q] = parseQuestions(md.replace('**正解**: B\n', '**正解**: B\n\n**入力の別解**: `bb`\n\n**テキスト**: 2. 引数(位置パラメータ)\n'))
    expect(q.subsection).toBe('2. 引数(位置パラメータ)')
    expect(q.inputAlt).toEqual(['bb'])
    expect(q.explanation.startsWith('手順です。')).toBe(true)
    expect(parseQuestions(md)[0].subsection).toBeUndefined()
    expect(() => parseQuestions(md.replace('**正解**: B\n', '**正解**: B\n**テキスト**:\n'))).toThrow(/小見出し/)
  })
})

describe('タグ', () => {
  const md = '# K8s 問題 1.0 x\n\n## 問題\n\n### 1.1 a\n\n**問1** `K8s-1.0-001` [CKA] 問題文\n\n- A. a\n- B. b\n\n**問2** `K8s-1.0-002` [実務] 二つ目\n\n- A. a\n- B. b\n\n## 解答・解説\n\n### 問1\n\n**正解**: A\n\nx\n\n### 問2\n\n**正解**: B\n\ny\n'

  it('ID の後ろの [タグ] を取り出し、問題文から除く', () => {
    const [a, b] = parseQuestions(md)
    expect(a.tags).toEqual(['CKA'])
    expect(a.stem).toBe('問題文')
    expect(b.tags).toEqual(['実務'])
  })

  it('決めていないタグはエラーにする', () => {
    expect(() => parseQuestions(md.replace('[CKA]', '[CKS]'))).toThrow('CKS')
  })

  it('タグのない問題には tags を付けない', () => {
    const [a] = parseQuestions(md.replace('[CKA] ', ''))
    expect(a.tags).toBeUndefined()
  })

  it('Kubernetes の問題には、CKA か 実務 のタグがちょうど 1 つある', () => {
    const k8s = (questions as Question[]).filter((q) => q.exam === 'K8s')
    for (const q of k8s) expect(q.tags?.length, q.code).toBe(1)
  })
})
