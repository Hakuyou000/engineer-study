import type { ReactNode } from 'react'

/** 問題文に出てくる範囲だけを扱う最小の Markdown 描画(コードブロック、表、インラインコード、太字)。 */
export function Md({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join('\n'))}</p>)
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
            <tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((r, k) => (
              <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
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
  // 解説は表の 1 セルに書くため、改行は <br> で表す
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*|<br\s*\/?>)/g).map((part, i) => {
    if (part.startsWith('`') && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.length > 3) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^<br\s*\/?>$/.test(part)) return <br key={i} />
    return part
  })
}
