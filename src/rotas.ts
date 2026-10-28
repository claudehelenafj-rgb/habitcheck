// Telas do app: caminho, adesivo, atalho de teclado e em que etapa cada uma fica pronta.

import type { NomeAdesivo } from './componentes/Adesivo'
import type { IdArea } from './design/areas'

export type IdTela =
  | 'hoje'
  | 'calendario'
  | 'caixa'
  | 'objetivos'
  | 'rituais'
  | 'remedios'
  | 'consultas'
  | 'academia'
  | 'faculdade'
  | 'quarto'
  | 'alimentacao'
  | 'ajustes'

export type Tela = {
  id: IdTela
  caminho: string
  adesivo: NomeAdesivo
  /** tecla de atalho (sem modificador), mostrada ao lado do nome */
  atalho: string
  /** etapa do plano em que a tela fica pronta; ausente = já pronta */
  etapa?: number
  area?: IdArea
}

export const TELAS_PRINCIPAIS: Tela[] = [
  { id: 'hoje', caminho: '/hoje', adesivo: 'sol', atalho: 'h', etapa: 5 },
  { id: 'calendario', caminho: '/calendario', adesivo: 'calendario', atalho: 'c', etapa: 8 },
  { id: 'caixa', caminho: '/caixa', adesivo: 'envelope', atalho: 'x', etapa: 4 },
  { id: 'objetivos', caminho: '/objetivos', adesivo: 'estrela', atalho: 'o', etapa: 14 },
  { id: 'rituais', caminho: '/rituais', adesivo: 'lua', atalho: 'r', etapa: 13 },
]

export const TELAS_AREAS: Tela[] = [
  { id: 'remedios', caminho: '/remedios', adesivo: 'pilula', atalho: 'm', etapa: 6, area: 'remedios' },
  { id: 'consultas', caminho: '/consultas', adesivo: 'prancheta', atalho: 'n', etapa: 7, area: 'consultas' },
  { id: 'academia', caminho: '/academia', adesivo: 'haltere', atalho: 'a', etapa: 10, area: 'academia' },
  { id: 'faculdade', caminho: '/faculdade', adesivo: 'livro', atalho: 'f', etapa: 9, area: 'faculdade' },
  { id: 'quarto', caminho: '/quarto', adesivo: 'vassoura', atalho: 'q', etapa: 11, area: 'quarto' },
  { id: 'alimentacao', caminho: '/alimentacao', adesivo: 'prato', atalho: 'l', etapa: 12, area: 'alimentacao' },
]

export const TELA_AJUSTES: Tela = { id: 'ajustes', caminho: '/ajustes', adesivo: 'engrenagem', atalho: ',' }

export const TODAS_AS_TELAS = [...TELAS_PRINCIPAIS, ...TELAS_AREAS, TELA_AJUSTES]

/** Telas da barra de baixo no celular; o resto fica em "Mais". */
export const TELAS_BARRA_CELULAR: IdTela[] = ['hoje', 'calendario', 'caixa', 'objetivos']
