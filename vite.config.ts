import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { isLocalShutdownRequest } from './scripts/local-request'

/** 開発サーバを画面の「終了」ボタンから止めるための入口。自分の PC(localhost)の同一オリジンからの POST だけ受け付ける。
 * この入口は Vite の Host の検査より前に動くので、Host もここで確かめる。 */
function shutdownPlugin(): Plugin {
  return {
    name: 'engineer-study-shutdown',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shutdown', (req, res) => {
        if (!isLocalShutdownRequest(req)) {
          res.statusCode = 403
          res.end()
          return
        }
        res.end('bye')
        setTimeout(() => {
          void server.close().finally(() => process.exit(0))
        }, 100)
      })
    },
  }
}

export default defineConfig({
  // GitHub Pages のサブパス配信でも動くよう相対パスにする
  base: './',
  plugins: [react(), shutdownPlugin()],
  // 問題データ(JSON)を本体に同梱しているため。ローカルで使う前提なので分割はしない
  build: { chunkSizeWarningLimit: 1000 },
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] },
})
