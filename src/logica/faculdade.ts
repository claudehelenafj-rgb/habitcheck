// Faculdade: provas e entregas do semestre, lembretes de 2 semanas e 3 dias antes, e o planejamento
// de trás para frente (o conteúdo da prova vira sessões curtas, com data, até a véspera).

import type { Tarefa } from '../dados/banco'
import { diasEntre, somarDias, type Dia } from './datas'
import { LIMITE_TAREFAS_A } from './tarefas'

export type TipoAvaliacao = 'prova' | 'entrega'

export type Avaliacao = {
  id: string
  materia: string
  tipo: TipoAvaliacao
  titulo: string
  data: Dia
  hora?: string
  /** conteúdos da prova, um por item (usados no planejamento) */
  conteudos?: string[]
  feitaEm?: string // ISO
  criadaEm: string // ISO
}

/** Lembretes automáticos: 2 semanas e 3 dias antes. */
export const ANTECEDENCIAS = [14, 3] as const

export function diasAte(a: Pick<Avaliacao, 'data'>, hoje: Dia): number {
  return diasEntre(hoje, a.data)
}

/** Hoje é dia de lembrar desta avaliação? Devolve a antecedência (14 ou 3) ou null. */
export function lembreteDeHoje(a: Avaliacao, hoje: Dia): (typeof ANTECEDENCIAS)[number] | null {
  if (a.feitaEm) return null
  const d = diasAte(a, hoje)
  return ANTECEDENCIAS.find((x) => x === d) ?? null
}

/** Próximas (de hoje em diante, não concluídas), da mais perto para a mais longe. */
export function proximas(lista: Avaliacao[], hoje: Dia): Avaliacao[] {
  return lista
    .filter((a) => !a.feitaEm && a.data >= hoje)
    .sort((a, b) => `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`))
}

export type OpcoesPlano = {
  /** primeiro dia em que dá para estudar */
  inicio: Dia
  /** no máximo quantas sessões por dia */
  porDia: 1 | 2
  /** guardar a véspera para uma revisão geral */
  revisao: boolean
}

export type SessaoPlanejada = { dia: Dia; conteudos: string[]; revisao?: boolean }

/**
 * Divide os conteúdos em sessões com data, do início até a véspera da prova.
 * - Espalha por igual nos dias disponíveis (estudo espaçado, não tudo no fim).
 * - Com a revisão ligada (e pelo menos 2 dias), a véspera fica só para revisar tudo.
 * - Se houver mais conteúdos do que sessões possíveis, junta conteúdos na mesma sessão.
 */
export function planejarSessoes(conteudos: string[], dataProva: Dia, opcoes: OpcoesPlano): SessaoPlanejada[] {
  const itens = conteudos.map((c) => c.trim()).filter(Boolean)
  const ultimo = somarDias(dataProva, -1)
  if (opcoes.inicio > ultimo) return []
  const dias: Dia[] = []
  for (let d = opcoes.inicio; d <= ultimo; d = somarDias(d, 1)) dias.push(d)
  const comRevisao = opcoes.revisao && dias.length >= 2
  const diasDeEstudo = comRevisao ? dias.slice(0, -1) : dias
  const sessoes: SessaoPlanejada[] = []
  if (itens.length) {
    const vagas = diasDeEstudo.length * opcoes.porDia
    // grupos de conteúdos: um por sessão, ou juntando quando não há vagas para todos
    const grupos: string[][] = []
    const nGrupos = Math.min(itens.length, vagas)
    for (let g = 0; g < nGrupos; g++) {
      grupos.push(itens.slice(Math.floor((g * itens.length) / nGrupos), Math.floor(((g + 1) * itens.length) / nGrupos)))
    }
    // espalha os grupos pelos dias; com 2 por dia, enche primeiro os dias mais espaçados
    const porDia = Math.ceil(grupos.length / diasDeEstudo.length)
    const diasUsados = Math.ceil(grupos.length / porDia)
    grupos.forEach((g, i) => {
      const indiceDia = Math.floor((Math.floor(i / porDia) * diasDeEstudo.length) / diasUsados)
      sessoes.push({ dia: diasDeEstudo[indiceDia], conteudos: g })
    })
  }
  if (comRevisao || (!itens.length && dias.length)) sessoes.push({ dia: ultimo, conteudos: itens, revisao: true })
  return sessoes
}

export type TextosSessao = {
  /** título de uma sessão de estudo (matéria e conteúdos) */
  estudo: (materia: string, conteudos: string) => string
  /** título da revisão da véspera */
  revisao: (materia: string, titulo: string) => string
  /** primeiro passo físico e o "pronto quando" */
  passo: (conteudos: string) => string
  pronto: string
}

/**
 * Transforma as sessões planejadas em tarefas da área Faculdade, com o primeiro passo físico.
 * Viram tarefa A se ainda couber no dia (máximo 3 A por dia); se não couber, entram como B.
 */
export function sessoesParaTarefas(
  a: Avaliacao,
  sessoes: SessaoPlanejada[],
  duracaoMin: number,
  existentes: Tarefa[],
  textos: TextosSessao,
  gerarId: () => string,
  agoraIso: string,
): Tarefa[] {
  const aPorDia = new Map<Dia, number>()
  for (const t of existentes) if (t.prioridade === 'A' && t.dia && !t.feitaEm) aPorDia.set(t.dia, (aPorDia.get(t.dia) ?? 0) + 1)
  return sessoes.map((s) => {
    const conteudos = s.conteudos.join(', ')
    const usadas = aPorDia.get(s.dia) ?? 0
    const prioridade = usadas < LIMITE_TAREFAS_A ? 'A' : 'B'
    if (prioridade === 'A') aPorDia.set(s.dia, usadas + 1)
    return {
      id: gerarId(),
      titulo: s.revisao ? textos.revisao(a.materia, a.titulo) : textos.estudo(a.materia, conteudos),
      area: 'faculdade',
      prioridade,
      dia: s.dia,
      passos: [{ id: gerarId(), texto: textos.passo(conteudos || a.titulo), pronto: textos.pronto, feito: false }],
      estimativaMin: duracaoMin,
      avaliacaoId: a.id,
      criadaEm: agoraIso,
    }
  })
}
