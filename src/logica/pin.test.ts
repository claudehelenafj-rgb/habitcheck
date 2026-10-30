import { describe, expect, it } from 'vitest'
import { conferirPin, criarPin, esperaRestante, pinValido } from './pin'

describe('PIN do Bem-estar', () => {
  it('aceita só de 4 a 6 números', () => {
    expect(['1234', '123456'].every(pinValido)).toBe(true)
    expect(['123', '1234567', 'abcd', '12 34', ''].some(pinValido)).toBe(false)
  })

  it('guarda só o resumo com sal; confere o certo e recusa o errado', async () => {
    const salvo = await criarPin('2468')
    expect(JSON.stringify(salvo)).not.toContain('2468')
    expect(salvo.sal).toHaveLength(32)
    expect(await conferirPin('2468', salvo)).toBe(true)
    expect(await conferirPin('2469', salvo)).toBe(false)
    expect(await conferirPin('abc', salvo)).toBe(false)
  })

  it('o mesmo PIN gera resumos diferentes (sal novo a cada vez)', async () => {
    const [a, b] = await Promise.all([criarPin('1111'), criarPin('1111')])
    expect(a.hash).not.toBe(b.hash)
  })

  it('depois de 5 erros, espera 30 segundos', () => {
    expect(esperaRestante(4, 1000, 2000)).toBe(0)
    expect(esperaRestante(5, 1000, 11_000)).toBe(20)
    expect(esperaRestante(5, 1000, 31_000)).toBe(0)
  })
})
