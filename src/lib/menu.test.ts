import { describe, expect, it } from 'vitest'
import { moveIndex } from './menu'

describe('メニューのキー操作', () => {
  it('↑↓ で 1 つずつ移り、端では反対の端に回る', () => {
    expect(moveIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(moveIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(moveIndex(0, 'ArrowUp', 3)).toBe(2)
  })

  it('Home と End で最初と最後に移る', () => {
    expect(moveIndex(1, 'Home', 5)).toBe(0)
    expect(moveIndex(1, 'End', 5)).toBe(4)
  })

  it('ほかのキーと、項目がないときは null', () => {
    expect(moveIndex(0, 'a', 3)).toBeNull()
    expect(moveIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})
