import { useEffect, useEffectEvent } from 'react'
import type { Question } from '../lib/types'

interface Options {
  q: Question
  chosen: string[]
  onChange: (chosen: string[]) => void
  /** Enter を押したとき。なければ Enter は扱わない */
  onEnter?: () => void
  /** 左右の矢印キー。なければ扱わない */
  onPrev?: () => void
  onNext?: () => void
  /** false の間は選択を受け付けない(解答した後など) */
  selectable: boolean
}

/** 選択肢の記号(A〜H)を、押されたキーから求める。1〜8 は上から何番目か、a〜h は記号そのもの */
export function keyToChoice(q: Question, key: string): string | null {
  if (q.kind === 'input') return null
  if (/^[1-8]$/.test(key)) return q.choices[Number(key) - 1]?.key ?? null
  const upper = key.toUpperCase()
  if (/^[A-H]$/.test(upper)) return q.choices.find((c) => c.key === upper)?.key ?? null
  return null
}

/** 選んだ記号を、今の選択に反映する。複数選択の問題では付け外しする */
export function toggleChoice(q: Question, chosen: readonly string[], key: string): string[] {
  if (q.answer.length <= 1) return [key]
  return chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key].sort()
}

/**
 * 問題をキーボードで解く。数字キーか記号のキーで選択肢を選び、Enter で解答や次へ進む。
 * 文字の入力欄にいるときは、入力の邪魔をしないように何もしない。
 */
export function useChoiceKeys({ q, chosen, onChange, onEnter, onPrev, onNext, selectable }: Options) {
  const handle = useEffectEvent((e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
    if (e.key === 'Enter') {
      if (!onEnter) return
      // 選択肢以外のボタン(次へ、指摘する など)や、テキストの開閉にいるときは、その動作に任せる
      if ((t?.tagName === 'BUTTON' && !t.classList.contains('choice')) || t?.tagName === 'SUMMARY') return
      e.preventDefault()
      onEnter()
      return
    }
    if (e.key === 'ArrowLeft' && onPrev) return onPrev()
    if (e.key === 'ArrowRight' && onNext) return onNext()
    if (!selectable) return
    const key = keyToChoice(q, e.key)
    if (key === null) return
    e.preventDefault()
    onChange(toggleChoice(q, chosen, key))
  })
  useEffect(() => {
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
}
