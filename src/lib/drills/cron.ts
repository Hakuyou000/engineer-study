import type { Drill, Rng } from './types'
import { int } from './types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const DAY_MS = 86_400_000

/** cron の1フィールドを、当てはまる値の集合にする。曜日の 7 は 0(日曜)として扱う。 */
export function parseField(field: string, min: number, max: number, isDow = false): Set<number> {
  const out = new Set<number>()
  for (const part of field.split(',')) {
    const m = part.match(/^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/)
    if (!m) throw new Error(`cron のフィールドが不正: ${field}`)
    const step = m[4] ? Number(m[4]) : 1
    let lo: number
    let hi: number
    if (m[1] === '*') {
      lo = min
      hi = max
    } else {
      lo = Number(m[2])
      hi = m[3] !== undefined ? Number(m[3]) : m[4] ? max : lo
    }
    if (step < 1 || lo < min || hi > max || lo > hi) throw new Error(`cron のフィールドが範囲外: ${field}`)
    for (let v = lo; v <= hi; v += step) out.add(isDow && v === 7 ? 0 : v)
  }
  return out
}

export interface Cron {
  minute: Set<number>
  hour: Set<number>
  dom: Set<number>
  month: Set<number>
  dow: Set<number>
  domStar: boolean
  dowStar: boolean
}

export function parseCron(expr: string): Cron {
  const f = expr.trim().split(/\s+/)
  if (f.length !== 5) throw new Error(`cron 式は 5 フィールド: ${expr}`)
  return {
    minute: parseField(f[0], 0, 59),
    hour: parseField(f[1], 0, 23),
    dom: parseField(f[2], 1, 31),
    month: parseField(f[3], 1, 12),
    dow: parseField(f[4], 0, 7, true),
    domStar: f[2].startsWith('*'),
    dowStar: f[4].startsWith('*'),
  }
}

/** 日と曜日の判定。両方とも * 以外なら、どちらかに一致すればよい(OR)。 */
function dayMatches(c: Cron, d: Date): boolean {
  const dom = c.dom.has(d.getUTCDate())
  const dow = c.dow.has(d.getUTCDay())
  if (!c.domStar && !c.dowStar) return dom || dow
  return dom && dow
}

/**
 * from(UTC の時刻として扱う)より後で、最初に実行される時刻。分単位で切り上げる。
 * 4 年以内に見つからなければ null。
 */
export function nextRun(expr: string, from: Date): Date | null {
  const c = parseCron(expr)
  const start = Math.floor(from.getTime() / 60_000) * 60_000 + 60_000
  const startDay = Math.floor(start / DAY_MS) * DAY_MS
  for (let day = 0; day < 366 * 4; day++) {
    const d = new Date(startDay + day * DAY_MS)
    if (!c.month.has(d.getUTCMonth() + 1) || !dayMatches(c, d)) continue
    for (const h of [...c.hour].sort((a, b) => a - b)) {
      for (const m of [...c.minute].sort((a, b) => a - b)) {
        const t = d.getTime() + h * 3_600_000 + m * 60_000
        if (t >= start) return new Date(t)
      }
    }
  }
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatMinute(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function normalizeDateTime(s: string): string {
  const m = s
    .trim()
    .replace(/[/年月]/g, '-')
    .replace(/日/g, ' ')
    .replace('T', ' ')
    .replace(/\s+/g, ' ')
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2}) ?(\d{1,2}):(\d{1,2})$/)
  if (!m) return s.trim()
  return `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))} ${pad(Number(m[4]))}:${pad(Number(m[5]))}`
}

function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[int(rng, 0, xs.length - 1)]
}

function randomExpr(rng: Rng): string {
  const m = () => pick(rng, [0, 0, 5, 15, 30, 45])
  const h = () => int(rng, 0, 23)
  const templates: (() => string)[] = [
    () => `${m()} ${h()} * * *`,
    () => `*/${pick(rng, [5, 10, 15, 20, 30])} * * * *`,
    () => {
      const a = int(rng, 6, 10)
      return `${m()} ${a}-${a + int(rng, 6, 9)} * * 1-5`
    },
    () => `${m()} ${h()} * * ${int(rng, 0, 6)}`,
    () => `${m()} ${h()} ${int(rng, 1, 28)} * *`,
    () => {
      const a = int(rng, 0, 11)
      return `0 ${a},${a + int(rng, 1, 12)} * * *`
    },
    () => `${m()} */${pick(rng, [2, 3, 4, 6])} * * *`,
    () => `${m()} ${h()} ${int(rng, 1, 28)} * ${int(rng, 0, 6)}`,
    () => {
      const a = int(rng, 6, 10)
      return `0 ${a}-${a + 10}/2 * * *`
    },
    () => `${m()} ${h()} 1 ${pick(rng, ['*/3', '1,7', '4-6', '12'])} *`,
  ]
  return pick(rng, templates)()
}

export function genCronNext(rng: Rng): Drill {
  const expr = randomExpr(rng)
  const now = new Date(Date.UTC(2026, int(rng, 0, 11), int(rng, 1, 28), int(rng, 0, 23), int(rng, 0, 59)))
  const next = nextRun(expr, now)!
  const both = !parseCron(expr).domStar && !parseCron(expr).dowStar
  return {
    type: 'cron-next',
    prompt: `現在は ${formatMinute(now)}(${WEEKDAYS[now.getUTCDay()]})。crontab の \`${expr} /usr/local/bin/job.sh\` が次に実行される日時を答えよ。`,
    fields: [{ label: '日時(YYYY-MM-DD hh:mm)', answer: formatMinute(next), normalize: normalizeDateTime }],
    explain:
      `次に実行されるのは ${formatMinute(next)}(${WEEKDAYS[next.getUTCDay()]})です。crontab の時刻の欄は、左から「分 時 日 月 曜日」の順です。\`*\` はすべて、\`*/n\` は n ごと、\`a-b\` は範囲、\`a,b\` は列挙を表します。曜日は 0 と 7 がどちらも日曜です。` +
      (both ? '日と曜日の両方を指定しているので、どちらか一方に当てはまる日に実行されます(両方に当てはまる日ではありません)。' : ''),
  }
}
