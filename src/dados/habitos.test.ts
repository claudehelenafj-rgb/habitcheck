import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { apagarHabito, marcarHabito, novoHabito, restaurarHabito, salvarHabito } from './habitos'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('hábitos no banco', () => {
  it('um registro por dia: marcar de novo troca o nível; sem nível, tira a marca', async () => {
    const h = novoHabito({ titulo: 'Caminhada', se: 'x', entao: 'y' })
    await salvarHabito(h)
    await marcarHabito(h.id, '2026-10-29', 'completo')
    await marcarHabito(h.id, '2026-10-29', 'minimo')
    expect((await banco.registrosHabito.toArray()).map((r) => [r.dia, r.nivel])).toEqual([['2026-10-29', 'minimo']])
    await marcarHabito(h.id, '2026-10-29', undefined)
    expect(await banco.registrosHabito.count()).toBe(0)
  })

  it('apagar leva os registros; desfazer devolve tudo', async () => {
    const h = novoHabito({ titulo: 'Alongar', se: 'x', entao: 'y' })
    await salvarHabito(h)
    await marcarHabito(h.id, '2026-10-28', 'completo')
    await marcarHabito(h.id, '2026-10-29', 'minimo')
    const apagado = await apagarHabito(h.id)
    expect(await banco.habitos.count()).toBe(0)
    expect(await banco.registrosHabito.count()).toBe(0)
    await restaurarHabito(apagado)
    expect(await banco.habitos.get(h.id)).toMatchObject({ titulo: 'Alongar' })
    expect(await banco.registrosHabito.count()).toBe(2)
  })
})
