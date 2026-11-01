// Hobbies (guia de saúde mental: "interesses que recarregam"). Mostra de relance quais ficaram de lado,
// há quanto tempo e por quê. Ficar de lado não é falha: o adesivo só desbota, e dá para pausar ou arquivar.

import type { NomeAdesivo } from '../componentes/Adesivo'
import { diasEntre, somarDias, type Dia } from './datas'

export type Frequencia = { vezes: number; por: 'semana' | 'mes' }

export type MotivoParado = { dia: Dia; etiquetas: string[]; texto?: string }

export type Hobby = {
  id: string
  nome: string
  adesivo: NomeAdesivo
  frequencia: Frequencia
  criadoEm: string // ISO
  /** pausa de propósito: até este dia (inclusive) o hobby não desbota */
  pausadoAte?: Dia
  arquivadoEm?: string // ISO
  /** histórico do "por que está parado?", do mais antigo para o mais novo */
  motivos: MotivoParado[]
}

export type VezHobby = {
  id: string
  hobbyId: string
  dia: Dia
  quando: string // ISO
  duracaoMin?: number
}

export const MOTIVOS_INICIAIS = ['sem tempo', 'sem energia', 'perdi a vontade', 'sem dinheiro', 'sem companhia', 'esqueci']
export const DURACOES_RAPIDAS = [15, 30, 60]
/** Adesivos que a pessoa pode escolher para um hobby. */
export const ADESIVOS_HOBBY: NomeAdesivo[] = [
  'musica',
  'pincel',
  'novelo',
  'controle',
  'livro',
  'flor',
  'folha',
  'xicara',
  'prato',
  'haltere',
  'estrela',
  'lua',
  'planeta',
  'onda',
  'montanha',
  'sapinho',
]

/** Quantos dias cabem entre uma vez e outra para estar "em dia" (2 por semana = 3,5 dias). */
export function intervaloIdeal(f: Frequencia): number {
  return (f.por === 'semana' ? 7 : 30) / Math.max(1, f.vezes)
}

export function ultimaVez(vezes: VezHobby[]): VezHobby | undefined {
  return vezes.reduce<VezHobby | undefined>((ult, v) => (!ult || v.quando > ult.quando ? v : ult), undefined)
}

export type Situacao =
  | { tipo: 'arquivado' }
  | { tipo: 'pausado'; ate: Dia }
  | { tipo: 'emDia'; dias: number | null }
  /** desbote 1 = passou um pouco do combinado; 2 = passou do dobro */
  | { tipo: 'deLado'; dias: number; desbote: 1 | 2; motivo?: MotivoParado }

/**
 * Situação do hobby hoje. "dias" conta desde a última vez; se nunca aconteceu, conta desde que foi criado
 * (e um hobby novo, sem nenhuma vez, fica em dia até passar o intervalo).
 */
export function situacao(h: Hobby, vezes: VezHobby[], hoje: Dia, criadoNoDia: Dia): Situacao {
  if (h.arquivadoEm) return { tipo: 'arquivado' }
  if (h.pausadoAte && h.pausadoAte >= hoje) return { tipo: 'pausado', ate: h.pausadoAte }
  const ult = ultimaVez(vezes)
  // a contagem recomeça quando a pausa termina: pausar não deixa dívida
  const desde = [ult?.dia, criadoNoDia, h.pausadoAte && somarDias(h.pausadoAte, 1)].filter(Boolean).sort().at(-1)!
  const dias = Math.max(0, diasEntre(desde, hoje))
  const ideal = intervaloIdeal(h.frequencia)
  if (dias <= ideal) return { tipo: 'emDia', dias: ult ? diasEntre(ult.dia, hoje) : null }
  const motivo = h.motivos.at(-1)
  const motivoValido = motivo && (!ult || motivo.dia >= ult.dia) ? motivo : undefined
  return { tipo: 'deLado', dias, desbote: dias > ideal * 2 ? 2 : 1, motivo: motivoValido }
}

/** Quantas vezes no período atual (semana de segunda a domingo, ou mês). */
export function vezesNoPeriodo(f: Frequencia, vezes: VezHobby[], hoje: Dia, inicioSemana: Dia): number {
  const inicio = f.por === 'semana' ? inicioSemana : `${hoje.slice(0, 7)}-01`
  return vezes.filter((v) => v.dia >= inicio && v.dia <= hoje).length
}

/** Ordem da lista: de lado primeiro (mais tempo parado antes), depois em dia, depois pausados. */
export function ordenar<T extends { situacao: Situacao; hobby: Hobby }>(itens: T[]): T[] {
  const peso = (s: Situacao) => (s.tipo === 'deLado' ? 0 : s.tipo === 'emDia' ? 1 : s.tipo === 'pausado' ? 2 : 3)
  return [...itens].sort(
    (a, b) =>
      peso(a.situacao) - peso(b.situacao) ||
      (b.situacao.tipo === 'deLado' ? b.situacao.dias : 0) - (a.situacao.tipo === 'deLado' ? a.situacao.dias : 0) ||
      a.hobby.nome.localeCompare(b.hobby.nome, 'pt-BR'),
  )
}
