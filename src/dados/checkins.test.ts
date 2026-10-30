import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { apagarCheckin, restaurarCheckin, salvarCheckin } from './checkins'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('salvar check-in', () => {
  it('guarda o dia local e não guarda nota ou sinais vazios', async () => {
    const c = await salvarCheckin(
      { ansiedade: 7, irritacao: 2, energia: 3, sinais: [], nota: '   ' },
      new Date(2026, 9, 28, 23, 40),
    )
    const salvo = await banco.checkins.get(c.id)
    expect(salvo?.dia).toBe('2026-10-28')
    expect(salvo).not.toHaveProperty('nota')
    expect(salvo).not.toHaveProperty('sinais')
  })

  it('recusa valores fora de 0 a 10', async () => {
    await expect(salvarCheckin({ ansiedade: 11, irritacao: 0, energia: 0 })).rejects.toThrow()
    expect(await banco.checkins.count()).toBe(0)
  })

  it('apagar e desfazer devolve o mesmo registro', async () => {
    const c = await salvarCheckin({ ansiedade: 4, irritacao: 4, energia: 4, nota: 'dia cheio' })
    await apagarCheckin(c.id)
    expect(await banco.checkins.count()).toBe(0)
    await restaurarCheckin(c)
    expect(await banco.checkins.get(c.id)).toEqual(c)
  })

  it('a tabela de check-ins está marcada como dado de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toContain('checkins')
    for (const nome of TABELAS_BEM_ESTAR) expect(banco.tables.map((t) => t.name)).toContain(nome)
  })
})
