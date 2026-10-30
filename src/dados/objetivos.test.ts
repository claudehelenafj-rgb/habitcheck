import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { apagarObjetivo, arquivarObjetivo, ligarAoObjetivo, novoObjetivo, restaurarObjetivo, salvarObjetivo } from './objetivos'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('objetivos no banco', () => {
  it('ligar, apagar soltando tudo e desfazer religando', async () => {
    const o = novoObjetivo('Correr 5 km', 'para ter mais fôlego')
    await salvarObjetivo(o)
    await banco.tarefas.put({ id: 't1', titulo: 'Comprar tênis', prioridade: 'B', passos: [], criadaEm: '' })
    await banco.cofrinhos.put({ id: 'c1', nome: 'Tênis', meta: 30000, criadoEm: '' })
    await ligarAoObjetivo('tarefa', 't1', o.id)
    await ligarAoObjetivo('cofrinho', 'c1', o.id)
    expect((await banco.tarefas.get('t1'))!.objetivoId).toBe(o.id)
    const copia = await apagarObjetivo(o.id)
    expect(copia!.ligacoes).toEqual({ habitos: [], tarefas: ['t1'], cofrinhos: ['c1'] })
    expect(await banco.objetivos.get(o.id)).toBeUndefined()
    expect((await banco.cofrinhos.get('c1'))!.objetivoId).toBeUndefined()
    await restaurarObjetivo(copia!)
    expect((await banco.objetivos.get(o.id))!.titulo).toBe('Correr 5 km')
    expect((await banco.tarefas.get('t1'))!.objetivoId).toBe(o.id)
    expect((await banco.cofrinhos.get('c1'))!.objetivoId).toBe(o.id)
  })

  it('deixar de lado e trazer de volta', async () => {
    const o = novoObjetivo('Ler mais')
    await salvarObjetivo(o)
    await arquivarObjetivo(o.id, true)
    expect((await banco.objetivos.get(o.id))!.arquivadoEm).toBeTruthy()
    await arquivarObjetivo(o.id, false)
    expect((await banco.objetivos.get(o.id))!.arquivadoEm).toBeUndefined()
  })
})
