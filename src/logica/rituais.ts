// Rituais de 5 minutos (seção 4.7 do guia). De manhã: ver o dia, escolher até 3 tarefas A, conferir remédios e
// consultas. À noite: marcar o que foi feito, passar pendências, esvaziar a caixa de entrada e preparar o dia seguinte.
// Com o Bem-estar ligado, entram o check-in (manhã) e a rotina de desacelerar (noite).
// Revisão semanal (20 min, dia e hora fixos): a semana, os avisos sem resposta, os hobbies, 5 minutos de dinheiro,
// as próximas 2 semanas e "o que funcionou? o que travou? o que eu ajusto?".

import type { Tarefa } from '../dados/banco'
import { ocorrencias, type Evento } from './calendario'
import { planoReverso, situacaoMarcar, type Consulta } from './consultas'
import { diaLocal, diasEntre, somarDias, type Dia } from './datas'
import { proximoVencimento, type Centavos, type Conta, type EstadoConta } from './dinheiro'
import type { Avaliacao } from './faculdade'
import { diasDaSemana, estadoDose, type DosePrevista, type RegistroDose } from './remedios'
import { dentroDaJanela } from './sono'
import { tarefasADoDia } from './tarefas'

export type IdRitual = 'manha' | 'noite' | 'revisao'
/** Os rituais do dia (5 minutos cada). */
export const RITUAIS: IdRitual[] = ['manha', 'noite']
export const TODOS_OS_RITUAIS: IdRitual[] = ['manha', 'noite', 'revisao']

export type IdPassoRitual =
  | 'checkin'
  | 'dia'
  | 'tarefasA'
  | 'remedios'
  | 'feito'
  | 'pendencias'
  | 'caixa'
  | 'amanha'
  | 'desacelerar'
  | 'semana'
  | 'alarmes'
  | 'hobbies'
  | 'dinheiro'
  | 'proximas'
  | 'perguntas'

export const DURACAO_RITUAL_MIN = 5
export const DURACAO_REVISAO_MIN = 20
/** O passo do dinheiro na revisão: 5 minutos. */
export const DURACAO_DINHEIRO_MIN = 5

export function duracaoDoRitual(ritual: IdRitual): number {
  return ritual === 'revisao' ? DURACAO_REVISAO_MIN : DURACAO_RITUAL_MIN
}

export type RespostasRevisao = { funcionou?: string; travou?: string; ajusto?: string }

/**
 * Um ritual de um dia (a revisão: de uma semana, pela segunda-feira): em que passo parou e quando terminou.
 * id = `${ritual}|${dia}`.
 */
export type RegistroRitual = {
  id: string
  ritual: IdRitual
  dia: Dia
  /** início do timer (dá para recomeçar) */
  comecouEm: string // ISO
  passo: IdPassoRitual
  /** quando entrou no passo atual (o dinheiro da revisão tem 5 minutos só dele) */
  passoDesde?: string // ISO
  feitoEm?: string // ISO
  respostas?: RespostasRevisao
}

export function idRitual(ritual: IdRitual, dia: Dia): string {
  return `${ritual}|${dia}`
}

/** O que está ligado e muda os passos: check-in, sono e hobbies (Bem-estar), remédios ou consultas, dinheiro. */
export type OpcoesRitual = { checkin: boolean; remedios: boolean; desacelerar: boolean; hobbies?: boolean; dinheiro?: boolean }

/** Passos de cada ritual, sempre na mesma ordem. Os opcionais só aparecem com a ferramenta ou a área ligada. */
export function passosDoRitual(ritual: IdRitual, op: OpcoesRitual): IdPassoRitual[] {
  if (ritual === 'manha') return [...(op.checkin ? (['checkin'] as const) : []), 'dia', 'tarefasA', ...(op.remedios ? (['remedios'] as const) : [])]
  if (ritual === 'revisao')
    return ['semana', 'alarmes', ...(op.hobbies ? (['hobbies'] as const) : []), ...(op.dinheiro ? (['dinheiro'] as const) : []), 'proximas', 'perguntas']
  return ['feito', 'pendencias', 'caixa', 'amanha', ...(op.desacelerar ? (['desacelerar'] as const) : [])]
}

