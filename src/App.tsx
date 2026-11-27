import { useEffect, useMemo, useRef, useState } from 'react'
import { DrillView } from './components/DrillView'
import { CertView } from './components/CertView'
import { Exam } from './components/Exam'
import { ExamSwitch } from './components/ExamSwitch'
import { GlossaryView } from './components/GlossaryView'
import { Home, type StartOptions } from './components/Home'
import { Quit } from './components/Quit'
import { RoadmapView } from './components/RoadmapView'
import { StatsView } from './components/StatsView'
import { Study } from './components/Study'
import { TextView } from './components/TextView'
import { Toc, type Section } from './components/Toc'
import data from './data/questions.json'
import * as db from './lib/db'
import { buildStudySession, isCorrect, review, shuffle } from './lib/srs'
import { loadShufflePref, originalKeys, shuffleChoices } from './lib/shuffle'
import { examList, loadGroup, saveGroup } from './lib/groups'
import { canInput, toInput } from './lib/input'
import { computeStats, examLabel, groupByExam } from './lib/stats'
import { TEXTS } from './lib/texts'
import { certById } from './lib/certs'
import { weakQuestions } from './lib/weak'
import { loadResume, saveResume } from './lib/resume'
import { OPEN_GLOSSARY } from './lib/glossaryData'
import type { Attempt, Card, DrillAttempt, Question } from './lib/types'

const ALL_QUESTIONS = data as Question[]
const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))
const EXAMS = examList([...ALL_QUESTIONS.map((q) => q.exam), ...TEXTS.map((t) => t.exam)])

type View =
  | { name: 'toc' | Section }
  | { name: 'roadmap'; focus?: string | null }
  | { name: 'glossary'; focus?: string | null }
  | { name: 'cert'; id: string }
  | { name: 'study' | 'exam'; questions: Question[]; resumed?: ('ok' | 'ng')[] }

