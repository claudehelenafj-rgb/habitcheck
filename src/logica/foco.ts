// Modo foco (guia: sistema de trabalho, tempo visível e saída programada do hiperfoco).
// Uma sessão passa por fases: movimento (opcional, 5 a 20 min antes), foco, pausa de verdade e fim.
// Tudo é calculado a partir do início da fase atual: recarregar a página não perde o tempo.
// Quando a fase de foco acaba, o tempo para de contar: o alarme de saída não vira "mais foco".

import type { Dia } from './datas'

export type SessaoFoco = {
  id: string
  tarefaId?: string
  dia: Dia
  inicio: string // ISO
  fim: string // ISO
  /** minutos de foco de verdade (sem as pausas) */
  minutos: number
  /** quanto a pessoa achou que ia levar */
  estimativaMin?: number
}

export type FaseFoco = 'movimento' | 'foco' | 'pausa' | 'fim'

export type EstadoFoco = {
  tarefaId?: string
  titulo: string
  /** primeiro passo físico */
  passo: string
  pronto?: string
  estimativaMin?: number
  /** tamanho de cada bloco de foco */
  blocoMin: number
  fase: FaseFoco
  /** início da fase atual (ISO) */
  faseInicio: string
  faseMin: number
  /** minutos de foco das fases de foco que já passaram */
  focoMin: number
  /** quantos "mais 5 min" seguidos */
  extras: number
  comecouEm: string
  /** para onde voltar no fim (ex.: /faculdade) */
  volta: string
  som: boolean
  ondeParei?: string
  /** início da fase que já ganhou o aviso de "acabou" (para não avisar duas vezes) */
  avisadoEm?: string
}

export const DURACOES_FOCO = [25, 35, 45] as const
/** Mexer o corpo antes: de uma volta rápida a uma caminhada de verdade. */
export const MOVIMENTOS_MIN = [5, 15, 20] as const
export const EXTRA_MIN = 5
/** Depois de 2 "mais 5 min" seguidos, o botão some: a saída do hiperfoco é para valer. */
export const MAX_EXTRAS = 2

export function pausaPara(blocoMin: number): number {
  return blocoMin >= 45 ? 10 : 5
}

/** O menor bloco que cabe a estimativa (25 sem estimativa; 45 no máximo, o resto vira outro bloco). */
export function blocoSugerido(estimativaMin?: number): number {
  if (!estimativaMin) return DURACOES_FOCO[0]
  return DURACOES_FOCO.find((d) => d >= estimativaMin) ?? DURACOES_FOCO[DURACOES_FOCO.length - 1]
}

const minutosDesde = (inicio: string, agora: Date) => (agora.getTime() - new Date(inicio).getTime()) / 60_000

/** Quanto falta da fase atual, em segundos (0 quando acabou). */
export function segundosDaFase(e: EstadoFoco, agora: Date): number {
  if (e.fase === 'fim') return 0
  const restante = Math.round((e.faseMin - minutosDesde(e.faseInicio, agora)) * 60)
  return Math.min(e.faseMin * 60, Math.max(0, restante))
}

export function acabouFase(e: EstadoFoco, agora: Date): boolean {
  return e.fase !== 'fim' && segundosDaFase(e, agora) === 0
}

/** Foco da fase atual, sem passar do combinado. */
function focoDaFase(e: EstadoFoco, agora: Date): number {
  return e.fase === 'foco' ? Math.min(e.faseMin, Math.max(0, minutosDesde(e.faseInicio, agora))) : 0
}

/** Minutos de foco até agora (as pausas e o tempo do alarme não contam). */
export function minutosDeFoco(e: EstadoFoco, agora: Date): number {
  return Math.round(e.focoMin + focoDaFase(e, agora))
}

export type NovoFoco = Pick<EstadoFoco, 'titulo' | 'passo' | 'blocoMin' | 'volta' | 'som'> &
  Partial<Pick<EstadoFoco, 'tarefaId' | 'pronto' | 'estimativaMin'>>

