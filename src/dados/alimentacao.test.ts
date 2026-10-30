import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { marcarCopo, marcarRefeicao, mudarConfigAlimentacao } from './alimentacao'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('alimentação no banco', () => {
  it('um registro por dia: refeições e copos, com toques rápidos sem se atropelar', async () => {
    await Promise.all([marcarRefeicao('2026-10-29', 'cafe'), marcarCopo('2026-10-29', 1), marcarCopo('2026-10-29', 2), marcarRefeicao('2026-10-29', 'almoco')])
    const d = await banco.diasAlimentacao.get('2026-10-29')
    expect(Object.keys(d!.refeicoes).sort()).toEqual(['almoco', 'cafe'])
    expect(d!.agua).toBe(2)
    await marcarRefeicao('2026-10-29', 'cafe')
    expect((await banco.diasAlimentacao.get('2026-10-29'))!.refeicoes.cafe).toBeUndefined()
  })

  it('configuração: começa com as 7 refeições ("ao acordar", lanche da manhã e ceia desligados) e muda sem perder o resto', async () => {
    await mudarConfigAlimentacao(() => ({ aguaMeta: 6 }))
    await mudarConfigAlimentacao((c) => ({ refeicoes: c.refeicoes.map((r) => (r.id === 'lanche' ? { ...r, ativa: false } : r)) }))
    const c = (await banco.configuracoes.get('alimentacao'))!.valor as { aguaMeta: number; refeicoes: Array<{ id: string; ativa: boolean }> }
    expect(c.aguaMeta).toBe(6)
    expect(c.refeicoes.map((r) => [r.id, r.ativa])).toEqual([
      ['acordar', false],
      ['cafe', true],
      ['lancheManha', false],
      ['almoco', true],
      ['lanche', false],
      ['jantar', true],
      ['ceia', false],
    ])
  })

  it('configuração guardada com 4 refeições ganha as novas, sem perder o que mudou', async () => {
    const antigas = [
      { id: 'cafe', hora: '07:00', ativa: true, lembrar: true },
      { id: 'almoco', hora: '12:00', ativa: true, lembrar: false },
      { id: 'lanche', nome: 'Lanchinho', hora: '15:30', ativa: false, lembrar: false },
      { id: 'jantar', hora: '20:00', ativa: true, lembrar: false },
    ]
    await banco.configuracoes.put({ chave: 'alimentacao', valor: { refeicoes: antigas, aguaMeta: 10 } })
    await mudarConfigAlimentacao(() => ({ aguaMeta: 9 }))
    const c = (await banco.configuracoes.get('alimentacao'))!.valor as { refeicoes: Array<{ id: string }> }
    expect(c.refeicoes.map((r) => r.id)).toEqual(['acordar', 'cafe', 'lancheManha', 'almoco', 'lanche', 'jantar', 'ceia'])
    expect(c.refeicoes[1]).toEqual(antigas[0])
    expect(c.refeicoes[4]).toEqual(antigas[2])
  })
})

describe('comidas e compras no banco', () => {
  it('lista de compras: sem repetir, marcar comprado, tirar comprados e desfazer', async () => {
    const { acrescentarCompras, alternarComprado, tirarComprados, restaurarCompras } = await import('./alimentacao')
    expect(await acrescentarCompras('pão, leite, banana')).toBe(3)
    expect(await acrescentarCompras(['Leite', 'ovos'])).toBe(1)
    const itens = await banco.compras.toArray()
    const pao = itens.find((i) => i.nome === 'pão')!
    await alternarComprado(pao.id)
    expect((await banco.compras.get(pao.id))!.compradoEm).toBeTruthy()
    const tirados = await tirarComprados()
    expect(tirados.map((i) => i.nome)).toEqual(['pão'])
    expect(await banco.compras.count()).toBe(3)
    await restaurarCompras(tirados)
    expect(await banco.compras.count()).toBe(4)
  })

  it('ideias de comidas só com a lista vazia', async () => {
    const { criarComidasExemplo } = await import('./alimentacao')
    const ex = [{ nome: 'sanduíche', jeito: 'preparo' as const, refeicoes: [], ingredientes: ['pão'] }]
    await criarComidasExemplo(ex)
    await criarComidasExemplo(ex)
    expect(await banco.comidas.count()).toBe(1)
  })
})
