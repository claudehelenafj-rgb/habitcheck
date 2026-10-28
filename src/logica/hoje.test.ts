import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import {
  blocoDoHorario,
  blocoJaPassou,
  candidatosDeTarefas,
  escolherAgora,
  fimDoBloco,
  formatarDuracao,
  minutosAte,
  tarefasDoDia,
  type Candidato,
} from './hoje'

const em = (h: number, m = 0) => new Date(2026, 9, 28, h, m)

let n = 0
function tarefa(dados: Partial<Tarefa>): Tarefa {
  n++
  return {
    id: `t${n}`,
    titulo: `tarefa ${n}`,
    prioridade: 'A',
    dia: '2026-10-28',
    passos: [],
    criadaEm: `2026-10-28T08:00:${String(n).padStart(2, '0')}Z`,
    ...dados,
  }
}
const c = (t: Tarefa): Candidato => ({ tipo: 'tarefa', id: t.id, titulo: t.titulo, tarefa: t })

describe('blocos do dia', () => {
  it('manhã das 5h às 12h, tarde das 12h às 18h, noite das 18h às 5h', () => {
    expect(blocoDoHorario(em(5))).toBe('manha')
    expect(blocoDoHorario(em(11, 59))).toBe('manha')
    expect(blocoDoHorario(em(12))).toBe('tarde')
    expect(blocoDoHorario(em(18))).toBe('noite')
    expect(blocoDoHorario(em(2))).toBe('noite')
  })

  it('sabe quando o bloco acaba, inclusive a noite que vira o dia', () => {
    expect(fimDoBloco(em(9, 30))).toEqual(em(12))
    expect(fimDoBloco(em(14))).toEqual(em(18))
    expect(fimDoBloco(em(22))).toEqual(new Date(2026, 9, 29, 5))
    expect(fimDoBloco(em(1))).toEqual(em(5))
  })

  it('conta e escreve quanto falta', () => {
    expect(minutosAte(em(9, 30), em(12))).toBe(150)
    expect(minutosAte(em(13), em(12))).toBe(0)
    expect(formatarDuracao(150)).toBe('2h 30min')
    expect(formatarDuracao(60)).toBe('1h')
    expect(formatarDuracao(45)).toBe('45min')
  })

  it('bloco que já passou', () => {
    expect(blocoJaPassou('manha', 'tarde')).toBe(true)
    expect(blocoJaPassou('noite', 'tarde')).toBe(false)
    expect(blocoJaPassou('tarde', 'tarde')).toBe(false)
  })
})

describe('cartão Agora', () => {
  const manha = tarefa({ titulo: 'da manhã', bloco: 'manha' })
  const tarde = tarefa({ titulo: 'da tarde', bloco: 'tarde' })
  const semBloco = tarefa({ titulo: 'sem bloco' })

  it('sem nada, não escolhe nada', () => {
    expect(escolherAgora([], em(10))).toBeUndefined()
  })

  it('tarefa A do bloco atual vem antes da sem bloco', () => {
    expect(escolherAgora([c(semBloco), c(tarde), c(manha)], em(14))?.id).toBe(tarde.id)
  })

  it('sem tarefa do bloco atual, usa a sem bloco; depois, a de um bloco que já passou', () => {
    expect(escolherAgora([c(manha), c(semBloco)], em(14))?.id).toBe(semBloco.id)
    expect(escolherAgora([c(manha)], em(14))?.id).toBe(manha.id)
  })

  it('tarefa de um bloco que ainda vai chegar não aparece antes da hora', () => {
    expect(escolherAgora([c(tarde)], em(9))).toBeUndefined()
  })

  it('ignora tarefas feitas e que não são A', () => {
    const feita = tarefa({ bloco: 'tarde', feitaEm: '2026-10-28T15:00:00Z' })
    const b = tarefa({ prioridade: 'B', bloco: 'tarde' })
    expect(escolherAgora([c(feita), c(b)], em(14))).toBeUndefined()
  })

  it('remédio no horário passa na frente de tudo', () => {
    const remedio: Candidato = { tipo: 'remedio', id: 'r1', titulo: 'tomar o remédio', horario: em(14) }
    const compromisso: Candidato = { tipo: 'compromisso', id: 'c1', titulo: 'dentista', inicio: em(14, 10) }
    expect(escolherAgora([c(tarde), compromisso, remedio], em(14, 1))?.id).toBe('r1')
  })

  it('remédio de mais tarde ainda não aparece', () => {
    const remedio: Candidato = { tipo: 'remedio', id: 'r1', titulo: 'tomar o remédio', horario: em(20) }
    expect(escolherAgora([remedio, c(tarde)], em(14))?.id).toBe(tarde.id)
  })

  it('compromisso entra 15 minutos antes e passa na frente das tarefas', () => {
    const compromisso: Candidato = { tipo: 'compromisso', id: 'c1', titulo: 'dentista', inicio: em(15) }
    expect(escolherAgora([c(tarde), compromisso], em(14, 40))?.id).toBe(tarde.id)
    expect(escolherAgora([c(tarde), compromisso], em(14, 45))?.id).toBe('c1')
  })

  it('transição ativa ("começar a se arrumar") vem antes do compromisso', () => {
    const transicao: Candidato = { tipo: 'transicao', id: 'x1', titulo: 'começar a se arrumar', horario: em(14, 30) }
    const compromisso: Candidato = { tipo: 'compromisso', id: 'c1', titulo: 'dentista', inicio: em(14, 50) }
    expect(escolherAgora([compromisso, transicao], em(14, 40))?.id).toBe('x1')
  })

  it('hábito do bloco aparece só quando não há tarefa A', () => {
    const habito: Candidato = { tipo: 'habito', id: 'h1', titulo: 'ir à academia', bloco: 'tarde' }
    expect(escolherAgora([habito, c(tarde)], em(14))?.id).toBe(tarde.id)
    expect(escolherAgora([habito], em(14))?.id).toBe('h1')
    expect(escolherAgora([habito], em(9))).toBeUndefined()
  })
})

