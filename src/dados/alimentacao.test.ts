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

  it('configuração: começa com as 4 refeições e muda sem perder o resto', async () => {
    await mudarConfigAlimentacao(() => ({ aguaMeta: 6 }))
    await mudarConfigAlimentacao((c) => ({ refeicoes: c.refeicoes.map((r) => (r.id === 'lanche' ? { ...r, ativa: false } : r)) }))
    const c = (await banco.configuracoes.get('alimentacao'))!.valor as { aguaMeta: number; refeicoes: Array<{ id: string; ativa: boolean }> }
    expect(c.aguaMeta).toBe(6)
    expect(c.refeicoes.map((r) => [r.id, r.ativa])).toEqual([
      ['cafe', true],
      ['almoco', true],
      ['lanche', false],
      ['jantar', true],
    ])
  })
})
