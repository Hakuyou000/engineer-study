// 起動スクリプト(start.bat、start.command)から使う。依存パッケージを入れ直す必要があるかを、終了コードで返す。
// 0: 入れ直す(node_modules がない、または package-lock.json が前に入れたときより新しい)。1: 今のままでよい。
// npm の依存パッケージではなく Node.js だけで動かすので、node_modules がなくても実行できる。
import { statSync } from 'node:fs'
import process from 'node:process'

function mtime(path) {
  try {
    return statSync(path).mtimeMs
  } catch {
    return undefined
  }
}

const installed = mtime('node_modules/.package-lock.json')
const lock = mtime('package-lock.json')
process.exit(installed === undefined || lock === undefined || lock > installed ? 0 : 1)
