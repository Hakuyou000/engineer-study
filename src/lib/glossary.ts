// 用語集(glossary/*.md)の解析と、本文の中の用語の検出。

/** 用語集の 1 語 */
export interface Term {
  /** 見出しの名前。用語集の中で一意 */
  name: string
  /** 本文で同じ用語として扱う別の書き方(正式名、略語など) */
  aliases: string[]
  /** 関係する試験(questions の exam と同じ値)。空なら試験を問わない */
  exams: string[]
  /** 分類(ファイルのタイトル) */
  category: string
  /** 小分類(ファイルの中の ## 見出し)。なければ空 */
  group: string
  /** 一覧に出す 1 文の要約 */
  summary: string
  /** 詳しい説明(インラインコード、太字、改行を使える) */
  body: string
  /** 例(コマンド、設定、出力など)。1 行に 1 つ */
  examples: string[]
  /** 試験や実務で間違えやすい点 */
  note: string
  /** 関連する用語の名前 */
  related: string[]
}

/**
 * 用語集のファイルの書式:
 *   # 用語集 <分類>
 *   ## 小分類                                              (省略可。次の ## まで続く)
 *   ### 用語の名前
 *   別名: Transmission Control Protocol、TCP/IP の TCP   (省略可)
 *   試験: LinuC102、CCNA                                  (省略可)
 *   要約: 1 文の要約                                       (省略可。なければ説明の最初の文)
 *   説明(1 行以上)
 *   例: `ss -tln`                                          (省略可。何行でも)
 *   注意: 間違えやすい点                                   (省略可)
 *   関連: UDP、ポート番号                                  (省略可)
 */
export function parseGlossary(md: string, source = '(input)'): Term[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const title = lines.find((l) => l.startsWith('# '))
  const tm = title?.match(/^# 用語集 (.+)$/)
  if (!tm) throw new Error(`${source}: タイトル行「# 用語集 <分類>」がない`)
  const category = tm[1].trim()

  const terms: Term[] = []
  let group = ''
  let cur: { name: string; group: string; lines: string[] } | null = null
  const flush = () => {
    if (!cur) return
    const t: Term = {
      name: cur.name,
      aliases: [],
      exams: [],
      category,
      group: cur.group,
      summary: '',
      body: '',
      examples: [],
      note: '',
      related: [],
    }
    const body: string[] = []
    for (const l of cur.lines) {
      const m = l.match(/^(別名|試験|関連|要約|例|注意)[:：]\s*(.*)$/)
      if (!m) {
        body.push(l)
        continue
      }
      const items = m[2].split('、').map((x) => x.trim()).filter(Boolean)
      if (m[1] === '別名') t.aliases = items
      else if (m[1] === '試験') t.exams = items
      else if (m[1] === '関連') t.related = items
      else if (m[1] === '要約') t.summary = m[2].trim()
      else if (m[1] === '例') t.examples.push(m[2].trim())
      else t.note = m[2].trim()
    }
    t.body = body.join('\n').trim()
    if (!t.body) throw new Error(`${source}: 「${t.name}」の説明がない`)
    if (!t.summary) t.summary = (t.body.match(/^[^\n]*?。/) ?? [t.body.split('\n')[0]])[0]
    terms.push(t)
    cur = null
  }
  for (const l of lines) {
    const g = l.match(/^## (.+)$/)
    const h = l.match(/^### (.+)$/)
    if (g) {
      flush()
      group = g[1].trim()
    } else if (h) {
      flush()
      cur = { name: h[1].trim(), group, lines: [] }
    } else if (cur) {
      cur.lines.push(l)
    }
  }
  flush()
  return terms
}

/** 用語集の整合性を確かめる。名前と別名の重複、存在しない関連語、知らない試験をエラーにする */
export function validateGlossary(terms: Term[], exams: readonly string[]): void {
  const owner = new Map<string, string>()
  for (const t of terms) {
    for (const w of [t.name, ...t.aliases]) {
      const prev = owner.get(w)
      if (prev !== undefined) throw new Error(`用語集: 「${w}」が「${prev}」と「${t.name}」で重複している`)
      owner.set(w, t.name)
    }
  }
  const names = new Set(terms.map((t) => t.name))
  for (const t of terms) {
    for (const r of t.related) if (!names.has(r)) throw new Error(`用語集: 「${t.name}」の関連語「${r}」が用語集にない`)
    for (const e of t.exams) if (!exams.includes(e)) throw new Error(`用語集: 「${t.name}」の試験「${e}」が知らない試験`)
  }
}

/** 用語の id(URL の一部に使う) */
export const termId = (name: string) => encodeURIComponent(name)

type Kind = 'ascii' | 'kata' | 'kanji' | 'other'
const kindOf = (ch: string | undefined): Kind | null => {
  if (ch === undefined) return null
  if (/[A-Za-z0-9_]/.test(ch)) return 'ascii'
  if (/[ァ-ヶー]/.test(ch)) return 'kata'
  if (/[一-龥々]/.test(ch)) return 'kanji'
  return 'other'
}

export type Piece = string | { text: string; term: Term }

/** 本文から用語を探す道具。長い語を優先し、語の途中では一致させない */
export interface Linker {
  /** text を、用語とそれ以外に分ける。seen にある用語は飛ばし、見つけた用語は seen に足す(最初の 1 回だけ印を付ける) */
  split(text: string, seen: Set<string>, exam?: string | null): Piece[]
}

export function createLinker(terms: Term[]): Linker {
  // 先頭の文字 → その文字で始まる語(長い順)
  const byFirst = new Map<string, { word: string; term: Term }[]>()
  for (const t of terms) {
    for (const word of [t.name, ...t.aliases]) {
      if (word.length < 2) continue
      const list = byFirst.get(word[0]) ?? []
      list.push({ word, term: t })
      byFirst.set(word[0], list)
    }
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.word.length - a.word.length)

  return {
    split(text, seen, exam) {
      const out: Piece[] = []
      let buf = ''
      let i = 0
      while (i < text.length) {
        const cands = byFirst.get(text[i])
        let hit: { word: string; term: Term } | undefined
        if (cands) {
          for (const c of cands) {
            if (!text.startsWith(c.word, i)) continue
            // 語の境目: 前後の文字が、語の端の文字と同じ種類(英数字、カタカナ、漢字)なら語の途中とみなす
            const before = kindOf(text[i - 1])
            const after = kindOf(text[i + c.word.length])
            const first = kindOf(c.word[0])
            const last = kindOf(c.word[c.word.length - 1])
            if (first !== 'other' && before === first) continue
            if (last !== 'other' && after === last) continue
            hit = c
            break
          }
        }
        if (hit) {
          const t = hit.term
          const inExam = !exam || t.exams.length === 0 || t.exams.includes(exam)
          if (!seen.has(t.name) && inExam) {
            if (buf) out.push(buf)
            buf = ''
            out.push({ text: hit.word, term: t })
            seen.add(t.name)
          } else {
            buf += hit.word
          }
          i += hit.word.length
        } else {
          buf += text[i]
          i++
        }
      }
      if (buf) out.push(buf)
      return out
    },
  }
}
