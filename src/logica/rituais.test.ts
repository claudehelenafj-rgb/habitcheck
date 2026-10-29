import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import type { Evento } from './calendario'
import type { Consulta } from './consultas'
import type { Conta } from './dinheiro'
import type { DosePrevista, Remedio } from './remedios'
import {
  agendaDoDia,
  candidatasParaHoje,
  consultasParaConferir,
  deveLembrarRitual,
  diaDoRitual,
  dosesSemResposta,
  escolhidasParaHoje,
  indiceDoPasso,
  paraODia,
  passosDoRitual,
  pendenciasDoDia,
  ritualDaHora,
  segundosRestantesRitual,
  virarB,
} from './rituais'

const HOJE = '2026-10-28'
const em = (h: number, m = 0, d = 28) => new Date(2026, 9, d, h, m)

let n = 0
function tarefa(dados: Partial<Tarefa>): Tarefa {
  n++
  return { id: `t${n}`, titulo: `tarefa ${n}`, prioridade: 'B', passos: [], criadaEm: `2026-10-20T08:00:${String(n).padStart(2, '0')}Z`, ...dados }
}

function consulta(dados: Partial<Consulta>): Consulta {
  return {
    id: 'c1',
    titulo: 'Dentista',
    status: 'marcada',
    duracaoMin: 30,
    deslocamentoMin: 20,
    preparoMin: 30,
    folgaPct: 0,
    preparo: [],
    criadaEm: '2026-10-01T10:00:00Z',
    ...dados,
  }
}

describe('passos dos rituais', () => {
  it('manhã: check-in e remédios só quando ligados', () => {
    expect(passosDoRitual('manha', { checkin: false, remedios: false, desacelerar: true })).toEqual(['dia', 'tarefasA'])
    expect(passosDoRitual('manha', { checkin: true, remedios: true, desacelerar: false })).toEqual(['checkin', 'dia', 'tarefasA', 'remedios'])
  })

  it('noite: desacelerar só com o sono ligado', () => {
    expect(passosDoRitual('noite', { checkin: true, remedios: true, desacelerar: false })).toEqual(['feito', 'pendencias', 'caixa', 'amanha'])
    expect(passosDoRitual('noite', { checkin: false, remedios: false, desacelerar: true }).at(-1)).toBe('desacelerar')
  })

  it('passo que saiu da lista volta para o primeiro', () => {
    const passos = passosDoRitual('manha', { checkin: false, remedios: false, desacelerar: false })
    expect(indiceDoPasso(passos, 'tarefasA')).toBe(1)
    expect(indiceDoPasso(passos, 'checkin')).toBe(0)
    expect(indiceDoPasso(passos, undefined)).toBe(0)
  })
})

describe('dia e hora do ritual', () => {
  it('a noite vai até as 5h', () => {
    expect(diaDoRitual('noite', em(23))).toBe(HOJE)
    expect(diaDoRitual('noite', em(1, 0, 29))).toBe(HOJE)
    expect(diaDoRitual('noite', em(5, 0, 29))).toBe('2026-10-29')
    expect(diaDoRitual('manha', em(1, 0, 29))).toBe('2026-10-29')
  })

  it('manhã das 5h às 15h, noite no resto', () => {
    expect(ritualDaHora(em(5))).toBe('manha')
    expect(ritualDaHora(em(14, 59))).toBe('manha')
    expect(ritualDaHora(em(15))).toBe('noite')
    expect(ritualDaHora(em(2))).toBe('noite')
  })

  it('5 minutos contados do começo, sem passar de zero', () => {
    const r = { comecouEm: em(8).toISOString() }
    expect(segundosRestantesRitual(r, em(8))).toBe(300)
    expect(segundosRestantesRitual(r, em(8, 2))).toBe(180)
    expect(segundosRestantesRitual(r, em(9))).toBe(0)
  })
})

describe('tarefas A da manhã', () => {
  it('escolhidas: as A de hoje, abertas e feitas', () => {
    const a = tarefa({ prioridade: 'A', dia: HOJE })
    const feita = tarefa({ prioridade: 'A', dia: HOJE, feitaEm: '2026-10-28T09:00:00Z' })
    const outra = tarefa({ prioridade: 'A', dia: '2026-10-27' })
    expect(escolhidasParaHoje([outra, feita, a], HOJE).map((t) => t.id)).toEqual([a.id, feita.id])
  })

  it('candidatas: A de outro dia, A sem dia, B, C; sem as feitas nem as de dias futuros', () => {
    const c = tarefa({ prioridade: 'C' })
    const b = tarefa({ prioridade: 'B' })
    const aSemDia = tarefa({ prioridade: 'A' })
    const aOntem = tarefa({ prioridade: 'A', dia: '2026-10-27' })
    const aAntes = tarefa({ prioridade: 'A', dia: '2026-10-20' })
    const futura = tarefa({ prioridade: 'A', dia: '2026-10-30' })
    const feita = tarefa({ prioridade: 'B', feitaEm: '2026-10-27T10:00:00Z' })
    const deHoje = tarefa({ prioridade: 'A', dia: HOJE })
    expect(candidatasParaHoje([c, b, aSemDia, aOntem, aAntes, futura, feita, deHoje], HOJE).map((t) => t.id)).toEqual([
      aAntes.id,
      aOntem.id,
      aSemDia.id,
      b.id,
      c.id,
    ])
  })

  it('para hoje vira A do dia; virar B tira o dia, menos da sessão de estudo', () => {
    const t = tarefa({ prioridade: 'C' })
    expect(paraODia(t, HOJE)).toMatchObject({ prioridade: 'A', dia: HOJE })
    expect(virarB({ ...t, prioridade: 'A', dia: HOJE })).toMatchObject({ prioridade: 'B', dia: undefined })
    expect(virarB({ ...t, prioridade: 'A', dia: HOJE, avaliacaoId: 'p1' })).toMatchObject({ prioridade: 'B', dia: HOJE })
  })
})

