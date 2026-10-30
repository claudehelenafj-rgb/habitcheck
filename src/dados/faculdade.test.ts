import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { apagarAvaliacao, criarSessoes, restaurarAvaliacao, salvarAvaliacoes } from './faculdade'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('provas e entregas', () => {
  it('configuração do semestre: várias de uma vez, sem as linhas incompletas, e as matérias entram na lista', async () => {
    const r = await salvarAvaliacoes([
      { materia: ' Cálculo ', tipo: 'prova', titulo: '', data: '2026-11-20' },
      { materia: 'Física', tipo: 'entrega', titulo: 'Relatório 2', data: '2026-11-10', hora: '23:59' },
      { materia: '', tipo: 'prova', titulo: 'sem matéria', data: '2026-11-11' },
      { materia: 'Química', tipo: 'prova', titulo: 'sem data', data: '' },
    ])
    expect(r.map((a) => [a.materia, a.titulo])).toEqual([
      ['Cálculo', 'Prova'],
      ['Física', 'Relatório 2'],
    ])
    expect(((await banco.configuracoes.get('faculdade'))?.valor as { materias: string[] }).materias).toEqual(['Cálculo', 'Física'])
  })

  it('apagar leva as sessões ainda não feitas; as feitas ficam; desfazer devolve', async () => {
    const [a] = await salvarAvaliacoes([{ materia: 'Cálculo', tipo: 'prova', titulo: 'P1', data: '2026-11-20' }])
    await criarSessoes([
      { id: 's1', titulo: 'x', prioridade: 'A', passos: [], criadaEm: '', avaliacaoId: a.id },
      { id: 's2', titulo: 'y', prioridade: 'A', passos: [], criadaEm: '', avaliacaoId: a.id, feitaEm: '2026-10-29T10:00:00Z' },
    ])
    const apagada = await apagarAvaliacao(a.id)
    expect(await banco.avaliacoes.count()).toBe(0)
    expect((await banco.tarefas.toArray()).map((t) => t.id)).toEqual(['s2'])
    await restaurarAvaliacao(apagada)
    expect(await banco.avaliacoes.count()).toBe(1)
    expect(await banco.tarefas.count()).toBe(2)
  })
})
