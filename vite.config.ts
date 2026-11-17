import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** 開発サーバを画面の「終了」ボタンから止めるための入口。同一オリジンからの POST だけ受け付ける。 */
function shutdownPlugin(): Plugin {
  return {
    name: 'sre-drill-shutdown',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shutdown', (req, res) => {
        const origin = req.headers.origin
        let sameOrigin = true
        if (origin) {
          try {
            sameOrigin = new URL(origin).host === req.headers.host
          } catch {
            sameOrigin = false
          }
        }
        if (req.method !== 'POST' || !sameOrigin) {
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
  test: { include: ['src/**/*.test.ts'] },
})
