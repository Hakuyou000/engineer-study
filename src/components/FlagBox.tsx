import { useEffect, useState } from 'react'
import * as db from '../lib/db'
import { FLAG_KINDS, type Flag, type FlagKind, type Question } from '../lib/types'

/**
 * 解説の下に置く「この問題に指摘する」。指摘はこのブラウザに保存し、エクスポートに含める。
 * 直すときは、エクスポートしたファイルを npm run triage に渡す。
 */
export function FlagBox({ q }: { q: Question }) {
  const [flag, setFlag] = useState<Flag | null | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const [kind, setKind] = useState<FlagKind>(FLAG_KINDS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    db.loadFlag(q.id)
      .then((f) => live && setFlag(f ?? null))
      .catch(() => live && setFlag(null))
    return () => {
      live = false
    }
  }, [q.id])

  if (flag === undefined) return null

  const save = () => {
    const f: Flag = { questionId: q.id, code: q.code, ts: Date.now(), kind, note: note.trim() }
    db.saveFlag(f)
      .then(() => {
        setFlag(f)
        setEditing(false)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }
  const remove = () => {
    db.deleteFlag(q.id)
      .then(() => setFlag(null))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  if (flag && !editing) {
    return (
      <p className="flag-box meta">
        指摘済み: {flag.kind}
        {flag.note && `「${flag.note}」`}
        <button type="button" className="link" onClick={remove}>
          取り消す
        </button>
      </p>
    )
  }

  if (!editing) {
    return (
      <p className="flag-box">
        <button type="button" className="link" onClick={() => setEditing(true)}>
          この問題に指摘する
        </button>
      </p>
    )
  }

  return (
    <div className="flag-box flag-form">
      <label>
        種類
        <select value={kind} onChange={(e) => setKind(e.target.value as FlagKind)}>
          {FLAG_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label>
        内容(任意)
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="どこが、どう違うか" />
      </label>
      <div className="actions">
        <button type="button" onClick={save}>
          保存する
        </button>
        <button type="button" onClick={() => setEditing(false)}>
          やめる
        </button>
      </div>
      {error && <p className="meta">{error}</p>}
    </div>
  )
}
