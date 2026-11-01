import { describe, expect, it } from 'vitest'
import { doDia, faixa, faixaDoCheckin, valorValido, type Checkin } from './checkin'

describe('faixas do check-in', () => {
  it('0–3 leve, 4–6 média, 7–10 alta', () => {
    expect([0, 3, 4, 6, 7, 10].map(faixa)).toEqual(['leve', 'leve', 'media', 'media', 'alta', 'alta'])
  })

  it('usa a maior entre ansiedade e irritação', () => {
    expect(faixaDoCheckin({ ansiedade: 2, irritacao: 8 })).toBe('alta')
    expect(faixaDoCheckin({ ansiedade: 5, irritacao: 1 })).toBe('media')
    expect(faixaDoCheckin({ ansiedade: 0, irritacao: 0 })).toBe('leve')
  })

  it('aceita só inteiros de 0 a 10', () => {
    expect([0, 5, 10].every(valorValido)).toBe(true)
    expect([-1, 11, 4.5, NaN, '5', undefined].some(valorValido)).toBe(false)
  })
})

describe('check-ins do dia', () => {
  const c = (id: string, quando: string, dia: string): Checkin => ({
    id,
    quando,
    dia,
    ansiedade: 1,
    irritacao: 1,
    energia: 5,
  })
  it('filtra pelo dia local e põe o mais recente primeiro', () => {
    const lista = [
      c('a', '2026-10-28T11:00:00.000Z', '2026-10-28'),
      c('b', '2026-10-29T01:30:00.000Z', '2026-10-28'), // 22h30 no Brasil, ainda dia 28
      c('d', '2026-10-27T15:00:00.000Z', '2026-10-27'),
    ]
    expect(doDia(lista, '2026-10-28').map((x) => x.id)).toEqual(['b', 'a'])
  })
})
