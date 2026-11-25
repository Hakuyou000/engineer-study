import { describe, expect, it } from 'vitest'
import { countByRule, lintQuestions, lintTextDiagrams } from './contentLint'
import type { Question } from './types'

let n = 0
function q(over: Partial<Question> = {}): Question {
  n++
  return {
    id: `t-1.0-q${n}`,
    code: `T-1.0-${String(n).padStart(3, '0')}`,
    exam: 'T',
    domain: '1.0',
    domainTitle: '分野',
    section: '1.1 小項目',
    number: n,
    stem: `問題文 ${n}`,
    choices: [
      { key: 'A', text: 'あ' },
      { key: 'B', text: 'い' },
      { key: 'C', text: 'う' },
      { key: 'D', text: 'え' },
    ],
    answer: ['A'],
    explanation: '解説。\n\n- B. 誤り\n- C. 誤り\n- D. 誤り',
    ...over,
  }
}
const rules = (qs: Question[]) => lintQuestions(qs, []).map((f) => `${f.level}:${f.rule}`)

describe('lintQuestions', () => {
  it('問題がなければ何も出さない', () => {
    expect(rules([q()])).toEqual([])
  })

  it('ほかの問題を前提にした書き方を見つける', () => {
    expect(rules([q({ explanation: 'count は前の問題と同じです。\n\n- B. x\n- C. x\n- D. x' })])).toEqual(['error:xref'])
    expect(rules([q({ stem: '問3 の設定で、次はどうなるか' })])).toEqual(['error:xref'])
  })

  it('「セキュリティ上の問題」「運用上の問題」は他問参照にしない', () => {
    expect(rules([q({ explanation: 'セキュリティ上の問題があり、運用上の問題もある。\n\n- B. x\n- C. x\n- D. x' })])).toEqual([])
    expect(rules([q({ stem: '上の問題と同じ設定で、次はどうなるか' })])).toEqual(['error:xref'])
  })

  it('コードブロックの中の「問1の」は見ない', () => {
    expect(rules([q({ stem: '```\necho 問1の答え\n```\n出力はどれか' })])).toEqual([])
  })

  it('1 行に記号を複数書いた解説を見つける', () => {
    expect(rules([q({ explanation: '解説\n\n- B と C. 誤り\n- D. 誤り' })])).toContain('error:multi-bullet')
  })

  it('選択肢にない記号の解説を見つける', () => {
    expect(rules([q({ explanation: '解説\n\n- B. x\n- C. x\n- D. x\n- E. x' })])).toEqual(['error:bullet-key'])
  })

  it('複数選択の数が問題文と合わないものを見つける', () => {
    expect(rules([q({ answer: ['A', 'B'], explanation: '解説\n\n- C. x\n- D. x' })])).toEqual(['error:multi-count'])
    expect(rules([q({ stem: '正しいものを**2つ**選べ', answer: ['A', 'B'], explanation: '解説\n\n- C. x\n- D. x' })])).toEqual([])
    expect(rules([q({ stem: '正しいものを**2つ**選べ' })])).toEqual(['error:multi-count'])
  })

  it('同じ試験の同じ問題文と、同じ選択肢を見つける', () => {
    expect(rules([q({ stem: 'X はどれか' }), q({ stem: 'X は どれか' })])).toEqual(['error:dup-stem'])
    expect(rules([q({ stem: 'X はどれか' }), q({ stem: 'X はどれか', exam: 'U' })])).toEqual([])
    const c = q()
    c.choices[1].text = 'あ'
    expect(rules([c])).toEqual(['error:dup-choice'])
  })

  it('説明のない誤りの選択肢は warn にする', () => {
    expect(rules([q({ explanation: '解説だけ' })])).toEqual(['warn:wrong-choice-unexplained'])
  })

  it('入力問題は選択肢の規則を見ない', () => {
    expect(rules([q({ kind: 'input', choices: [], answer: ['ls'], explanation: 'ls を使う' })])).toEqual([])
  })

  it('試験ごとの禁止パターンを見つける', () => {
    const aws = '```hcl\naws = {\n  source  = "hashicorp/aws"\n  version = "~> 5.0"\n}\n```'
    const bullets = '\n\n- B. x\n- C. x\n- D. x'
    const fs = lintQuestions([
      q({ exam: 'Terraform', stem: aws }),
      q({ exam: 'Terraform', explanation: 'マイナーは上がるが、メジャーの 5 は変えられない' + bullets }),
      q({ exam: 'Terraform', stem: '`~> 1.2.0` を満たす版はどれか' }),
      q({ stem: aws + ' X' }),
    ])
    expect(fs.map((f) => `${f.rule}:${f.code.split('-')[0]}`)).toEqual(['forbidden:T', 'forbidden:T'])
  })

  it('規則ごとに数える', () => {
    expect(countByRule(lintQuestions([q({ explanation: 'a' }), q({ explanation: 'b' })], []))).toEqual({ 'wrong-choice-unexplained': 2 })
  })
})

describe('lintTextDiagrams', () => {
  it('コードブロックの中の罫線と三角の矢印を見つける', () => {
    const md = ['本文の │ は対象外', '```', 'a ──▶ b', '```', '```bash', 'ls  # → は使える', '```'].join('\n')
    expect(lintTextDiagrams(md).map((f) => f.line)).toEqual([3])
  })

  it('text のブロックで、日本語の後ろの桁そろえを見つける', () => {
    const md = ['```text', '/dev/sda      ディスク', '[PV]  物理    ボリューム', 'カーネル: 読み込む。/sys に出る', '```', '```', '日本語    # コメント', '```'].join('\n')
    expect(lintTextDiagrams(md).map((f) => f.line)).toEqual([3])
  })
})
