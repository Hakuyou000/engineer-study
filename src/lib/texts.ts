// テキスト(texts/**/*.md)の一覧と、節の切り出し。
import { compareExam } from './order'

export interface TextInfo {
  /** 例: ccna/CCNA_1.0_ネットワークインフラストラクチャと接続 */
  id: string
  /** 例: CCNA */
  exam: string
  /** 例: 1.0 */
  number: string
  title: string
}

export interface Section {
  /** 見出しの先頭の番号。例: 1.1。番号がなければ空文字 */
  number: string
  heading: string
  /** 見出し行を含む本文 */
  body: string
}

/** `…/texts/ccna/CCNA_1.0_分野名.md` → TextInfo。形式が違えば null。 */
export function parseTextPath(path: string): TextInfo | null {
  const m = path.match(/texts\/([^/]+)\/(([^_/]+)_([\d.]+)_(.+))\.md$/)
  if (!m) return null
  return { id: `${m[1]}/${m[2]}`, exam: m[3], number: m[4], title: m[5] }
}

/** `## ` 見出しで分割する。コードブロック内の `#` は見出しとして扱わない。最初の見出しより前は捨てる。 */
export function splitSections(md: string): Section[] {
  const sections: Section[] = []
  let cur: { heading: string; lines: string[] } | null = null
  let inFence = false
  const flush = () => {
    if (!cur) return
    const number = cur.heading.match(/^\d+(?:\.\d+)+/)?.[0] ?? ''
    sections.push({ number, heading: cur.heading, body: cur.lines.join('\n').trimEnd() })
  }
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    const m = inFence ? null : line.match(/^## (.+)$/)
    if (m) {
      flush()
      cur = { heading: m[1].trim(), lines: [line] }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  flush()
  return sections
}

/** 問題の小項目名の先頭にある節番号。「2.0 / 2.1 スイッチの基本」→ ['2.0', '2.1'] */
export function sectionNumbers(label: string): string[] {
  const out: string[] = []
  for (const token of label.split(/\s+/)) {
    if (/^\d+(?:\.\d+)+$/.test(token)) out.push(token)
    else if (token !== '/') break
  }
  return out
}

const loaders = import.meta.glob<string>('../../texts/**/*.md', { query: '?raw', import: 'default' })

const entries = Object.entries(loaders)
  .map(([path, load]) => ({ info: parseTextPath(path), load }))
  .filter((e): e is { info: TextInfo; load: () => Promise<string> } => e.info !== null)
  .sort((a, b) => compareExam(a.info, b.info))

export const TEXTS: TextInfo[] = entries.map((e) => e.info)

export function loadText(id: string): Promise<string> {
  const e = entries.find((x) => x.info.id === id)
  return e ? e.load() : Promise.reject(new Error(`テキストがない: ${id}`))
}

/** 問題の試験名と分野番号に対応するテキスト。 */
export function textFor(exam: string, domain: string): TextInfo | undefined {
  return TEXTS.find((t) => t.exam.toLowerCase() === exam.toLowerCase() && t.number === domain)
}
