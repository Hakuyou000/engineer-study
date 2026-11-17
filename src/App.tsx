import { useEffect, useMemo, useRef, useState } from 'react'
import { DrillView } from './components/DrillView'
import { Exam } from './components/Exam'
import { Home, type StartOptions } from './components/Home'
import { StatsView } from './components/StatsView'
import { Study } from './components/Study'
import { TextView } from './components/TextView'
import data from './data/questions.json'
import * as db from './lib/db'
import { buildStudySession, isCorrect, review, shuffle } from './lib/srs'
import { computeStats } from './lib/stats'
import type { Attempt, Card, DrillAttempt, Question } from './lib/types'

const QUESTIONS = data as Question[]

type View = { name: 'home' | 'drill' | 'text' | 'stats' } | { name: 'study' | 'exam'; questions: Question[] }

interface Store {
  attempts: Attempt[]
  cards: Map<string, Card>
  drills: DrillAttempt[]
  /** 集計の基準時刻。記録のたびに更新する */
  now: number
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function fetchStore(): Promise<Store> {
  const { attempts, cards, drills } = await db.loadAll()
  return { attempts, cards: new Map(cards.map((c) => [c.questionId, c])), drills, now: Date.now() }
}

export function App() {
  const [store, setStore] = useState<Store | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ name: 'home' })
  // 「自信なし」で格下げするために、直前の解答より前のカード状態を残す
  const prevCard = useRef<{ id: string; card: Card | undefined } | null>(null)

  const fail = (e: unknown) => setError(message(e))
  const reload = () => fetchStore().then(setStore).catch(fail)

  useEffect(() => {
    fetchStore()
      .then(setStore)
      .catch((e: unknown) => setError(message(e)))
  }, [])

  const stats = useMemo(
    () => (store ? computeStats(QUESTIONS, store.attempts, store.cards, store.now) : []),
    [store],
  )

  if (error) {
    return (
      <main>
        <section className="card">
          <h2>エラー</h2>
          <p>{error}</p>
          <button onClick={() => setError(null)}>閉じる</button>
        </section>
      </main>
    )
  }
  if (!store) return <main>読み込み中</main>
  const session = 'questions' in view ? view : null

  const record = (entries: { q: Question; chosen: string[]; ms: number }[], mode: Attempt['mode']) => {
    const now = Date.now()
    const cards = new Map(store.cards)
    const attempts = [...store.attempts]
    for (const { q, chosen, ms } of entries) {
      const correct = isCorrect(q, chosen)
      const attempt: Attempt = { questionId: q.id, ts: now, chosen, correct, ms, mode }
      const card = review(cards.get(q.id), q.id, correct ? 'good' : 'again', now)
      cards.set(q.id, card)
      attempts.push(attempt)
      db.saveAttempt(attempt, card).catch(fail)
    }
    setStore({ ...store, attempts, cards, now })
  }

  const start = ({ kind, domains, size }: StartOptions) => {
    const pool = QUESTIONS.filter((q) => domains.includes(`${q.exam} ${q.domain}`))
    const questions =
      kind === 'study' ? buildStudySession(pool, store.cards, Date.now(), size) : shuffle(pool).slice(0, size)
    if (questions.length === 0) return
    setView({ name: kind === 'exam' ? 'exam' : 'study', questions })
  }

  const home = () => {
    setStore({ ...store, now: Date.now() })
    setView({ name: 'home' })
  }

  const exportData = async () => {
    const blob = new Blob([JSON.stringify(await db.exportAll())], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sre-drill-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const tab = (name: 'home' | 'drill' | 'text' | 'stats', label: string) => (
    <button className={view.name === name ? 'tab on' : 'tab'} onClick={name === 'home' ? home : () => setView({ name })}>
      {label}
    </button>
  )

  return (
    <main>
      <header>
        <h1>sre-drill</h1>
        <nav>
          {tab('home', '問題演習')}
          {tab('drill', '計算ドリル')}
          {tab('text', 'テキスト')}
          {tab('stats', '成績')}
        </nav>
      </header>

      {view.name === 'home' && <Home stats={stats} onStart={start} />}

      {session?.name === 'study' && (
        <Study
          questions={session.questions}
          onAnswer={(q, chosen, ms) => {
            prevCard.current = { id: q.id, card: store.cards.get(q.id) }
            record([{ q, chosen, ms }], 'study')
          }}
          onHard={(q) => {
            if (prevCard.current?.id !== q.id) return
            const card = review(prevCard.current.card, q.id, 'hard', Date.now())
            db.saveCard(card).catch(fail)
            setStore({ ...store, cards: new Map(store.cards).set(q.id, card) })
          }}
          onExit={home}
        />
      )}

      {session?.name === 'exam' && (
        <Exam
          questions={session.questions}
          seconds={session.questions.length * 90}
          onFinish={(answers, elapsedMs) =>
            record(
              session.questions.map((q) => ({
                q,
                chosen: answers.get(q.id) ?? [],
                ms: Math.round(elapsedMs / session.questions.length),
              })),
              'exam',
            )
          }
          onExit={home}
        />
      )}

      {view.name === 'drill' && (
        <DrillView
          onRecord={(type, correct, ms) => {
            const a: DrillAttempt = { type, correct, ms, ts: Date.now() }
            db.saveDrill(a).catch(fail)
            setStore({ ...store, drills: [...store.drills, a] })
          }}
        />
      )}

      {view.name === 'text' && <TextView />}

      {view.name === 'stats' && (
        <StatsView
          stats={stats}
          drills={store.drills}
          onExport={() => void exportData().catch(fail)}
          onImport={(file) =>
            void file
              .text()
              .then((t) => db.importAll(JSON.parse(t) as db.Backup))
              .then(reload)
              .catch(fail)
          }
          onReset={() => void db.clearAll().then(reload).catch(fail)}
        />
      )}
    </main>
  )
}
