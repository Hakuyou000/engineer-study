import { describe, expect, it } from 'vitest'
import { compareExam } from './order'

describe('compareExam', () => {
  it('LinuC → CCNA → その他の順。同じ試験の中は番号順', () => {
    const xs = [
      { exam: 'CCNA', number: '10.0' },
      { exam: 'AWS', number: '1' },
      { exam: 'CCNA', number: '2.0' },
      { exam: 'LinuC102', number: '1.10' },
      { exam: 'LinuC102', number: '1.06' },
    ]
    expect(xs.sort(compareExam).map((x) => `${x.exam} ${x.number}`)).toEqual([
      'LinuC102 1.06',
      'LinuC102 1.10',
      'CCNA 2.0',
      'CCNA 10.0',
      'AWS 1',
    ])
  })
})