/** 履歴に積む画面の記録。問題の一覧は大きいので入れない */
type ViewEntry = Exclude<View, { questions: Question[] }> | { name: 'study' | 'exam' }
interface HistoryEntry {
  sreDrill: true
  idx: number
  view: ViewEntry
  group: string | null
}
// 問題演習と模擬試験の問題は大きいので、履歴には入れず、ここに置く(履歴の位置 → 問題)
const SESSIONS = new Map<number, Question[]>()
// 画面を離れる前の確認に使う状態。App は 1 つだけなので、モジュールに置く
const guard = {
  /** 模擬試験を解いている間は true */
  examActive: false,
  /** 今の画面の履歴の記録。「戻る」を取り消したときに積み直す */
  current: null as HistoryEntry | null,
}
const LEAVE_EXAM = '模擬試験を中止しますか。答えは記録されません。'
/** 模擬試験の途中なら確かめる。離れてよければ true */
function mayLeave(): boolean {
  if (guard.examActive && !window.confirm(LEAVE_EXAM)) return false
  guard.examActive = false
  return true
}
function setExamActive(active: boolean) {
  guard.examActive = active
}
function setCurrent(entry: HistoryEntry) {
  guard.current = entry
}
const toEntry = (v: View): ViewEntry => ('questions' in v ? { name: v.name } : v)

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
  // 保存や読み込みの失敗。画面はそのままにして、上に知らせる
  const [notice, setNotice] = useState<string | null>(null)
  // 選択中の試験。null は「すべての試験」
  const [group, setGroup] = useState<string | null>(() => loadGroup(EXAMS))
  // 起動したときは、選んでいた試験に関係なく目次から始める
  const [view, setViewRaw] = useState<View>({ name: 'toc' })
  // ブラウザの履歴での位置。0 なら戻る先がない
  const [depth, setDepth] = useState(0)
  const QUESTIONS = useMemo(
    () => (group === null ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.exam === group)),
    [group],
  )
  const [stopped, setStopped] = useState(false)
  // 「自信なし」で格下げするために、直前の解答より前のカード状態を残す
  const prevCard = useRef<{ id: string; card: Card | undefined } | null>(null)

  /** 画面を移る。ブラウザの履歴にも積むので、ブラウザの「戻る」やスワイプでも前の画面に戻れる */
  const navigate = (next: View, nextGroup: string | null = group) => {
    if (!mayLeave()) return
    const idx = depth + 1
    if ('questions' in next) SESSIONS.set(idx, next.questions)
    const entry: HistoryEntry = { sreDrill: true, idx, view: toEntry(next), group: nextGroup }
    setCurrent(entry)
    try {
      history.pushState(entry, '')
    } catch {
      // 履歴に積めなくても、画面は移る
    }
    setDepth(idx)
    if (nextGroup !== group) {
      setGroup(nextGroup)
      saveGroup(nextGroup)
    }
    setViewRaw(next)
    // 新しい画面は先頭から出す(用語集やロードマップは、開いた後に該当の位置へ送る)
    window.scrollTo(0, 0)
  }
  const setView = (next: View) => navigate(next)

  // 最初の画面を履歴に記録し、「戻る」で前の画面を出す
  useEffect(() => {
    const first: HistoryEntry = { sreDrill: true, idx: 0, view: toEntry(view), group }
    setCurrent(first)
    history.replaceState(first, '')
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistoryEntry | null
      if (!st?.sreDrill) return
      if (!mayLeave()) {
        // 戻るを取り消す。模擬試験の画面の記録を積み直す
        if (guard.current) history.pushState(guard.current, '')
        return
      }
      setCurrent(st)
      // 問題演習から戻ったときに、復習待ちの数を今の時刻で数え直す
      setStore((s) => s && { ...s, now: Date.now() })
      setDepth(st.idx)
      setGroup(st.group)
      saveGroup(st.group)
      if (st.view.name === 'study' || st.view.name === 'exam') {
        const qs = SESSIONS.get(st.idx)
        setViewRaw(qs ? { name: st.view.name, questions: qs } : { name: 'home' })
      } else {
        setViewRaw(st.view as View)
      }
    }
    // 模擬試験の途中でタブを閉じたり再読み込みしたりするときも確かめる
    const onUnload = (e: BeforeUnloadEvent) => {
      if (guard.examActive) e.preventDefault()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('beforeunload', onUnload)
    }
    // 最初の 1 回だけ。以降の画面の移動は navigate が履歴に積む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fail = (e: unknown) => setNotice(message(e))
  const reload = () => fetchStore().then(setStore).catch(fail)

  // 本文の用語から「用語集で開く」を押したとき
  useEffect(() => {
    const open = (e: Event) => navigate({ name: 'glossary', focus: (e as CustomEvent<string | null>).detail })
    window.addEventListener(OPEN_GLOSSARY, open)
    return () => window.removeEventListener(OPEN_GLOSSARY, open)
  })

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
          <h2>終了しました</h2>
          <p>解答の履歴は保存されています。このタブは Ctrl+W(Mac は ⌘W)で閉じられます。</p>
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
          : kind === 'input'
            ? buildStudySession(pool.filter(canInput), store.cards, Date.now(), size).map(toInput)
            : shuffle(pool).slice(0, size)
    if (questions.length === 0) return
    setView({ name: kind === 'exam' ? 'exam' : 'study', questions: prepare(questions) })
  }

  /** テキストの最後から、その章(分野)の問題を解く。解くべき問題がなければ、範囲から無作為に出す */
  const practiceDomain = (exam: string, domain: string) => {
    const pool = QUESTIONS.filter((q) => q.exam === exam && q.domain === domain)
    const due = buildStudySession(pool, store.cards, Date.now(), 10)
    const questions = due.length > 0 ? due : shuffle(pool).slice(0, 10)
    if (questions.length > 0) setView({ name: 'study', questions: prepare(questions) })
  }

  /** 成績画面から、小項目の弱点だけを解く */
  const practiceSection = (domainKey: string, section: string) => {
    const pool = QUESTIONS.filter((q) => `${q.exam} ${q.domain}` === domainKey && q.section === section)
    const questions = weakQuestions(pool, store.attempts)
    if (questions.length > 0) setView({ name: 'study', questions: prepare(questions) })
  }

  /** 前回の途中の問題演習を、続きから再開する */
  const resume = () => {
    const r = loadResume()
    if (!r) return
    const qs = r.items.map((it) => {
      const o = BY_ID.get(it.id)
      return o && (it.input ? toInput(o) : o)
    })
    if (qs.some((x) => x === undefined)) {
      // 問題が見つからない(教材から消えた)ときは、再開できない
      saveResume(null)
      setStore({ ...store, now: Date.now() })
      return
    }
    navigate({ name: 'study', questions: prepare(qs as Question[]), resumed: r.results }, r.group)
  }

  const home = () => {
    setStore({ ...store, now: Date.now() })
    setView({ name: 'home' })
  }

  const exportData = async () => {
    const blob = new Blob([JSON.stringify(await db.exportAll())], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `engineer-study-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const openGroup = (g: string | null, section: Section) => {
    setStore({ ...store, now: Date.now() })
    navigate({ name: section }, g)
  }

  /** 上の帯で試験を選んだ。今の画面のまま、試験だけを切り替える(用語集は開いていた用語を閉じる) */
  const switchGroup = (g: string | null) => {
    if (session) return
    setStore({ ...store, now: Date.now() })
    navigate(view.name === 'glossary' ? { name: 'glossary' } : view, g)
  }

  const isOn = (name: string) => view.name === name || (name === 'roadmap' && view.name === 'cert') || (name === 'home' && session !== null)
  const tab = (name: 'toc' | 'roadmap' | 'glossary' | Section, label: string) => (
    <button
      className={isOn(name) ? 'tab on' : 'tab'}
      aria-current={isOn(name) ? 'page' : undefined}
      onClick={name === 'home' ? home : () => setView({ name } as View)}>
      {label}
    </button>
  )

  return (
    <div className="shell">
      <header className="appbar">
        <div className="appbar-top">
          {depth > 0 && (
            <button className="back" onClick={() => history.back()} aria-label="前の画面に戻る">
              <span aria-hidden="true">‹</span>
              <span className="back-label">戻る</span>
            </button>
          )}
          <h1 className="brand">engineer-study</h1>
          <ExamSwitch
            groups={allGroups}
            current={group}
            locked={session !== null}
            onSelect={switchGroup}
            onToc={() => setView({ name: 'toc' })}
          />
          <div className="appbar-aux">
            {tab('roadmap', 'ロードマップ')}
            {tab('glossary', '用語集')}
            {import.meta.env.DEV && <Quit onQuit={() => setStopped(true)} onError={setNotice} />}
          </div>
        </div>
        <nav className="sections" aria-label="画面">
          {tab('toc', '目次')}
          {tab('home', '問題演習')}
          {tab('drill', '計算ドリル')}
          {tab('text', 'テキスト')}
          {tab('stats', '成績')}
        </nav>
      </header>
      {notice && (
        <div className="notice" role="alert">
          <p>
            うまくいきませんでした: {notice}
            <br />
            画面はそのまま使えます。続くときは、成績の画面から履歴をエクスポートしてください。
          </p>
          <button onClick={() => setNotice(null)}>閉じる</button>
        </div>
      )}
      <main>
      {view.name === 'toc' && (
        <Toc
          groups={allGroups}
          textCount={(exam) => TEXTS.filter((t) => t.exam === exam).length}
          current={group}
          onOpen={openGroup}
          onCert={(id) => setView({ name: 'cert', id })}
          onRoadmap={() => setView({ name: 'roadmap' })}
        />
      )}

      {view.name === 'roadmap' && (
        <RoadmapView
          groups={allGroups}
          focus={view.focus}
          onOpen={(exam) => openGroup(exam, 'home')}
          onCert={(id) => setView({ name: 'cert', id })}
        />
      )}

      {view.name === 'cert' && certById(view.id) && (
        <CertView
          cert={certById(view.id)!}
          stats={allGroups.filter((g) => certById(view.id)!.exams?.includes(g.key))}
          onOpen={openGroup}
          onRoadmap={(focus) => setView({ name: 'roadmap', focus })}
        />
      )}

      {view.name === 'home' && (
        <Home
          key={group ?? '*'}
          scopeKey={group ?? '*'}
          stats={stats}
          inputCount={(domains) => QUESTIONS.filter((q) => domains.includes(`${q.exam} ${q.domain}`) && canInput(q)).length}
          onStart={start}
          onResume={resume}
          examChoices={group === null ? allGroups.map((g) => ({ key: g.key, label: examLabel(g.key) })) : null}
          onPickExam={(exam) => navigate({ name: 'home' }, exam)}
          onOpenCode={(code) => {
            const q = ALL_QUESTIONS.find((x) => x.code.toLowerCase() === code.trim().toLowerCase())
            if (q) setView({ name: 'study', questions: prepare([q]) })
            return q !== undefined
          }}
        />
      )}

      {session?.name === 'study' && (
        <Study
          key={depth}
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
          onRetry={(qs) => setView({ name: 'study', questions: prepare(qs) })}
          resumed={session.resumed}
          onProgress={(results) =>
            saveResume({
              items: session.questions.map((q) => ({ id: q.id, input: q.kind === 'input' && BY_ID.get(q.id)?.kind !== 'input' })),
              results,
              group,
              ts: Date.now(),
            })
          }
        />
      )}

      {session?.name === 'exam' && (
        <Exam
          key={depth}
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
          onRetry={(qs) => setView({ name: 'study', questions: prepare(qs) })}
          onActive={setExamActive}
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

      {view.name === 'text' && (
        <TextView
          key={group ?? '*'}
          exam={group}
          onPractice={practiceDomain}
          onOpenHome={(exam) => openGroup(group === null ? null : exam, 'home')}
        />
      )}

      {view.name === 'glossary' && <GlossaryView key={`${group ?? '*'}:${view.focus ?? ''}`} exam={group} focus={view.focus} />}

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
    </div>
  )
}
