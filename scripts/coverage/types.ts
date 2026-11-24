/** 小項目ごとの、出題範囲の用語の一覧 */
export interface Objective {
  /** 重要度や配点。公式が出していない試験は null */
  weight: number | null
  /** [表示名, 正規表現]。正規表現が問題文、選択肢、入力問題の答え、解説のどれかに当たれば「出てくる」とみなす */
  terms: [label: string, pattern: string][]
}

/** キーは小項目の番号。問題の section の最初の語(CCNA の「2.0 / 2.1」は両方)と突き合わせる */
export type Table = Record<string, Objective>
