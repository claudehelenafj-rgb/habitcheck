// Plano de início em 2 semanas (seção 7 do guia) e regras do primeiro uso.
// Falhar é esperado: sumir alguns dias nunca zera nada; a pessoa pode continuar de onde parou.

import type { IdArea } from '../design/areas'
import { diasEntre, somarDias, type Dia } from './datas'

export const DURACAO_PLANO = 14
export const LIMITE_AREAS_INICIO = 2
/** A partir de quantos dias sem abrir o app mostramos o "que bom te ver". */
export const DIAS_PARA_ACOLHER = 3

export type IdFase = 'despejar' | 'rituais' | 'revisao1' | 'estrategia' | 'revisao2' | 'concluido'

export type Fase = { id: IdFase; primeiroDia: number; ultimoDia: number }

export const FASES: Fase[] = [
  { id: 'despejar', primeiroDia: 1, ultimoDia: 2 },
  { id: 'rituais', primeiroDia: 3, ultimoDia: 6 },
  { id: 'revisao1', primeiroDia: 7, ultimoDia: 7 },
  { id: 'estrategia', primeiroDia: 8, ultimoDia: 13 },
  { id: 'revisao2', primeiroDia: 14, ultimoDia: 14 },
]

/** Dia do plano (1 = dia em que começou). Antes de começar, devolve 1. */
export function diaDoPlano(inicio: Dia, hoje: Dia): number {
  return Math.max(1, diasEntre(inicio, hoje) + 1)
}

export function faseDoDia(dia: number): IdFase {
  return FASES.find((f) => dia >= f.primeiroDia && dia <= f.ultimoDia)?.id ?? 'concluido'
}

/** Quantos dias a pessoa ficou sem abrir o app (0 = abriu hoje ou ontem... ver DIAS_PARA_ACOLHER). */
export function diasSemAbrir(ultimaVisita: Dia | undefined, hoje: Dia): number {
  if (!ultimaVisita) return 0
  return Math.max(0, diasEntre(ultimaVisita, hoje) - 1)
}

export function deveAcolher(ultimaVisita: Dia | undefined, hoje: Dia): boolean {
  return diasSemAbrir(ultimaVisita, hoje) >= DIAS_PARA_ACOLHER
}

/**
 * "Continuar de onde parei": empurra o início do plano para que hoje seja
 * o dia seguinte ao último dia em que a pessoa abriu o app. Nada é perdido.
 */
export function retomarPlano(inicio: Dia, ultimaVisita: Dia, hoje: Dia): Dia {
  const diaAlcancado = diaDoPlano(inicio, ultimaVisita)
  const proximo = Math.min(diaAlcancado + 1, DURACAO_PLANO)
  return somarDias(hoje, -(proximo - 1))
}

export type ResultadoEscolha = { selecionadas: IdArea[]; passouDoLimite: boolean }

/** Liga ou desliga uma área na escolha inicial, respeitando o limite de 2. */
export function alternarArea(selecionadas: IdArea[], area: IdArea, limite = LIMITE_AREAS_INICIO): ResultadoEscolha {
  if (selecionadas.includes(area)) return { selecionadas: selecionadas.filter((a) => a !== area), passouDoLimite: false }
  if (selecionadas.length >= limite) return { selecionadas, passouDoLimite: true }
  return { selecionadas: [...selecionadas, area], passouDoLimite: false }
}

export type Periodo = 'madrugada' | 'manha' | 'tarde' | 'noite'

export function periodoDoDia(hora: number): Periodo {
  if (hora < 5) return 'madrugada'
  if (hora < 12) return 'manha'
  if (hora < 18) return 'tarde'
  return 'noite'
}
