// 生成済みの用語集(npm run gen で glossary/*.md から作る)と、本文の用語の検出器。
import data from '../data/glossary.json'
import { createLinker, type Term } from './glossary'

export const TERMS = data as Term[]
export const LINKER = createLinker(TERMS)
export const termByName = (name: string) => TERMS.find((t) => t.name === name)

/** 用語集の画面を開く(どの画面からでも呼べる) */
export const OPEN_GLOSSARY = 'sre-drill:glossary'
export function openGlossary(name: string | null) {
  window.dispatchEvent(new CustomEvent<string | null>(OPEN_GLOSSARY, { detail: name }))
}
