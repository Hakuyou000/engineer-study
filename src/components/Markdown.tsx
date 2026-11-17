import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** テキスト本文用の Markdown 描画。React.lazy で遅延読み込みする。 */
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (props) => (
            <div className="scroll">
              <table {...props} />
            </div>
          ),
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
