import { describe, expect, it } from 'vitest'
import { DRILLS, checkField } from './index'
import { prefixForHosts, subnetOf } from './ipv4'
import { compress, eui64InterfaceId, expand } from './ipv6'
import { octalToSymbolic } from './perm'
import { mulberry32 } from './types'

describe('IPv4', () => {
  it('サブネットの範囲を求める', () => {
    expect(subnetOf('172.16.45.200', 20)).toMatchObject({ network: '172.16.32.0', broadcast: '172.16.47.255' })
    expect(subnetOf('10.1.1.70', 27)).toMatchObject({ firstHost: '10.1.1.65', lastHost: '10.1.1.94', hosts: 30 })
    expect(subnetOf('192.168.1.130', 26)).toMatchObject({ network: '192.168.1.128', broadcast: '192.168.1.191' })
    expect(subnetOf('223.255.255.254', 30).broadcast).toBe('223.255.255.255')
  })

  it('台数からプレフィックス長を求める', () => {
    expect(prefixForHosts(50)).toBe(26)
    expect(prefixForHosts(62)).toBe(26)
    expect(prefixForHosts(63)).toBe(25)
    expect(prefixForHosts(2)).toBe(30)
    expect(prefixForHosts(100)).toBe(25)
  })
})

describe('IPv6', () => {
  it('RFC 5952 の正規形に省略する', () => {
    expect(compress('2001:0db8:0000:0000:00a0:0000:0000:0001')).toBe('2001:db8::a0:0:0:1')
    expect(compress('2001:0db8:0000:0001:0000:0000:0000:0001')).toBe('2001:db8:0:1::1')
    expect(compress('2001:0db8:0000:0001:0002:0003:0004:0005')).toBe('2001:db8:0:1:2:3:4:5')
    expect(compress('0000:0000:0000:0000:0000:0000:0000:0001')).toBe('::1')
    expect(compress('0000:0000:0000:0000:0000:0000:0000:0000')).toBe('::')
    expect(compress('fe80:0000:0000:0000:0000:0000:0000:0000')).toBe('fe80::')
  })

  it('展開と不正入力', () => {
    expect(expand('2001:db8::1')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001')
    expect(expand('2001:db8::a0::1')).toBeNull()
    expect(expand('2001:db8:1')).toBeNull()
    expect(expand('1:2:3:4:5:6:7::8')).toBeNull()
    expect(expand('xyz')).toBeNull()
  })

  it('EUI-64', () => {
    expect(eui64InterfaceId('0050.56ab.cdef')).toBe('0250:56ff:feab:cdef')
    expect(eui64InterfaceId('02:00:00:00:00:01')).toBe('0000:00ff:fe00:0001')
  })
})

describe('パーミッション', () => {
  it('8 進を記号表記にする', () => {
    expect(octalToSymbolic('755')).toBe('rwxr-xr-x')
    expect(octalToSymbolic('640')).toBe('rw-r-----')
    expect(octalToSymbolic('4755')).toBe('rwsr-xr-x')
    expect(octalToSymbolic('2770')).toBe('rwxrws---')
    expect(octalToSymbolic('1777')).toBe('rwxrwxrwt')
    expect(octalToSymbolic('4644')).toBe('rwSr--r--')
  })
})

describe('ドリル生成', () => {
  it('どの種類も、自分の正解を正解と判定する', () => {
    for (const kind of DRILLS) {
      const rng = mulberry32(42)
      for (let i = 0; i < 300; i++) {
        const d = kind.gen(rng)
        expect(d.type).toBe(kind.type)
        expect(d.fields.length).toBeGreaterThan(0)
        for (const f of d.fields) {
          expect(f.answer, `${kind.type}: ${d.prompt}`).not.toMatch(/NaN|undefined|null/)
          expect(checkField(f, ` ${f.answer} `)).toBe(true)
          expect(checkField(f, f.answer + '9')).toBe(false)
        }
      }
    }
  })

  it('入力の表記ゆれを吸収する', () => {
    const rng = mulberry32(1)
    const prefix = DRILLS.find((k) => k.type === 'ipv4-prefix')!.gen(rng)
    expect(checkField(prefix.fields[0], '/' + prefix.fields[0].answer)).toBe(true)
    const eui = DRILLS.find((k) => k.type === 'ipv6-eui64')!.gen(rng)
    expect(checkField(eui.fields[0], expand(eui.fields[0].answer)!.toUpperCase())).toBe(true)
  })

  it('IPv4 の出題アドレスはホストアドレスである', () => {
    const rng = mulberry32(7)
    const kind = DRILLS.find((k) => k.type === 'ipv4-netbc')!
    for (let i = 0; i < 300; i++) {
      const d = kind.gen(rng)
      const [, ip] = d.prompt.match(/`([\d.]+)\/\d+`/)!
      expect(d.fields.map((f) => f.answer)).not.toContain(ip)
    }
  })
})
