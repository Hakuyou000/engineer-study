import ReactMarkdown from 'react-markdown'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkGfm from 'remark-gfm'
import { termId } from '../lib/glossary'
import { LINKER } from '../lib/glossaryData'
import { imageUrl } from '../lib/texts'
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
// 段落や表のセルごとの印の上限。導入の段落に点線が並びすぎないようにする
const BLOCKS = new Set(['paragraph', 'tableCell'])
const MAX_TERMS_PER_BLOCK = 3

/** 本文の用語を、用語集へのリンクの印に置き換える remark のプラグイン。用語ごとに最初の 1 回だけ。1 つの段落に MAX_TERMS_PER_BLOCK 個まで */
function remarkGlossary(options: { exam?: string | null }) {
  return (tree: MdNode) => {
    const seen = new Set<string>()
    const walk = (node: MdNode, block: { count: number }) => {
      if (!node.children || SKIP.has(node.type)) return
      const here = BLOCKS.has(node.type) ? { count: 0 } : block
      const next: MdNode[] = []
      for (const child of node.children) {
        if (child.type === 'text' && child.value) {
          for (const p of LINKER.split(child.value, seen, options.exam)) {
            if (typeof p === 'string') next.push({ type: 'text', value: p })
            else if (here.count >= MAX_TERMS_PER_BLOCK) {
              // 上限を超えた語は印を付けず、後の段落で付けられるようにする
              seen.delete(p.term.name)
              next.push({ type: 'text', value: p.text })
            } else {
              here.count += 1
              next.push({ type: 'link', url: PREFIX + termId(p.term.name), children: [{ type: 'text', value: p.text }] })
            }
          }
        } else {
          walk(child, here)
          next.push(child)
        }
      }
      node.children = next
    }
    walk(tree, { count: 0 })
  }
}

/** テキスト本文用の Markdown 描画。React.lazy で遅延読み込みする。exam を渡すと、その試験の用語に印を付ける。textId を渡すと、そのテキストの図の画像を表示する */
export default function Markdown({ text, exam, textId }: { text: string; exam?: string | null; textId?: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        // remark-cjk-friendly: 「**層(レイヤー)**を」のように、括弧の直後の ** に日本語が続いても太字にする
        remarkPlugins={[remarkGfm, remarkCjkFriendly, [remarkGlossary, { exam }]]}
        components={{
          table: (props) => (
            <div className="scroll">
              <table {...props} />
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          img: ({ src, alt, node, ...rest }) => {
            const url = textId && typeof src === 'string' ? imageUrl(textId, src) : undefined
            if (!url) return <span className="figure-missing">[図: {alt}]</span>
            return <img {...rest} src={url} alt={alt ?? ''} className="figure" loading="lazy" />
          },
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
