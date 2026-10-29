import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { apagarConta, despagarConta, novaConta, pagarConta, restaurarConta, salvarConta } from './dinheiro'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('contas no banco', () => {
  it('pagar duas vezes não duplica; desfazer tira o pagamento; apagar tem desfazer', async () => {
    const c = novaConta({ nome: 'Luz', valor: 12990 })
    await salvarConta(c)
    await Promise.all([pagarConta(c.id, '2026-10'), pagarConta(c.id, '2026-10')])
    expect((await banco.contas.get(c.id))!.pagamentos.map((p) => [p.mes, p.valor])).toEqual([['2026-10', 12990]])
    await despagarConta(c.id, '2026-10')
    expect((await banco.contas.get(c.id))!.pagamentos).toEqual([])
    const apagada = await apagarConta(c.id)
    expect(await banco.contas.count()).toBe(0)
    await restaurarConta(apagada!)
    expect((await banco.contas.get(c.id))!.nome).toBe('Luz')
  })
})

describe('potes e gastos no banco', () => {
  it('gasto rápido cai no pote pela palavra; apagar o pote deixa os gastos sem pote, com desfazer', async () => {
    const { novoPote, anotarGasto, apagarPote, restaurarPote } = await import('./dinheiro')
    await novoPote({ nome: 'Mercado', limite: 30000 })
    await novoPote({ nome: 'Comida fora', limite: 10000 })
    const fora = (await banco.potes.toArray()).find((p) => p.nome === 'Comida fora')!
    await banco.potes.update(fora.id, { palavras: ['ifood'] })
    const g1 = await anotarGasto(3500, 'ifood', undefined, new Date('2026-10-29T20:00:00'))
    const g2 = await anotarGasto(1200, 'uber', undefined, new Date('2026-10-29T21:00:00'))
    expect(g1).toMatchObject({ poteId: fora.id, dia: '2026-10-29' })
    expect(g2.poteId).toBeUndefined()
    const apagado = await apagarPote(fora.id)
    expect((await banco.gastos.get(g1.id))!.poteId).toBeUndefined()
    await restaurarPote(apagado)
    expect((await banco.gastos.get(g1.id))!.poteId).toBe(fora.id)
    expect((await banco.potes.toArray()).map((p) => [p.nome, p.ordem])).toEqual([
      ['Mercado', 0],
      ['Comida fora', 1],
    ])
  })
})