describe('pendências da noite', () => {
  it('A abertas deste dia e de antes, as mais antigas primeiro', () => {
    const hoje = tarefa({ prioridade: 'A', dia: HOJE })
    const antes = tarefa({ prioridade: 'A', dia: '2026-10-25' })
    const feita = tarefa({ prioridade: 'A', dia: HOJE, feitaEm: '2026-10-28T20:00:00Z' })
    const amanha = tarefa({ prioridade: 'A', dia: '2026-10-29' })
    const b = tarefa({ prioridade: 'B', dia: HOJE })
    expect(pendenciasDoDia([hoje, antes, feita, amanha, b], HOJE).map((t) => t.id)).toEqual([antes.id, hoje.id])
  })
})

describe('agenda do dia', () => {
  it('junta consultas, eventos, provas e contas; sem horário primeiro', () => {
    const eventos: Evento[] = [
      { id: 'e1', titulo: 'Aula', inicio: new Date(2026, 9, 28, 14).toISOString(), fim: new Date(2026, 9, 28, 16).toISOString(), diaInteiro: false, origem: 'caderninho', criadoEm: '' },
      { id: 'e2', titulo: 'Feriado', inicio: new Date(2026, 9, 28).toISOString(), fim: new Date(2026, 9, 29).toISOString(), diaInteiro: true, origem: 'caderninho', criadoEm: '' },
      { id: 'e3', titulo: 'Outro dia', inicio: new Date(2026, 9, 30, 9).toISOString(), fim: new Date(2026, 9, 30, 10).toISOString(), diaInteiro: false, origem: 'caderninho', criadoEm: '' },
    ]
    const contas: Conta[] = [
      { id: 'k1', nome: 'Luz', valor: 12000, dia: 28, repete: true, avisarDiasAntes: 2, pagamentos: [], criadaEm: '2026-10-01T10:00:00Z' },
      { id: 'k2', nome: 'Internet', dia: 10, repete: true, avisarDiasAntes: 2, pagamentos: [], criadaEm: '2026-10-01T10:00:00Z' },
    ]
    const itens = agendaDoDia(
      {
        consultas: [consulta({ data: HOJE, hora: '10:00' }), consulta({ id: 'c2', data: '2026-10-29', hora: '09:00' })],
        eventos,
        avaliacoes: [{ id: 'p1', materia: 'Física', tipo: 'prova', titulo: 'P1', data: HOJE, hora: '08:00', criadaEm: '' }],
        contas,
      },
      HOJE,
    )
    // a conta que venceu e não foi marcada continua aparecendo, como na tela Hoje
    expect(itens.map((i) => i.titulo)).toEqual(['Feriado', 'Luz', 'Internet', 'P1', 'Dentista', 'Aula'])
    expect(itens.filter((i) => i.tipo === 'conta').map((i) => i.tipo === 'conta' && i.estado)).toEqual(['hoje', 'atrasada'])
    expect(itens.find((i) => i.tipo === 'consulta')).toMatchObject({ hora: '10:00', arrumar: '09:10' })
  })
})

describe('conferir consultas e remédios', () => {
  it('marcadas nos próximos 7 dias e as que já passou da hora de marcar', () => {
    const r = consultasParaConferir(
      [
        consulta({ id: 'a', data: '2026-11-02', hora: '09:00' }),
        consulta({ id: 'b', data: HOJE, hora: '15:00' }),
        consulta({ id: 'c', data: '2026-11-20' }),
        consulta({ id: 'd', status: 'marcar', marcarAte: '2026-10-27' }),
        consulta({ id: 'e', status: 'marcar', marcarAte: '2026-12-27' }),
      ],
      HOJE,
    )
    expect(r.proximas.map((c) => c.id)).toEqual(['b', 'a'])
    expect(r.marcar.map((c) => c.id)).toEqual(['d'])
  })

  it('doses que passaram da hora sem resposta', () => {
    const remedio = { id: 'r1', nome: 'R' } as Remedio
    const dose = (horario: string, h: number): DosePrevista => ({ id: `r1|${HOJE}|${horario}`, remedio, dia: HOJE, horario, quando: em(h) })
    const doses = [dose('08:00', 8), dose('14:00', 14), dose('22:00', 22)]
    const registros = [{ id: doses[1].id, remedioId: 'r1', dia: HOJE, horario: '14:00', status: 'tomei' as const, avisos: 1 }]
    expect(dosesSemResposta(doses, registros as never, em(20)).map((d) => d.horario)).toEqual(['08:00'])
  })
})

describe('lembrete do ritual', () => {
  it('uma janela de 30 min, só se ligado e ainda não feito', () => {
    const l = { ativo: true, hora: '08:00' }
    expect(deveLembrarRitual(l, undefined, em(8, 10))).toBe(true)
    expect(deveLembrarRitual(l, undefined, em(8, 40))).toBe(false)
    expect(deveLembrarRitual({ ...l, ativo: false }, undefined, em(8, 10))).toBe(false)
    expect(deveLembrarRitual(l, { feitoEm: em(7, 50).toISOString() }, em(8, 10))).toBe(false)
  })
})