/** Posição do passo na lista; um passo que saiu (ferramenta desligada no meio) volta para o primeiro. */
export function indiceDoPasso(passos: IdPassoRitual[], passo: IdPassoRitual | undefined): number {
  return Math.max(0, passo ? passos.indexOf(passo) : 0)
}

/** A noite vai até as 5h: o ritual da noite feito à 1h é o do dia anterior. A revisão é uma por semana (a segunda-feira). */
export function diaDoRitual(ritual: IdRitual, agora: Date): Dia {
  const hoje = diaLocal(agora)
  if (ritual === 'revisao') return diasDaSemana(hoje)[0]
  return ritual === 'noite' && agora.getHours() < 5 ? somarDias(hoje, -1) : hoje
}

/** Das 5h às 15h, o da manhã; depois, o da noite. */
export function ritualDaHora(agora: Date): IdRitual {
  const h = agora.getHours()
  return h >= 5 && h < 15 ? 'manha' : 'noite'
}

export function segundosRestantesRitual(r: Pick<RegistroRitual, 'comecouEm' | 'ritual'>, agora: Date): number {
  const passou = (agora.getTime() - new Date(r.comecouEm).getTime()) / 1000
  return Math.max(0, Math.ceil(duracaoDoRitual(r.ritual) * 60 - passou))
}

// ---------- Tarefas A (manhã) e pendências (noite) ----------

const porCriacao = (x: Tarefa, y: Tarefa) => x.criadaEm.localeCompare(y.criadaEm)

/** As A de hoje, abertas ou feitas (as feitas também ocupam o lugar). */
export function escolhidasParaHoje(tarefas: Tarefa[], hoje: Dia): Tarefa[] {
  return tarefasADoDia(tarefas, hoje).sort(porCriacao)
}

/** Para escolher as A de hoje: primeiro as A que ficaram de outro dia, depois as A sem dia, as B e as C. */
export function candidatasParaHoje(tarefas: Tarefa[], hoje: Dia): Tarefa[] {
  const abertas = tarefas.filter((t) => !t.feitaEm && t.dia !== hoje && !(t.dia && t.dia > hoje))
  const grupo = (t: Tarefa) => (t.prioridade === 'A' ? (t.dia ? 0 : 1) : t.prioridade === 'B' ? 2 : 3)
  return abertas.sort((x, y) => grupo(x) - grupo(y) || (x.dia ?? '').localeCompare(y.dia ?? '') || porCriacao(x, y))
}

export function paraODia(t: Tarefa, dia: Dia): Tarefa {
  return { ...t, prioridade: 'A', dia }
}

/** Sai das A e fica para depois, como B. Sessão de estudo mantém o dia (ela foi planejada para ele). */
export function virarB(t: Tarefa): Tarefa {
  return { ...t, prioridade: 'B', dia: t.avaliacaoId ? t.dia : undefined }
}

/** A deste dia (ou de antes) que ficaram abertas: as mais antigas primeiro. */
export function pendenciasDoDia(tarefas: Tarefa[], dia: Dia): Tarefa[] {
  return tarefas
    .filter((t) => t.prioridade === 'A' && !t.feitaEm && !!t.dia && t.dia <= dia)
    .sort((x, y) => x.dia!.localeCompare(y.dia!) || porCriacao(x, y))
}

// ---------- O dia (manhã) e o dia seguinte (noite) ----------

export type ItemAgenda =
  | { tipo: 'consulta'; id: string; titulo: string; hora?: string; arrumar?: string; local?: string }
  | { tipo: 'evento'; id: string; titulo: string; hora?: string; local?: string }
  | { tipo: 'avaliacao'; id: string; titulo: string; hora?: string; avaliacao: Avaliacao }
  | { tipo: 'conta'; id: string; titulo: string; hora?: undefined; valor?: Centavos; estado: EstadoConta }

const hhmm = (d: Date) => d.toTimeString().slice(0, 5)

