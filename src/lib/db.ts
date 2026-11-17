import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Attempt, Card, DrillAttempt } from './types'

interface Schema extends DBSchema {
  attempts: { key: number; value: Attempt; indexes: { questionId: string } }
  cards: { key: string; value: Card }
  drills: { key: number; value: DrillAttempt }
}

export interface Backup {
  version: 1
  exportedAt: string
  attempts: Attempt[]
  cards: Card[]
  drills: DrillAttempt[]
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null

function db() {
  dbp ??= openDB<Schema>('sre-drill', 1, {
    upgrade(d) {
      d.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true }).createIndex('questionId', 'questionId')
      d.createObjectStore('cards', { keyPath: 'questionId' })
      d.createObjectStore('drills', { keyPath: 'id', autoIncrement: true })
    },
  })
  return dbp
}

export async function loadAll() {
  const d = await db()
  const [attempts, cards, drills] = await Promise.all([d.getAll('attempts'), d.getAll('cards'), d.getAll('drills')])
  return { attempts, cards, drills }
}

export async function saveAttempt(attempt: Attempt, card: Card) {
  const d = await db()
  const tx = d.transaction(['attempts', 'cards'], 'readwrite')
  await Promise.all([tx.objectStore('attempts').add(attempt), tx.objectStore('cards').put(card), tx.done])
}

export async function saveCard(card: Card) {
  await (await db()).put('cards', card)
}

export async function saveDrill(a: DrillAttempt) {
  await (await db()).add('drills', a)
}

export async function exportAll(): Promise<Backup> {
  return { version: 1, exportedAt: new Date().toISOString(), ...(await loadAll()) }
}

/** 既存の履歴をすべて置き換える。 */
export async function importAll(b: Backup) {
  if (b.version !== 1 || !Array.isArray(b.attempts) || !Array.isArray(b.cards) || !Array.isArray(b.drills)) {
    throw new Error('バックアップの形式が違う')
  }
  const d = await db()
  const tx = d.transaction(['attempts', 'cards', 'drills'], 'readwrite')
  await Promise.all([tx.objectStore('attempts').clear(), tx.objectStore('cards').clear(), tx.objectStore('drills').clear()])
  for (const a of b.attempts) await tx.objectStore('attempts').add({ ...a, id: undefined })
  for (const c of b.cards) await tx.objectStore('cards').put(c)
  for (const x of b.drills) await tx.objectStore('drills').add({ ...x, id: undefined })
  await tx.done
}

export async function clearAll() {
  const d = await db()
  await Promise.all([d.clear('attempts'), d.clear('cards'), d.clear('drills')])
}
