/**
 * メニューの中でキーを押したときに、次に選ぶ項目の位置を返す。
 * ↑↓ は端で反対の端に回り、Home と End は最初と最後に移る。移らないキーは null
 */
export function moveIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
