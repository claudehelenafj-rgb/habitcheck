import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import type { DadosDoPainel } from './painelObjetivo'
import { diasAteHojeNaSemana, diasComAcao, diasComAcaoPorSemana, diasDoMes, focoPorDia, temAlgoLigado, totaisDoMes } from './painelObjetivo'

const tarefa = (id: string, extra: Partial<Tarefa>): Tarefa => ({ id, titulo: id, prioridade: 'B', passos: [], criadaEm: '', ...extra })
const dados: DadosDoPainel = {
  habitos: [{ id: 'h1', objetivoId: 'o1' }, { id: 'h2' }] as DadosDoPainel['habitos'],
  registros: [
    { id: 'a', habitoId: 'h1', dia: '2026-10-27', nivel: 'completo', quando: '' },
    { id: 'b', habitoId: 'h1', dia: '2026-10-29', nivel: 'minimo', quando: '' },
    { id: 'c', habitoId: 'h2', dia: '2026-10-30', nivel: 'completo', quando: '' },
  ],
  tarefas: [tarefa('t1', { objetivoId: 'o1', feitaNoDia: '2026-10-29', feitaEm: 'x' }), tarefa('t2', { objetivoId: 'o1' }), tarefa('t3', { feitaNoDia: '2026-10-31' })],
  sessoes: [
    { id: 's1', tarefaId: 't2', dia: '2026-10-30', inicio: '', fim: '', minutos: 25 },
    { id: 's2', tarefaId: 't2', dia: '2026-10-30', inicio: '', fim: '', minutos: 35 },
    { id: 's3', tarefaId: 't3', dia: '2026-10-31', inicio: '', fim: '', minutos: 45 },
    { id: 's4', tarefaId: 't2', dia: '2026-09-30', inicio: '', fim: '', minutos: 20 },
  ],
  cofrinhos: [{ id: 'c1', nome: 'Viagem', meta: 1, objetivoId: 'o1', criadoEm: '' }],
  depositos: [
    { id: 'd1', cofrinhoId: 'c1', valor: 5000, dia: '2026-10-20', quando: '' },
    { id: 'd2', cofrinhoId: 'c1', valor: -1000, dia: '2026-10-21', quando: '' },
  ],
}

describe('painel do objetivo', () => {
  it('dias com ação: hábito (mesmo o mínimo), tarefa feita, foco numa tarefa dele, dinheiro guardado', () => {
    expect([...diasComAcao('o1', dados)].sort()).toEqual(['2026-09-30', '2026-10-20', '2026-10-27', '2026-10-29', '2026-10-30'])
    expect(temAlgoLigado('o1', dados)).toBe(true)
    expect(temAlgoLigado('o2', dados)).toBe(false)
  })

  it('por semana, da mais antiga até esta; semana parada é zero (nunca erro)', () => {
    const semanas = diasComAcaoPorSemana(diasComAcao('o1', dados), '2026-11-01', 3)
    expect(semanas).toEqual([
      { segunda: '2026-10-12', dias: 0 },
      { segunda: '2026-10-19', dias: 1 },
      { segunda: '2026-10-26', dias: 3 },
    ])
  })

  it('foco por dia e totais do mês', () => {
    expect([...focoPorDia('o1', dados, '2026-10')]).toEqual([['2026-10-30', 60]])
    expect(totaisDoMes('o1', dados, '2026-10')).toEqual({ diasComAcao: 4, minutosFoco: 60, sessoes: 2, tarefasFeitas: 1, vezesHabitos: 2, guardado: 5000 })
  })

  it('o mês para o mapa: quantos dias e em que dia da semana começa', () => {
    const outubro = diasDoMes('2026-10')
    expect([outubro.dias.length, outubro.dias[0], outubro.dias.at(-1), outubro.primeiroDiaSemana]).toEqual([31, '2026-10-01', '2026-10-31', 4])
    expect(diasDoMes('2026-02').dias.length).toBe(28)
    expect(diasAteHojeNaSemana('2026-10-28')).toBe(3)
    expect(diasAteHojeNaSemana('2026-11-01')).toBe(7)
  })
})
