import type { ReactNode } from 'react'
import { LINKER } from '../lib/glossaryData'
import { TermLink } from './TermLink'

/** 用語集の用語に印を付けるときの状態。seen は印を付けた用語(最初の 1 回だけ付ける) */
export interface LinkCtx {
  seen: Set<string>
  exam?: string | null
}

/**
 * 問題文に出てくる範囲だけを扱う最小の Markdown 描画(コードブロック、表、インラインコード、太字)。
 * link を付けると、用語集の用語に印を付ける(exam を渡すと、その試験の用語だけ)。
 */
export function Md({ text, link }: { text: string; link?: { exam?: string | null } }) {
  const ctx: LinkCtx | undefined = link ? { seen: new Set(), exam: link.exam } : undefined
  const inl = (s: string) => inlineMd(s, ctx)
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inl(para.join('\n'))}</p>)
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('```')) {
      flush()
      const code: string[] = []
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) code.push(lines[i])
      blocks.push(<pre key={blocks.length}>{code.join('\n')}</pre>)
    } else if (l.startsWith('|')) {
      flush()
      const rows: string[][] = []
      for (; i < lines.length && lines[i].startsWith('|'); i++) {
        rows.push(lines[i].replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim()))
      }
      i--
      const [head, , ...body] = rows
      blocks.push(
        <table key={blocks.length}>
          <thead>
            <tr>{head.map((c, j) => <th key={j}>{inl(c)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((r, k) => (
              <tr key={k}>{r.map((c, j) => <td key={j}>{inl(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>,
      )
    } else if (l.trim() === '') {
      flush()
    } else {
      para.push(l)
    }
  }
  flush()
  return <div className="md">{blocks}</div>
}

export function inline(s: string): ReactNode[] {
  return inlineMd(s)
}

function terms(s: string, ctx: LinkCtx | undefined, key: string): ReactNode {
  if (!ctx) return s
  const pieces = LINKER.split(s, ctx.seen, ctx.exam)
  if (pieces.length === 1 && typeof pieces[0] === 'string') return s
  return pieces.map((p, i) => (typeof p === 'string' ? p : <TermLink key={`${key}-${i}`} name={p.term.name} text={p.text} />))
}

function inlineMd(s: string, ctx?: LinkCtx): ReactNode[] {
  // 段落の中の改行は、Obsidian と同じく画面でも改行する
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*|\n)/g).map((part, i) => {
    if (part.startsWith('`') && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.length > 3) return <strong key={i}>{terms(part.slice(2, -2), ctx, `b${i}`)}</strong>
    if (part === '\n') return <br key={i} />
    return ctx ? <span key={i}>{terms(part, ctx, `t${i}`)}</span> : part
  })
}
