import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import {
  apagarFotosDoReset,
  apagarZona,
  comecarReset,
  descartarReset,
  encerrarReset,
  garantirZonasIniciais,
  marcarAvisoReset,
  mudarReset,
  novaZona,
  restaurarFotosDoReset,
  salvarLugar,
  trocarFotoDoReset,
} from './quarto'
import { alternarItem, maisCincoMinutos } from '../logica/quarto'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

const modelos = [
  { nome: 'Mesa', adesivo: 'livro' as const, itens: ['papéis numa pilha', 'copos para a cozinha'] },
  { nome: 'Chão', adesivo: 'vassoura' as const, itens: ['lixo no lixo'] },
]

describe('quarto no banco', () => {
  it('zonas de exemplo só na primeira vez; apagadas, não voltam', async () => {
    await garantirZonasIniciais(modelos)
    await garantirZonasIniciais(modelos)
    const zonas = await banco.zonas.orderBy('ordem').toArray()
    expect(zonas.map((z) => [z.nome, z.ordem])).toEqual([
      ['Mesa', 0],
      ['Chão', 1],
    ])
    for (const z of zonas) await apagarZona(z.id)
    await garantirZonasIniciais(modelos)
    expect(await banco.zonas.count()).toBe(0)
    await novaZona({ nome: 'Estante', adesivo: 'livro', itens: [] })
    expect((await banco.zonas.toArray())[0]).toMatchObject({ nome: 'Estante', ordem: 0 })
  })

  it('reset: começa, marca itens, avisa uma vez, guarda com o nome da zona', async () => {
    await garantirZonasIniciais(modelos)
    const mesa = (await banco.zonas.orderBy('ordem').first())!
    const t0 = new Date('2026-10-29T20:00:00')
    await comecarReset(mesa.id, 10, t0)
    await mudarReset((e) => alternarItem(e, 'papéis numa pilha'))
    const chave = `${t0.toISOString()}|10`
    expect(await marcarAvisoReset(chave)).toBe(true)
    expect(await marcarAvisoReset(chave)).toBe(false)
    // "mais 5 min" muda a chave: pode avisar de novo no fim
    await mudarReset((e) => maisCincoMinutos(e, new Date(t0.getTime() + 10 * 60_000)))
    expect(await marcarAvisoReset(`${t0.toISOString()}|15`)).toBe(true)
    const r = await encerrarReset(new Date(t0.getTime() + 8 * 60_000))
    expect(r).toMatchObject({ zonaNome: 'Mesa', dia: '2026-10-29', minutos: 8, feitos: ['papéis numa pilha'], total: 2 })
    expect(await banco.configuracoes.get('resetQuarto')).toBeUndefined()
    expect(await banco.resets.count()).toBe(1)
  })

  it('fotos: trocar a do antes apaga a anterior; sair sem guardar leva as fotos; apagar fotos tem desfazer', async () => {
    await garantirZonasIniciais(modelos)
    const mesa = (await banco.zonas.orderBy('ordem').first())!
    await comecarReset(mesa.id, 10)
    await trocarFotoDoReset('fotoAntes', 'data:image/jpeg;base64,AAA')
    await trocarFotoDoReset('fotoAntes', 'data:image/jpeg;base64,BBB')
    expect((await banco.fotos.toArray()).map((f) => f.dataUrl)).toEqual(['data:image/jpeg;base64,BBB'])
    await trocarFotoDoReset('fotoDepois', 'data:image/jpeg;base64,CCC')
    await descartarReset()
    expect(await banco.fotos.count()).toBe(0)

    await comecarReset(mesa.id, 10)
    await trocarFotoDoReset('fotoAntes', 'data:image/jpeg;base64,DDD')
    await trocarFotoDoReset('fotoDepois', 'data:image/jpeg;base64,EEE')
    const r = (await encerrarReset())!
    expect(r.fotoAntes && r.fotoDepois).toBeTruthy()
    const apagado = await apagarFotosDoReset(r.id)
    expect(await banco.fotos.count()).toBe(0)
    expect((await banco.resets.get(r.id))?.fotoAntes).toBeUndefined()
    await restaurarFotosDoReset(apagado)
    expect(await banco.fotos.count()).toBe(2)
    expect((await banco.resets.get(r.id))?.fotoDepois).toBe(r.fotoDepois)
  })

  it('um lugar para cada coisa: editar mantém a data de quando foi anotado', async () => {
    await salvarLugar({ coisa: ' chave ', onde: ' gancho da porta ' })
    const [l] = await banco.lugares.toArray()
    expect(l).toMatchObject({ coisa: 'chave', onde: 'gancho da porta' })
    await salvarLugar({ id: l.id, coisa: 'chave', onde: 'pote da estante' })
    const [m] = await banco.lugares.toArray()
    expect(m).toMatchObject({ id: l.id, onde: 'pote da estante', criadoEm: l.criadoEm })
  })
})