/** Compromissos de um dia: o dia todo e as contas primeiro, depois por horário. */
export function agendaDoDia(
  dados: { consultas: Consulta[]; eventos: Evento[]; avaliacoes: Avaliacao[]; contas: Conta[] },
  dia: Dia,
): ItemAgenda[] {
  const itens: ItemAgenda[] = []
  for (const c of dados.consultas) {
    if (c.status !== 'marcada' || c.data !== dia) continue
    const plano = planoReverso(c)
    itens.push({ tipo: 'consulta', id: c.id, titulo: c.titulo, hora: c.hora, arrumar: plano ? hhmm(plano.comecarArrumar) : undefined, local: c.local })
  }
  for (const o of ocorrencias(dados.eventos, dia, dia)) {
    itens.push({
      tipo: 'evento',
      id: `${o.evento.id}|${o.inicio.toISOString()}`,
      titulo: o.evento.titulo,
      hora: o.evento.diaInteiro || o.diaInicio !== dia ? undefined : hhmm(o.inicio),
      local: o.evento.local,
    })
  }
  for (const a of dados.avaliacoes) {
    if (a.data === dia && !a.feitaEm) itens.push({ tipo: 'avaliacao', id: a.id, titulo: a.titulo, hora: a.hora, avaliacao: a })
  }
  for (const conta of dados.contas) {
    const v = proximoVencimento(conta, dia)
    if (v && (v.estado === 'hoje' || v.estado === 'atrasada')) itens.push({ tipo: 'conta', id: conta.id, titulo: conta.nome, valor: conta.valor, estado: v.estado })
  }
  return itens.sort((x, y) => (x.hora ?? '').localeCompare(y.hora ?? ''))
}

/** Consultas para conferir de manhã: as marcadas dos próximos 7 dias e as que já está na hora de marcar. */
export function consultasParaConferir(consultas: Consulta[], hoje: Dia): { proximas: Consulta[]; marcar: Consulta[] } {
  const proximas = consultas
    .filter((c) => c.status === 'marcada' && !!c.data && diasEntre(hoje, c.data) >= 0 && diasEntre(hoje, c.data) <= 7)
    .sort((x, y) => `${x.data}${x.hora ?? ''}`.localeCompare(`${y.data}${y.hora ?? ''}`))
  const marcar = consultas.filter((c) => c.status === 'marcar' && situacaoMarcar(c.marcarAte, hoje) === 'hora-de-marcar')
  return { proximas, marcar }
}

/** Doses que já passaram da hora e ficaram sem resposta (para marcar à noite). */
export function dosesSemResposta(doses: DosePrevista[], registros: RegistroDose[], agora: Date): DosePrevista[] {
  return doses.filter((d) => estadoDose(d, registros.find((r) => r.id === d.id), agora) === 'agora')
}

// ---------- Lembretes ----------

/** `diaSemana` (0 = domingo): só para a revisão semanal, que tem dia fixo. */
export type LembreteRitual = { ativo: boolean; hora: string; diaSemana?: number }
export type ConfigRituais = { lembretes: Record<IdRitual, LembreteRitual> }

export const CONFIG_RITUAIS_PADRAO: ConfigRituais = {
  lembretes: {
    manha: { ativo: false, hora: '08:00' },
    noite: { ativo: false, hora: '21:30' },
    revisao: { ativo: false, hora: '18:00', diaSemana: 0 },
  },
}

/** Lembra uma vez, até 30 min depois do horário (no dia fixo, para a revisão), se ainda não foi feito. */
export function deveLembrarRitual(lembrete: LembreteRitual | undefined, registro: Pick<RegistroRitual, 'feitoEm'> | undefined, agora: Date): boolean {
  if (lembrete?.diaSemana !== undefined && agora.getDay() !== lembrete.diaSemana) return false
  return !!lembrete?.ativo && !registro?.feitoEm && dentroDaJanela(lembrete.hora, agora)
}

/** A revisão é hoje (dia fixo)? */
export function eDiaDaRevisao(lembrete: LembreteRitual | undefined, agora: Date): boolean {
  return lembrete?.diaSemana !== undefined && agora.getDay() === lembrete.diaSemana
}
