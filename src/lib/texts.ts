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

/** テキストを画面に出すときの 1 ページ。 */
export interface Page {
  /** ページの見出し(## か ### の見出しの文字) */
  heading: string
  /** ### で分けたページのとき、属する ## の見出し。分けていなければ undefined */
  parent?: string
  /** そのページの本文 */
  body: string
}

/** この文字数を超える ## の節は、### ごとのページに分ける */
export const PAGE_MAX = 5000
/** ### で分けたとき、この文字数に満たない部分は前の部分とまとめる */
export const PAGE_MIN = 1500

/**
 * テキストを読む単位のページに分ける。
 * ## の節を 1 ページにする。長い節(PAGE_MAX を超える)は ### ごとに分け、短い部分(PAGE_MIN 未満)は前とまとめる(短い前置きは最初の ### と)。
 * 最初の ## より前(題名と前書き)は、最初のページの先頭に付ける。
 */
export function splitPages(md: string): Page[] {
  const text = md.replace(/\r\n/g, '\n')
  const sections = splitSections(text)
  if (sections.length === 0) return text.trim() ? [{ heading: '', body: text.trimEnd() }] : []
  const intro = text.slice(0, text.indexOf(sections[0].body)).trim()

  const pages = sections.flatMap(sectionPages)
  if (intro) pages[0] = { ...pages[0], body: `${intro}\n\n${pages[0].body}` }
  return pages
}

/** ## の節 1 つをページに分ける。長い節(PAGE_MAX を超える)は ### ごとに分け、短い部分(PAGE_MIN 未満)は前とまとめる */
export function sectionPages(s: Section): Page[] {
  const parts = splitSubsections(s.body)
  if (s.body.length <= PAGE_MAX || parts.length === 1) return [{ heading: s.heading, body: s.body }]
  // parts[0] は ## の見出しと、最初の ### までの前置き
  const merged: { heading: string; body: string }[] = []
  let cur = { heading: s.heading, body: parts[0].body }
  for (const p of parts.slice(1)) {
    if (cur.body.length < PAGE_MIN || p.body.length < PAGE_MIN) {
      // 短い部分は前とまとめ、見出しは先の部分のものを残す
      cur = { heading: cur.heading, body: `${cur.body}\n\n${p.body}` }
    } else {
      merged.push(cur)
      cur = { heading: p.heading, body: p.body }
    }
  }
  if (cur.body.length < PAGE_MIN && merged.length > 0) merged[merged.length - 1].body += `\n\n${cur.body}`
  else merged.push(cur)
  return merged.map((m) => ({ heading: m.heading, parent: s.heading, body: m.body }))
}

/** ## の節の本文を ### の見出しで分ける。最初の要素は ### より前(## の見出しを含む)。コードブロック内は無視する */
function splitSubsections(body: string): { heading: string; body: string }[] {
  const out: { heading: string; lines: string[] }[] = [{ heading: '', lines: [] }]
  let inFence = false
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    const m = inFence ? null : line.match(/^### (.+)$/)
    if (m) out.push({ heading: m[1].trim(), lines: [line] })
    else out[out.length - 1].lines.push(line)
  }
  return out.map((o) => ({ heading: o.heading, body: o.lines.join('\n').trimEnd() }))
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

// 図の画像(texts/<試験>/images/*.svg)。本文からは `![説明](images/名前.svg)` で参照する
const images = import.meta.glob<string>('../../texts/*/images/*.svg', { query: '?url', import: 'default', eager: true })

/** 本文の画像の参照(`images/名前.svg`)を、テキストの id(`ccna/CCNA_1.0_…`)から URL にする。なければ undefined */
export function imageUrl(textId: string, src: string): string | undefined {
  const dir = textId.split('/')[0]
  if (!/^images\/[\w.-]+\.svg$/.test(src)) return undefined
  return images[`../../texts/${dir}/${src}`]
}

/** 問題の試験名と分野番号に対応するテキスト。 */
export function textFor(exam: string, domain: string): TextInfo | undefined {
  return TEXTS.find((t) => t.exam.toLowerCase() === exam.toLowerCase() && t.number === domain)
}
