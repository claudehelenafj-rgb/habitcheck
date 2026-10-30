// Telas do app: caminho, adesivo, atalho de teclado e em que etapa cada uma fica pronta.

import type { NomeAdesivo } from './componentes/Adesivo'
import type { IdArea } from './design/areas'

export type IdTela =
  | 'hoje'
  | 'calendario'
  | 'caixa'
  | 'tarefas'
  | 'objetivos'
  | 'rituais'
  | 'remedios'
  | 'consultas'
  | 'academia'
  | 'faculdade'
  | 'quarto'
  | 'alimentacao'
  | 'dinheiro'
  | 'bemestar'
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
  { id: 'hoje', caminho: '/hoje', adesivo: 'sol', atalho: 'h' },
  { id: 'calendario', caminho: '/calendario', adesivo: 'calendario', atalho: 'c' },
  { id: 'tarefas', caminho: '/tarefas', adesivo: 'lista', atalho: 't' },
  { id: 'caixa', caminho: '/caixa', adesivo: 'envelope', atalho: 'x' },
  { id: 'objetivos', caminho: '/objetivos', adesivo: 'estrela', atalho: 'o' },
  { id: 'rituais', caminho: '/rituais', adesivo: 'lua', atalho: 'r' },
]

export const TELAS_AREAS: Tela[] = [
  { id: 'remedios', caminho: '/remedios', adesivo: 'pilula', atalho: 'm', area: 'remedios' },
  { id: 'consultas', caminho: '/consultas', adesivo: 'prancheta', atalho: 'n', area: 'consultas' },
  { id: 'academia', caminho: '/academia', adesivo: 'haltere', atalho: 'a', area: 'academia' },
  { id: 'faculdade', caminho: '/faculdade', adesivo: 'livro', atalho: 'f', area: 'faculdade' },
  { id: 'quarto', caminho: '/quarto', adesivo: 'vassoura', atalho: 'q', area: 'quarto' },
  { id: 'alimentacao', caminho: '/alimentacao', adesivo: 'prato', atalho: 'l', area: 'alimentacao' },
  { id: 'dinheiro', caminho: '/dinheiro', adesivo: 'cofrinho', atalho: 'd', area: 'dinheiro' },
  { id: 'bemestar', caminho: '/bem-estar', adesivo: 'cerebro', atalho: 'b', area: 'bemestar' },
]

export const TELA_AJUSTES: Tela = { id: 'ajustes', caminho: '/ajustes', adesivo: 'engrenagem', atalho: ',' }

export const TODAS_AS_TELAS = [...TELAS_PRINCIPAIS, ...TELAS_AREAS, TELA_AJUSTES]

/** Telas da barra de baixo no celular; o resto fica em "Mais". */
export const TELAS_BARRA_CELULAR: IdTela[] = ['hoje', 'tarefas', 'caixa', 'calendario']
