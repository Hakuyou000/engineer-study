import { describe, expect, it } from 'vitest'
import questions from '../data/questions.json'
import { parseQuestions } from './parser'

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

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | B | 解説1。 |
| 2 | A、C | 解説2。 |
| 3 | A | 解説3。 |
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
    expect(() => parseQuestions(sample.replace('| 3 | A | 解説3。 |\n', ''))).toThrow(/問3/)
  })

  it('正解が選択肢にないと失敗する', () => {
    expect(() => parseQuestions(sample.replace('| 3 | A |', '| 3 | D |'))).toThrow(/D/)
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

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | A | . |
| 2 | A | . |
| 3 | A | . |
| 4 | A | . |
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
    expect(questions.filter((q) => /問\d+/.test(q.stem)).map((q) => q.id)).toEqual([])
  })

  it('全問に選択肢、正解、解説がある', () => {
    expect(questions.length).toBeGreaterThan(0)
    for (const q of questions) {
      expect(q.stem.length, q.id).toBeGreaterThan(0)
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.answer.length, q.id).toBeGreaterThanOrEqual(1)
      expect(q.explanation.length, q.id).toBeGreaterThan(0)
      expect(q.section.length, q.id).toBeGreaterThan(0)
    }
  })
})
