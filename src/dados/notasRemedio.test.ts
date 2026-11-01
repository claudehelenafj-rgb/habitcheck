import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { apagarNotaRemedio, restaurarNotaRemedio, salvarNotaRemedio } from './notasRemedio'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('como estou com o remédio', () => {
  it('guarda só o que foi marcado; nota vazia é recusada', async () => {
    const n = await salvarNotaRemedio({ remedioId: 'r1', aspectos: { sono: 'pior', apetite: undefined }, nota: '  ' })
    expect(await banco.notasRemedio.get(n.id)).toMatchObject({ remedioId: 'r1', aspectos: { sono: 'pior' } })
    expect(n).not.toHaveProperty('nota')
    await expect(salvarNotaRemedio({ aspectos: {}, nota: ' ' })).rejects.toThrow()
  })

  it('apagar e desfazer', async () => {
    const n = await salvarNotaRemedio({ aspectos: {}, nota: 'acordo às 4h' })
    await apagarNotaRemedio(n.id)
    await restaurarNotaRemedio(n)
    expect(await banco.notasRemedio.get(n.id)).toEqual(n)
  })

  it('as notas do remédio estão marcadas como dado de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toContain('notasRemedio')
  })
})
