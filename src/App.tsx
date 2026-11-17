import { useEffect, useMemo, useRef, useState } from 'react'
import { DrillView } from './components/DrillView'
import { Exam } from './components/Exam'
import { Home, type StartOptions } from './components/Home'
import { Quit } from './components/Quit'
import { StatsView } from './components/StatsView'
import { Study } from './components/Study'
import { TextView } from './components/TextView'
import { Toc, type Section } from './components/Toc'
import data from './data/questions.json'
import * as db from './lib/db'
import { buildStudySession, isCorrect, review, shuffle } from './lib/srs'
import { loadShufflePref, originalKeys, shuffleChoices } from './lib/shuffle'
import { examList, loadGroup, saveGroup } from './lib/groups'
import { computeStats, examLabel, groupByExam } from './lib/stats'
import { TEXTS } from './lib/texts'
import { weakQuestions } from './lib/weak'
import type { Attempt, Card, DrillAttempt, Question } from './lib/types'

const ALL_QUESTIONS = data as Question[]
const EXAMS = examList([...ALL_QUESTIONS.map((q) => q.exam), ...TEXTS.map((t) => t.exam)])

type View = { name: 'toc' | Section } | { name: 'study' | 'exam'; questions: Question[] }

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
  // 選択中の試験。null は「すべての試験」
  const [group, setGroup] = useState<string | null>(() => loadGroup(EXAMS))
  const [view, setView] = useState<View>(() => ({ name: loadGroup(EXAMS) === null ? 'toc' : 'home' }))
  const QUESTIONS = useMemo(
    () => (group === null ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.exam === group)),
    [group],
  )
  const [stopped, setStopped] = useState(false)
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
    [store, QUESTIONS],
  )
  const allGroups = useMemo(
    () => (store ? groupByExam(computeStats(ALL_QUESTIONS, store.attempts, store.cards, store.now)) : []),
    [store],
  )

  if (stopped) {
    return (
      <main>
        <section className="card">
          <h2>終了した</h2>
          <p>このタブは閉じてよい。履歴は保存済み。</p>
        </section>
      </main>
    )
  }
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
      // 並べ替えた問題でも、履歴には元の記号で保存する
      const attempt: Attempt = { questionId: q.id, ts: now, chosen: originalKeys(q, chosen), correct, ms, mode }
      const card = review(cards.get(q.id), q.id, correct ? 'good' : 'again', now)
      cards.set(q.id, card)
      attempts.push(attempt)
      db.saveAttempt(attempt, card).catch(fail)
    }
    setStore({ ...store, attempts, cards, now })
  }

  const prepare = (qs: Question[]) => (loadShufflePref() ? qs.map((q) => shuffleChoices(q)) : qs)

  const start = ({ kind, domains, size }: StartOptions) => {
    const pool = QUESTIONS.filter((q) => domains.includes(`${q.exam} ${q.domain}`))
    const questions =
      kind === 'study'
        ? buildStudySession(pool, store.cards, Date.now(), size)
        : kind === 'weak'
          ? weakQuestions(pool, store.attempts).slice(0, size)
          : shuffle(pool).slice(0, size)
    if (questions.length === 0) return
    setView({ name: kind === 'exam' ? 'exam' : 'study', questions: prepare(questions) })
  }

  /** 成績画面から、小項目の弱点だけを解く */
  const practiceSection = (domainKey: string, section: string) => {
    const pool = QUESTIONS.filter((q) => `${q.exam} ${q.domain}` === domainKey && q.section === section)
    const questions = weakQuestions(pool, store.attempts)
    if (questions.length > 0) setView({ name: 'study', questions: prepare(questions) })
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

  const openGroup = (g: string | null, section: Section) => {
    setGroup(g)
    saveGroup(g)
    setStore({ ...store, now: Date.now() })
    setView({ name: section })
  }

  const tab = (name: 'toc' | Section, label: string) => (
    <button className={view.name === name ? 'tab on' : 'tab'} onClick={name === 'home' ? home : () => setView({ name })}>
      {label}
    </button>
  )

  return (
    <main>
      <header>
        <h1>
          sre-drill
          <button className="link group-name" onClick={() => setView({ name: 'toc' })}>
            {group === null ? 'すべての試験' : examLabel(group)}
          </button>
        </h1>
        <nav>
          {tab('toc', '目次')}
          {tab('home', '問題演習')}
          {tab('drill', '計算ドリル')}
          {tab('text', 'テキスト')}
          {tab('stats', '成績')}
          {import.meta.env.DEV && <Quit onQuit={() => setStopped(true)} onError={setError} />}
        </nav>
      </header>

      {view.name === 'toc' && (
        <Toc
          groups={allGroups}
          textCount={(exam) => TEXTS.filter((t) => t.exam === exam).length}
          current={group}
          onOpen={openGroup}
        />
      )}

      {view.name === 'home' && <Home key={group ?? '*'} scopeKey={group ?? '*'} stats={stats} onStart={start} />}

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
          key={group ?? '*'}
          exam={group}
          onRecord={(type, correct, ms) => {
            const a: DrillAttempt = { type, correct, ms, ts: Date.now() }
            db.saveDrill(a).catch(fail)
            setStore({ ...store, drills: [...store.drills, a] })
          }}
        />
      )}

      {view.name === 'text' && <TextView key={group ?? '*'} exam={group} />}

      {view.name === 'stats' && (
        <StatsView
          exam={group}
          stats={stats}
          drills={store.drills}
          onPractice={practiceSection}
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
