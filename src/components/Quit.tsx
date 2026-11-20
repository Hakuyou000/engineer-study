import { useState } from 'react'

/** 開発サーバを止める。start.bat で起動したときは、黒いウィンドウも閉じる。 */
export function Quit({ onQuit, onError }: { onQuit: () => void; onError: (message: string) => void }) {
  const [confirming, setConfirming] = useState(false)

  const quit = () => {
    fetch('/__shutdown', { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error(`終了できませんでした(${r.status})`)
        onQuit()
        // ブラウザは、スクリプトで開いていないタブを、履歴が 2 件以上あると閉じさせない(画面の移動で履歴を積むので、ほぼ閉じない)。
        // 閉じられないときは、終了の画面に Ctrl+W の案内を出したままにする
        window.close()
      })
      .catch((e: unknown) => onError(e instanceof Error ? e.message : String(e)))
  }

  if (!confirming) {
    return (
      <button className="tab quit" onClick={() => setConfirming(true)}>
        終了
      </button>
    )
  }
  return (
    <>
      <button className="danger" onClick={quit}>
        終了する
      </button>
      <button onClick={() => setConfirming(false)}>やめる</button>
    </>
  )
}