/** `movimentoMin` 0 = sem mexer o corpo antes. */
export function novoFoco(dados: NovoFoco, agora: Date, movimentoMin: number): EstadoFoco {
  const inicio = agora.toISOString()
  return {
    ...dados,
    fase: movimentoMin > 0 ? 'movimento' : 'foco',
    faseInicio: inicio,
    faseMin: movimentoMin > 0 ? movimentoMin : dados.blocoMin,
    focoMin: 0,
    extras: 0,
    comecouEm: inicio,
  }
}

/** Começa um bloco de foco (depois do movimento, da pausa ou no lugar dela). */
export function comecarBloco(e: EstadoFoco, agora: Date): EstadoFoco {
  return { ...e, focoMin: e.focoMin + focoDaFase(e, agora), fase: 'foco', faseInicio: agora.toISOString(), faseMin: e.blocoMin, extras: 0 }
}

export function maisUmPouco(e: EstadoFoco, agora: Date): EstadoFoco {
  if (e.fase !== 'foco' || e.extras >= MAX_EXTRAS) return e
  return { ...e, focoMin: e.focoMin + focoDaFase(e, agora), faseInicio: agora.toISOString(), faseMin: EXTRA_MIN, extras: e.extras + 1 }
}

export function irParaPausa(e: EstadoFoco, agora: Date): EstadoFoco {
  return {
    ...e,
    focoMin: e.focoMin + focoDaFase(e, agora),
    fase: 'pausa',
    faseInicio: agora.toISOString(),
    faseMin: pausaPara(e.blocoMin),
    extras: 0,
  }
}

export function terminarFoco(e: EstadoFoco, agora: Date): EstadoFoco {
  if (e.fase === 'fim') return e
  return { ...e, focoMin: e.focoMin + focoDaFase(e, agora), fase: 'fim', faseInicio: agora.toISOString(), faseMin: 0 }
}

// ---------- "Quanto achei que ia levar" × "quanto levou" ----------

export type Comparacao = { achei: number; levou: number; jeito: 'parecido' | 'mais' | 'menos' }

/** "Parecido" com folga de 15% (no mínimo 3 min): estimar tempo é difícil para todo mundo. */
export function compararEstimativa(achei: number, levou: number): Comparacao {
  const folga = Math.max(3, achei * 0.15)
  const jeito = Math.abs(levou - achei) <= folga ? 'parecido' : levou > achei ? 'mais' : 'menos'
  return { achei, levou, jeito }
}

/**
 * Quanto costuma levar em relação ao que acha: a mediana das últimas 10 sessões com estimativa
 * (1,5 = leva uma vez e meia). Só com pelo menos 3 sessões, para não tirar conclusão de pouco.
 */
export function fatorDeEstimativa(sessoes: SessaoFoco[], minimo = 3): number | undefined {
  const razoes = sessoes
    .filter((s) => s.estimativaMin && s.estimativaMin > 0 && s.minutos > 0)
    .sort((a, b) => b.fim.localeCompare(a.fim))
    .slice(0, 10)
    .map((s) => s.minutos / s.estimativaMin!)
    .sort((a, b) => a - b)
  if (razoes.length < minimo) return undefined
  const meio = Math.floor(razoes.length / 2)
  const mediana = razoes.length % 2 ? razoes[meio] : (razoes[meio - 1] + razoes[meio]) / 2
  return Math.round(mediana * 10) / 10
}

/** Fator perto de 1: as estimativas têm batido. */
export const fatorBate = (fator: number) => fator >= 0.9 && fator <= 1.1

/** A estimativa corrigida pelo histórico, de 5 em 5 minutos. */
export function estimativaAjustada(achei: number, fator: number): number {
  return Math.max(5, Math.round((achei * fator) / 5) * 5)
}
