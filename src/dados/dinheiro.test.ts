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
