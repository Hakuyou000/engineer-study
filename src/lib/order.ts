/** 試験の表示順。ここにない試験は後ろに、名前順で並ぶ。 */
export const EXAM_ORDER = ['LinuC', 'CCNA']

export function examRank(exam: string): number {
  const i = EXAM_ORDER.findIndex((p) => exam.toLowerCase().startsWith(p.toLowerCase()))
  return i < 0 ? EXAM_ORDER.length : i
}

/** 試験の表示順 → 試験名 → 番号(数値として比較)の順に並べる比較関数。 */
export function compareExam(a: { exam: string; number: string }, b: { exam: string; number: string }): number {
  return (
    examRank(a.exam) - examRank(b.exam) ||
    a.exam.localeCompare(b.exam) ||
    a.number.localeCompare(b.number, undefined, { numeric: true })
  )
}
