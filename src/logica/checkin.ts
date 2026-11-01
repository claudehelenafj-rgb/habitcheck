// Check-in de emoções (guia de saúde mental, estratégia 3: nomeie e meça o que sente).
// Ansiedade, irritação e energia de 0 a 10. A faixa (0–3, 4–6, 7–10) da maior entre ansiedade e
// irritação escolhe o plano que a pessoa combinou antes, com as palavras dela.

import type { Dia } from './datas'

export type Medida = 'ansiedade' | 'irritacao' | 'energia'
export const MEDIDAS: Medida[] = ['ansiedade', 'irritacao', 'energia']

export type Checkin = {
  id: string
  /** ISO, com hora */
  quando: string
  /** dia local do registro */
  dia: Dia
  ansiedade: number
  irritacao: number
  energia: number
  /** sinais do corpo (opcional), escolhidos de uma lista que a pessoa edita */
  sinais?: string[]
  nota?: string
}

export type Faixa = 'leve' | 'media' | 'alta'
export const FAIXAS: Faixa[] = ['leve', 'media', 'alta']

export function faixa(valor: number): Faixa {
  if (valor <= 3) return 'leve'
  if (valor <= 6) return 'media'
  return 'alta'
}

/** A faixa que escolhe o plano: a maior entre ansiedade e irritação. A energia não entra aqui. */
export function faixaDoCheckin(c: Pick<Checkin, 'ansiedade' | 'irritacao'>): Faixa {
  return faixa(Math.max(c.ansiedade, c.irritacao))
}

export function valorValido(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10
}

export type PlanoFaixas = Record<Faixa, string>

/** Sinais do corpo sugeridos no começo; a pessoa apaga e cria os dela. */
export const SINAIS_INICIAIS = ['coração acelerado', 'ombros tensos', 'aperto no peito', 'barriga', 'calor', 'cansaço']

/** Check-ins de um dia, do mais recente para o mais antigo. */
export function doDia(lista: Checkin[], dia: Dia): Checkin[] {
  return lista.filter((c) => c.dia === dia).sort((a, b) => b.quando.localeCompare(a.quando))
}
