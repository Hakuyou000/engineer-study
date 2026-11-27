import { describe, expect, it } from 'vitest'
import { isLocalShutdownRequest } from '../../scripts/local-request'

const post = (host: string | undefined, origin?: string) => ({ method: 'POST', headers: { host, origin } })

describe('isLocalShutdownRequest', () => {
  it('自分の PC の Host からの POST を受け付ける', () => {
    expect(isLocalShutdownRequest(post('localhost:5173', 'http://localhost:5173'))).toBe(true)
    expect(isLocalShutdownRequest(post('127.0.0.1:5173', 'http://127.0.0.1:5173'))).toBe(true)
    expect(isLocalShutdownRequest(post('[::1]:5173', 'http://[::1]:5173'))).toBe(true)
    expect(isLocalShutdownRequest(post('localhost:5173'))).toBe(true)
  })

  it('POST 以外を断る', () => {
    expect(isLocalShutdownRequest({ method: 'GET', headers: { host: 'localhost:5173' } })).toBe(false)
  })

  it('DNS リバインディング(Host と Origin がともに外の名前)を断る', () => {
    expect(isLocalShutdownRequest(post('evil.example:5173', 'http://evil.example:5173'))).toBe(false)
  })

  it('ほかのサイトのページからの POST を断る', () => {
    expect(isLocalShutdownRequest(post('localhost:5173', 'http://evil.example'))).toBe(false)
    expect(isLocalShutdownRequest(post('localhost:5173', 'http://localhost:5174'))).toBe(false)
    expect(isLocalShutdownRequest(post('localhost:5173', 'null'))).toBe(false)
  })

  it('Host がないか読めない要求を断る', () => {
    expect(isLocalShutdownRequest(post(undefined))).toBe(false)
    expect(isLocalShutdownRequest(post('a b'))).toBe(false)
  })
})
