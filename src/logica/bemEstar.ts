// Ferramentas da aba Bem-estar. A pessoa liga só as que quer; o guia sugere começar com uma ou duas.

import type { NomeAdesivo } from '../componentes/Adesivo'

export type IdFerramenta = 'checkin' | 'sintomas' | 'hobbies' | 'sugestoes' | 'sono' | 'resumo'

export type Ferramenta = {
  id: IdFerramenta
  adesivo: NomeAdesivo
  /** etapa do adicional em que a ferramenta fica pronta; ausente = já pronta */
  etapa?: string
}

export const FERRAMENTAS: Ferramenta[] = [
  { id: 'checkin', adesivo: 'nuvem' },
  { id: 'sintomas', adesivo: 'interrogacao' },
  { id: 'hobbies', adesivo: 'flor' },
  { id: 'sugestoes', adesivo: 'xicara', etapa: 'B5' },
  { id: 'sono', adesivo: 'lua', etapa: 'B6' },
  { id: 'resumo', adesivo: 'prancheta', etapa: 'B7' },
]

/** Acima disso o app só comenta, com gentileza; não bloqueia. */
export const SUGESTAO_FERRAMENTAS = 2

/** Liga ou desliga uma ferramenta, mantendo a ordem da lista de ferramentas. */
export function alternarFerramenta(ligadas: IdFerramenta[], id: IdFerramenta) {
  const nova = ligadas.includes(id) ? ligadas.filter((f) => f !== id) : [...ligadas, id]
  const ordenada = FERRAMENTAS.map((f) => f.id).filter((f) => nova.includes(f))
  return { ligadas: ordenada, muitas: ordenada.length > SUGESTAO_FERRAMENTAS }
}
