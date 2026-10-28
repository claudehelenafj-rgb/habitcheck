import { describe, expect, it } from 'vitest'
import { alternarFerramenta, FERRAMENTAS } from './bemEstar'

describe('ferramentas do Bem-estar', () => {
  it('liga e desliga', () => {
    expect(alternarFerramenta([], 'sono').ligadas).toEqual(['sono'])
    expect(alternarFerramenta(['sono'], 'sono').ligadas).toEqual([])
  })

  it('mantém a ordem da lista, não a ordem dos cliques', () => {
    expect(alternarFerramenta(['sono'], 'checkin').ligadas).toEqual(['checkin', 'sono'])
  })

  it('a partir da terceira, só comenta: não bloqueia', () => {
    const r = alternarFerramenta(['checkin', 'sono'], 'hobbies')
    expect(r.ligadas).toHaveLength(3)
    expect(r.muitas).toBe(true)
    expect(alternarFerramenta(['checkin'], 'sono').muitas).toBe(false)
  })

  it('cada ferramenta aparece uma vez só', () => {
    const ids = FERRAMENTAS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
