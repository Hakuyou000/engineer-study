import { compareExam } from './order'

const KEY = 'sre-drill:group'

/** 問題とテキストに出てくる試験を、表示順(LinuC → CCNA)に並べる。 */
export function examList(exams: Iterable<string>): string[] {
  return [...new Set(exams)].sort((a, b) => compareExam({ exam: a, number: '' }, { exam: b, number: '' }))
}

/** 保存されている選択中の試験。未選択(目次を表示)は null。 */
export function loadGroup(valid: readonly string[]): string | null {
  try {
    const g = localStorage.getItem(KEY)
    if (g && valid.includes(g)) return g
  } catch {
    // 読めなければ目次から始める
  }
  return null
}

export function saveGroup(g: string | null) {
  try {
    if (g === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, g)
  } catch {
    // 保存できなくても動作に支障はない
  }
}
