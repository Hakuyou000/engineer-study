import { describe, expect, it } from 'vitest'
import { formatMinute, nextRun, parseField } from './cron'
import { applySymbolic, applyUmask } from './perm2'

const at = (s: string) => new Date(s + ':00Z')
const next = (expr: string, from: string) => formatMinute(nextRun(expr, at(from))!)

describe('cron', () => {
  it('フィールドを解釈する', () => {
    expect([...parseField('*/15', 0, 59)]).toEqual([0, 15, 30, 45])
    expect([...parseField('8-18/2', 0, 23)]).toEqual([8, 10, 12, 14, 16, 18])
    expect([...parseField('1,3,5-6', 1, 31)]).toEqual([1, 3, 5, 6])
    expect([...parseField('7', 0, 7, true)]).toEqual([0])
    expect(() => parseField('60', 0, 59)).toThrow()
  })

  it('次の実行日時を求める', () => {
    // 2026-11-17 は火曜日
    expect(next('0 3 * * *', '2026-11-17T14:23')).toBe('2026-11-18 03:00')
    expect(next('*/10 * * * *', '2026-11-17T14:23')).toBe('2026-11-17 14:30')
    expect(next('*/10 * * * *', '2026-11-17T14:30')).toBe('2026-11-17 14:40')
    expect(next('0 9 * * 1-5', '2026-11-20T10:00')).toBe('2026-11-23 09:00')
    expect(next('30 23 1 * *', '2026-12-05T00:00')).toBe('2027-01-01 23:30')
    expect(next('0 0 29 2 *', '2026-03-01T00:00')).toBe('2028-02-29 00:00')
  })

  it('日と曜日の両方を指定すると OR になる', () => {
    // 2026-11-17(火)の次: 金曜 11-20 と 13 日(12-13)のうち早いほう
    expect(next('0 0 13 * 5', '2026-11-17T00:00')).toBe('2026-11-20 00:00')
    // 片方が * なら AND
    expect(next('0 0 * * 5', '2026-11-17T00:00')).toBe('2026-11-20 00:00')
    expect(next('0 0 13 * *', '2026-11-17T00:00')).toBe('2026-12-13 00:00')
  })

  it('曜日の 7 は日曜', () => {
    expect(next('0 12 * * 7', '2026-11-17T00:00')).toBe('2026-11-22 12:00')
  })
})

describe('umask と chmod', () => {
  it('umask を適用する', () => {
    expect(applyUmask('022')).toEqual({ file: '644', dir: '755' })
    expect(applyUmask('027')).toEqual({ file: '640', dir: '750' })
    expect(applyUmask('077')).toEqual({ file: '600', dir: '700' })
    expect(applyUmask('023')).toEqual({ file: '644', dir: '754' })
  })

  it('記号モードを適用する', () => {
    expect(applySymbolic('644', 'u+x')).toBe('744')
    expect(applySymbolic('755', 'go-rx')).toBe('700')
    expect(applySymbolic('640', 'o=r,g+w')).toBe('664')
    expect(applySymbolic('777', 'a=r')).toBe('444')
    expect(applySymbolic('600', 'a+x')).toBe('711')
  })
})
