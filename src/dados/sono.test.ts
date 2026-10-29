import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { desfazerNoite, salvarNoite, type NovaNoite } from './sono'

const noite: NovaNoite = { noite: '2026-10-28', deitou: '23:30', levantou: '07:00', demora: '15a30', despertares: 1, qualidade: 3 }

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('diário de sono', () => {
  it('uma anotação por noite: anotar de novo substitui, e desfazer devolve a anterior', async () => {
    const primeira = await salvarNoite({ ...noite, nota: '  ' })
    expect(primeira.salvo).not.toHaveProperty('nota')
    const segunda = await salvarNoite({ ...noite, qualidade: 5, nota: 'dormi bem' })
    expect(await banco.sonos.count()).toBe(1)
    expect(segunda.salvo.id).toBe(primeira.salvo.id)
    expect(segunda.anterior?.qualidade).toBe(3)
    await desfazerNoite(segunda.salvo, segunda.anterior)
    expect((await banco.sonos.get(primeira.salvo.id))?.qualidade).toBe(3)
  })

  it('desfazer uma anotação nova apaga', async () => {
    const r = await salvarNoite(noite)
    await desfazerNoite(r.salvo, r.anterior)
    expect(await banco.sonos.count()).toBe(0)
  })

  it('o diário de sono está marcado como dado de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toContain('sonos')
  })
})
