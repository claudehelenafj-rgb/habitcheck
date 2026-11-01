import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { guardarEspeciaisNovos } from './album'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

const registro = (i: number) => {
  const dia = `2026-10-${String(i + 1).padStart(2, '0')}`
  return { id: `h1|${dia}`, habitoId: 'h1', dia, nivel: 'completo' as const, quando: `${dia}T12:00:00Z` }
}

describe('especiais do álbum no banco', () => {
  it('guarda uma vez só e não tira quando o total diminui', async () => {
    await banco.habitos.put({ id: 'h1', titulo: 'Caminhar', adesivo: 'haltere', se: 'a', entao: 'b', minima: 'c', meta: 3, dias: [], criadoEm: '' })
    await banco.registrosHabito.bulkPut(Array.from({ length: 9 }, (_, i) => registro(i)))
    expect(await guardarEspeciaisNovos()).toEqual([])
    await banco.tarefas.put({ id: 't1', titulo: 'Ler', prioridade: 'A', passos: [], criadaEm: '', feitaEm: '2026-10-12T15:00:00Z', feitaNoDia: '2026-10-12' })
    expect(await guardarEspeciaisNovos()).toEqual(['arcoIris'])
    expect(await guardarEspeciaisNovos()).toEqual([])
    expect((await banco.configuracoes.get('album'))!.valor).toEqual({ especiais: { arcoIris: '2026-10-12' } })
    // desfez a tarefa: o arco-íris continua
    await banco.tarefas.update('t1', { feitaEm: undefined, feitaNoDia: undefined })
    expect(await guardarEspeciaisNovos()).toEqual([])
    expect((await banco.configuracoes.get('album'))!.valor).toEqual({ especiais: { arcoIris: '2026-10-12' } })
  })
})