describe('tarefas da tela Hoje', () => {
  it('o título do candidato é o próximo passo físico', () => {
    const t = tarefa({ titulo: 'estudar', passos: [{ id: 'p', texto: 'abrir o arquivo', feito: false }] })
    expect(candidatosDeTarefas([t], '2026-10-28')[0].titulo).toBe('abrir o arquivo')
  })

  it('linha do dia: A de hoje e o que foi feito hoje', () => {
    const lista = [
      tarefa({ titulo: 'a hoje' }),
      tarefa({ titulo: 'a amanhã', dia: '2026-10-29' }),
      tarefa({ titulo: 'b feita hoje', prioridade: 'B', dia: undefined, feitaEm: 'x', feitaNoDia: '2026-10-28' }),
      tarefa({ titulo: 'b aberta', prioridade: 'B', dia: undefined }),
    ]
    expect(tarefasDoDia(lista, '2026-10-28').map((t) => t.titulo)).toEqual(['a hoje', 'b feita hoje'])
  })
})

describe('remédios no cartão Agora', () => {
  it('só doses na hora e sem resposta viram candidatas, com a ação escrita', async () => {
    const { candidatosDeRemedios } = await import('./hoje')
    const { dosesDoDia } = await import('./remedios')
    const r = { id: 'r1', nome: 'Vitamina D', horarios: ['08:00', '20:00'], repetir: { vezes: 2, intervaloMin: 10 }, ativo: true, criadoEm: '' }
    const doses = dosesDoDia([r], '2026-10-28')
    const lista = candidatosDeRemedios(doses, [], em(9))
    expect(lista.map((x) => x.titulo)).toEqual(['Tomar Vitamina D e marcar no app'])
    const tomada = { id: doses[0].id, remedioId: 'r1', dia: '2026-10-28', horario: '08:00', avisos: 1, status: 'tomei' as const }
    expect(candidatosDeRemedios(doses, [tomada], em(9))).toHaveLength(0)
  })
})

describe('consultas no cartão Agora', () => {
  it('arrumar, depois sair, depois a consulta, e some quando acaba', async () => {
    const { candidatosDeConsultas } = await import('./hoje')
    const c = {
      id: 'c1', titulo: 'Dentista', status: 'marcada' as const, data: '2026-10-28', hora: '14:30', duracaoMin: 60,
      deslocamentoMin: 30, preparoMin: 30, folgaPct: 30, preparo: [], criadaEm: '',
    }
    const textos = { arrumar: (t: string) => `Começar a se arrumar para ${t}`, sair: (t: string) => `Sair de casa para ${t}` }
    const escolher = (h: number, m: number) => escolherAgora(candidatosDeConsultas([c], em(h, m), textos), em(h, m))?.titulo
    expect(escolher(13, 0)).toBeUndefined()
    expect(escolher(13, 15)).toBe('Começar a se arrumar para Dentista')
    expect(escolher(13, 55)).toBe('Sair de casa para Dentista')
    expect(escolher(14, 40)).toBe('Dentista')
    expect(escolher(15, 31)).toBeUndefined()
    expect(candidatosDeConsultas([{ ...c, status: 'marcar' }], em(13, 15), textos)).toHaveLength(0)
  })
})

describe('eventos do calendário no cartão Agora', () => {
  it('evento com hora entra 15 min antes; dia todo não entra', async () => {
    const { candidatosDeEventos } = await import('./hoje')
    const { ocorrencias } = await import('./calendario')
    const ev = (id: string, h: number, diaInteiro = false) => ({
      id, titulo: id, origem: 'caderninho' as const, criadoEm: '', diaInteiro,
      inicio: (diaInteiro ? new Date(2026, 9, 28) : em(h)).toISOString(),
      fim: (diaInteiro ? new Date(2026, 9, 29) : em(h + 1)).toISOString(),
    })
    const lista = ocorrencias([ev('Almoço', 13), ev('Feriado', 0, true)], '2026-10-28', '2026-10-28')
    expect(escolherAgora(candidatosDeEventos(lista, em(12, 40)), em(12, 40))).toBeUndefined()
    expect(escolherAgora(candidatosDeEventos(lista, em(12, 50)), em(12, 50))?.titulo).toBe('Almoço')
    expect(escolherAgora(candidatosDeEventos(lista, em(14, 1)), em(14, 1))).toBeUndefined()
  })
})
