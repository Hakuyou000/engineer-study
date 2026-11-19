import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { termId } from '../lib/glossary'
import { LINKER } from '../lib/glossaryData'
import { TermLink } from './TermLink'

const PREFIX = '#glossary-'

interface MdNode {
  type: string
  value?: string
  url?: string
  children?: MdNode[]
}

// 見出し、コード、リンクの中には印を付けない
const SKIP = new Set(['heading', 'code', 'inlineCode', 'link', 'linkReference', 'html', 'definition'])

/** 本文の用語を、用語集へのリンクの印に置き換える remark のプラグイン。用語ごとに最初の 1 回だけ */
function remarkGlossary(options: { exam?: string | null }) {
  return (tree: MdNode) => {
    const seen = new Set<string>()
    const walk = (node: MdNode) => {
      if (!node.children || SKIP.has(node.type)) return
      const next: MdNode[] = []
      for (const child of node.children) {
        if (child.type === 'text' && child.value) {
          for (const p of LINKER.split(child.value, seen, options.exam)) {
            if (typeof p === 'string') next.push({ type: 'text', value: p })
            else next.push({ type: 'link', url: PREFIX + termId(p.term.name), children: [{ type: 'text', value: p.text }] })
          }
        } else {
          walk(child)
          next.push(child)
        }
      }
      node.children = next
    }
    walk(tree)
  }
}

/** テキスト本文用の Markdown 描画。React.lazy で遅延読み込みする。exam を渡すと、その試験の用語に印を付ける */
export default function Markdown({ text, exam }: { text: string; exam?: string | null }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkGlossary, { exam }]]}
        components={{
          table: (props) => (
            <div className="scroll">
              <table {...props} />
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a: ({ href, children, node, ...rest }) => {
            if (href?.startsWith(PREFIX)) {
              return <TermLink name={decodeURIComponent(href.slice(PREFIX.length))} text={String(children)} />
            }
            return (
              <a href={href} {...rest} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
