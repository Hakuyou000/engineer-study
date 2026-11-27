/** 開発サーバの「終了」の入口で使う、要求が自分の PC のブラウザから来たかの判定。vite.config.ts から使う。 */

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

/** `localhost:5173` のような Host の値から、名前の部分を取り出す。読めなければ undefined */
function hostnameOf(host: string): string | undefined {
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return undefined
  }
}

/**
 * 終了の要求を受け付けてよいか。
 * - POST だけ
 * - Host が localhost、127.0.0.1、[::1] のどれか(DNS リバインディングで外のサイトの名前が来たら断る)
 * - Origin があれば、Host と同じであること(ほかのサイトのページからの POST を断る)
 */
export function isLocalShutdownRequest(req: { method?: string; headers: { host?: string; origin?: string } }): boolean {
  if (req.method !== 'POST') return false
  const host = req.headers.host
  if (!host) return false
  const hostname = hostnameOf(host)
  if (!hostname || !LOCAL_HOSTNAMES.has(hostname)) return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === new URL(`http://${host}`).host
  } catch {
    return false
  }
}
