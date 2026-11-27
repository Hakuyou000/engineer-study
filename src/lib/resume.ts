/**
 * 途中で離れた問題演習を、続きから再開するための記録。
 * 1 問解くたびに保存し、最後まで解いたら消す。保存するのは問題 ID と結果だけ(問題の本文は持たない)。
 */
export interface Resume {
  /** 出題した問題の ID。input は入力で解く形にした問題 */
  items: { id: string; input: boolean }[]
  results: ('ok' | 'ng')[]
  /** 出題したときに選んでいた試験。null は「すべての試験」 */
  group: string | null
  ts: number
}

const KEY = 'sre-drill:resume'

export function loadResume(): Resume | null {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Resume | null
    if (!r || !Array.isArray(r.items) || !Array.isArray(r.results)) return null
    if (r.results.length === 0 || r.results.length >= r.items.length) return null
    return r
  } catch {
    return null
  }
}

export function saveResume(r: Resume | null) {
  try {
    if (r === null || r.results.length >= r.items.length) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    // 保存できなくても、演習は続けられる
  }
}
