import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import type { Habito } from './habitos'
import type { RegistroDose } from './remedios'
import { ajusteAnterior, avisosSemResposta, proximosDias, resumoDaSemana, ultimos7Dias } from './revisao'
import type { RegistroRitual } from './rituais'

const HOJE = '2026-11-01'
const SEMANA = ultimos7Dias(HOJE)

describe('dias da revisão', () => {
  it('os 7 dias que terminam hoje e as próximas 2 semanas', () => {
    expect(SEMANA).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
    const prox = proximosDias(HOJE)
    expect([prox[0], prox.at(-1), prox.length]).toEqual(['2026-11-02', '2026-11-15', 14])
  })
})

describe('resumo da semana', () => {
  it('só o que foi feito nos 7 dias', () => {
    const tarefa = (id: string, feitaNoDia?: string): Tarefa => ({
      id,
      titulo: id,
      prioridade: 'A',
      passos: [],
      criadaEm: '2026-10-01T10:00:00Z',
      ...(feitaNoDia ? { feitaNoDia, feitaEm: `${feitaNoDia}T15:00:00Z` } : {}),
    })
    const habito = { id: 'h1', titulo: 'Caminhar', arquivadoEm: undefined } as Habito
    const ritual = (id: string, dia: string, feito = true) =>
      ({ id: `${id}|${dia}`, ritual: id, dia, comecouEm: '', passo: 'dia', ...(feito ? { feitoEm: 'x' } : {}) }) as RegistroRitual
    const r = resumoDaSemana(
      {
        tarefas: [tarefa('antiga', '2026-10-20'), tarefa('t1', '2026-10-27'), tarefa('aberta'), tarefa('t2', '2026-11-01')],
        habitos: [habito, { id: 'h2', titulo: 'Arquivado', arquivadoEm: 'x' } as Habito],
        registrosHabito: [
          { id: 'h1|2026-10-26', habitoId: 'h1', dia: '2026-10-26', nivel: 'completo', quando: '' },
          { id: 'h1|2026-10-29', habitoId: 'h1', dia: '2026-10-29', nivel: 'minimo', quando: '' },
          { id: 'h1|2026-10-20', habitoId: 'h1', dia: '2026-10-20', nivel: 'completo', quando: '' },
        ],
        rituais: [ritual('manha', '2026-10-27'), ritual('manha', '2026-10-28'), ritual('manha', '2026-10-29', false), ritual('noite', '2026-10-31')],
      },
      SEMANA,
    )
    expect(r.tarefasFeitas.map((t) => t.id)).toEqual(['t1', 't2'])
    expect(r.habitos).toEqual([{ habito, vezes: 2 }])
    expect(r.rituais).toEqual({ manha: 2, noite: 1 })
  })
})

describe('avisos sem resposta', () => {
  const dose = (dia: string, horario: string, avisos: number, status?: RegistroDose['status']): RegistroDose => ({
    id: `r1|${dia}|${horario}`,
    remedioId: 'r1',
    dia,
    horario,
    avisos,
    ...(status ? { status } : {}),
  })
  const nada = { habito: () => false, refeicao: () => false, ritual: () => false }

  it('doses com aviso e sem resposta, agrupadas por horário; fora da semana não conta', () => {
    const r = avisosSemResposta(
      [dose('2026-10-27', '08:00', 2), dose('2026-10-28', '08:00', 1), dose('2026-10-29', '08:00', 1, 'tomei'), dose('2026-10-28', '20:00', 0), dose('2026-10-20', '08:00', 3)],
      [],
      SEMANA,
      nada,
    )
    expect(r).toEqual([{ tipo: 'remedio', chave: 'remedio|r1|08:00', remedioId: 'r1', horario: '08:00', vezes: 2 }])
  })

  it('lembretes que tocaram num dia em que a coisa não foi feita', () => {
    const avisados = [
      'habito|h1|2026-10-27',
      'habito|h1|2026-10-28',
      'habito|h1|2026-10-29',
      'refeicao|cafe|2026-10-30',
      'ritual|manha|2026-10-31',
      'ritual|noite|2026-10-31',
      'ritual|revisao|2026-10-26',
      'vespera|h1|2026-10-30',
      'conta|c1|2026-10|dia',
      'habito|h1|2026-10-01',
    ]
    const r = avisosSemResposta([], avisados, SEMANA, {
      habito: (_, dia) => dia === '2026-10-29',
      refeicao: () => false,
      ritual: (ritual) => ritual === 'noite',
    })
    expect(r.map((x) => [x.chave, x.vezes])).toEqual([
      ['habito|h1', 2],
      ['refeicao|cafe', 1],
      ['ritual|manha', 1],
    ])
  })
})

describe('o que ajustar, da revisão anterior', () => {
  it('a revisão mais recente antes desta, com resposta', () => {
    const rev = (dia: string, ajusto?: string) => ({ id: `revisao|${dia}`, ritual: 'revisao', dia, comecouEm: '', passo: 'semana', respostas: { ajusto } }) as RegistroRitual
    const todas = [rev('2026-10-12', 'deitar mais cedo'), rev('2026-10-19', 'água na mesa'), rev('2026-10-26', '  '), rev('2026-11-02', 'futuro')]
    expect(ajusteAnterior(todas, 'revisao|2026-10-26')).toEqual({ dia: '2026-10-19', ajusto: 'água na mesa' })
    expect(ajusteAnterior(todas, 'revisao|2026-10-12')).toBeUndefined()
  })
})
