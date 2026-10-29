// Alimentação (guia: lembretes com a ação escrita, deixar à vista). Regularidade, não restrição:
// bolinhas das refeições e dos copos de água, lembrete para comer na hora combinada mesmo sem fome.
// Sem calorias, sem peso, sem comida "certa" ou "errada".

import type { Dia } from './datas'
import { blocoDoHorario, type Bloco, type Candidato } from './hoje'

export type IdRefeicao = 'cafe' | 'almoco' | 'lanche' | 'jantar'

export type Refeicao = {
  id: IdRefeicao
  /** nome escolhido pela pessoa (sem nome, usa o padrão do idioma) */
  nome?: string
  /** horário combinado ('HH:MM') */
  hora?: string
  ativa: boolean
  /** lembrete na hora, com a ação escrita */
  lembrar: boolean
}

export type ConfigAlimentacao = { refeicoes: Refeicao[]; aguaMeta: number }

export const CONFIG_ALIMENTACAO_PADRAO: ConfigAlimentacao = {
  refeicoes: [
    { id: 'cafe', hora: '08:00', ativa: true, lembrar: false },
    { id: 'almoco', hora: '12:30', ativa: true, lembrar: false },
    { id: 'lanche', hora: '16:00', ativa: true, lembrar: false },
    { id: 'jantar', hora: '19:30', ativa: true, lembrar: false },
  ],
  aguaMeta: 8,
}

/** O registro de um dia: quando cada refeição foi marcada e quantos copos de água. */
export type DiaAlimentacao = { dia: Dia; refeicoes: Partial<Record<IdRefeicao, string>>; agua: number }

export const diaVazio = (dia: Dia): DiaAlimentacao => ({ dia, refeicoes: {}, agua: 0 })

/** Uma refeição fica "na hora" por 1 hora a partir do horário combinado. */
export const JANELA_REFEICAO_MIN = 60

export function refeicoesAtivas(c: ConfigAlimentacao): Refeicao[] {
  return c.refeicoes.filter((r) => r.ativa)
}

export function progressoDoDia(c: ConfigAlimentacao, d: DiaAlimentacao | undefined) {
  const ativas = refeicoesAtivas(c)
  return {
    feitas: ativas.filter((r) => d?.refeicoes[r.id]).length,
    total: ativas.length,
    agua: d?.agua ?? 0,
    aguaMeta: c.aguaMeta,
  }
}

export function alternarRefeicao(d: DiaAlimentacao, id: IdRefeicao, agora: Date): DiaAlimentacao {
  const refeicoes = { ...d.refeicoes }
  if (refeicoes[id]) delete refeicoes[id]
  else refeicoes[id] = agora.toISOString()
  return { ...d, refeicoes }
}

/** Tocar no copo n (1, 2, 3…): enche até ele; tocar no último cheio esvazia esse. */
export function tocarCopo(d: DiaAlimentacao, n: number): DiaAlimentacao {
  return { ...d, agua: d.agua === n ? n - 1 : n }
}

function horarioNoDia(hora: string, agora: Date): Date {
  const [h, m] = hora.split(':').map(Number)
  const d = new Date(agora)
  d.setHours(h, m, 0, 0)
  return d
}

/** Minutos desde o horário da refeição hoje (negativo antes dele). */
function minutosDesde(r: Refeicao, agora: Date): number | null {
  return r.hora ? (agora.getTime() - horarioNoDia(r.hora, agora).getTime()) / 60_000 : null
}

/** A refeição que está na hora agora (do horário até 1 hora depois) e ainda não foi marcada. */
export function refeicaoNaHora(c: ConfigAlimentacao, d: DiaAlimentacao | undefined, agora: Date): Refeicao | undefined {
  return refeicoesAtivas(c).find((r) => {
    const passou = minutosDesde(r, agora)
    return passou !== null && passou >= 0 && passou < JANELA_REFEICAO_MIN && !d?.refeicoes[r.id]
  })
}

/** Lembrete: com o lembrete ligado, do horário até 30 min depois, se ainda não marcou. */
export function deveLembrarRefeicao(r: Refeicao, d: DiaAlimentacao | undefined, agora: Date): boolean {
  if (!r.ativa || !r.lembrar || d?.refeicoes[r.id]) return false
  const passou = minutosDesde(r, agora)
  return passou !== null && passou >= 0 && passou <= 30
}

/** Em que parte do dia a refeição aparece na linha do dia. */
export function blocoDaRefeicao(r: Refeicao): Bloco {
  if (r.hora) return blocoDoHorario(horarioNoDia(r.hora, new Date(2026, 0, 1)))
  return r.id === 'cafe' ? 'manha' : r.id === 'jantar' ? 'noite' : 'tarde'
}

/** Candidata ao cartão "Agora" (vem antes das tarefas A, só na hora da refeição). */
export function candidatosDeRefeicoes(c: ConfigAlimentacao, d: DiaAlimentacao | undefined, agora: Date, nome: (r: Refeicao) => string): Candidato[] {
  const r = refeicaoNaHora(c, d, agora)
  return r ? [{ tipo: 'refeicao', id: `refeicao|${r.id}`, titulo: nome(r), horario: horarioNoDia(r.hora!, agora), refeicao: r.id }] : []
}

/** Para a grade da semana: todas as refeições (feito), algumas (mínimo), nenhuma (contorno vazio, nunca erro). */
export function estadoDiaAlimentacao(c: ConfigAlimentacao, d: DiaAlimentacao | undefined, dia: Dia, hoje: Dia): 'feito' | 'minimo' | 'vazio' | 'futuro' {
  if (dia > hoje) return 'futuro'
  const { feitas, total } = progressoDoDia(c, d)
  if (total > 0 && feitas >= total) return 'feito'
  return feitas > 0 ? 'minimo' : 'vazio'
}

/** Comida fácil: algo que a pessoa já sabe preparar ou comprar pronto. */
export type Comida = {
  id: string
  nome: string
  jeito: 'preparo' | 'compro'
  /** para quais refeições serve (vazio = qualquer uma) */
  refeicoes: IdRefeicao[]
  ingredientes: string[]
  criadaEm: string
}

export type ItemCompra = { id: string; nome: string; criadoEm: string; compradoEm?: string }
