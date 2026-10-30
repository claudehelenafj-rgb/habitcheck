import { describe, expect, it } from 'vitest'
import type { Objetivo, Tarefa } from '../dados/banco'
import type { Cofrinho } from './dinheiro'
import type { Habito } from './habitos'
import { ligadosAo, objetivoDoDia, objetivosAtivos } from './objetivos'

const obj = (id: string, porque: string, extra: Partial<Objetivo> = {}): Objetivo => ({ id, titulo: id, porque, criadoEm: `2026-10-0${id.slice(-1)}T10:00:00Z`, ...extra })

describe('objetivos', () => {
  it('ativos, na ordem em que foram criados', () => {
    expect(objetivosAtivos([obj('o2', 'b'), obj('o1', 'a'), obj('o3', 'c', { arquivadoEm: 'x' })]).map((o) => o.id)).toEqual(['o1', 'o2'])
  })

  it('o do dia: um por dia, em rodízio, só os que têm o porquê', () => {
    const lista = [obj('o1', 'porque 1'), obj('o2', '  '), obj('o3', 'porque 3'), obj('o4', 'porque 4', { arquivadoEm: 'x' })]
    const dias = ['2026-11-01', '2026-11-02', '2026-11-03'].map((d) => objetivoDoDia(lista, d)!.id)
    expect(new Set(dias)).toEqual(new Set(['o1', 'o3']))
    expect(dias[0]).not.toBe(dias[1])
    expect(dias[0]).toBe(dias[2])
    expect(objetivoDoDia([obj('o1', '')], '2026-11-01')).toBeUndefined()
  })

  it('o que faz o objetivo andar: tarefas abertas primeiro; arquivados fora', () => {
    const tarefa = (id: string, extra: Partial<Tarefa>): Tarefa => ({ id, titulo: id, prioridade: 'B', passos: [], criadaEm: `2026-10-0${id.slice(-1)}T10:00:00Z`, ...extra })
    const r = ligadosAo('o1', {
      habitos: [{ id: 'h1', objetivoId: 'o1' } as Habito, { id: 'h2', objetivoId: 'o1', arquivadoEm: 'x' } as Habito, { id: 'h3', objetivoId: 'o2' } as Habito],
      tarefas: [tarefa('t1', { objetivoId: 'o1', feitaEm: 'x' }), tarefa('t2', { objetivoId: 'o1' }), tarefa('t3', {})],
      cofrinhos: [{ id: 'c1', nome: 'Viagem', meta: 1, objetivoId: 'o1', criadoEm: '' } as Cofrinho],
    })
    expect([r.habitos.map((h) => h.id), r.tarefas.map((t) => t.id), r.cofrinhos.map((c) => c.id)]).toEqual([['h1'], ['t2', 't1'], ['c1']])
  })
})
