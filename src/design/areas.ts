import type { NomeAdesivo } from '../componentes/Adesivo'

export type IdArea =
  | 'remedios'
  | 'consultas'
  | 'academia'
  | 'faculdade'
  | 'quarto'
  | 'alimentacao'
  | 'dinheiro'
  | 'bemestar'
  | 'base'

export type Area = {
  id: IdArea
  nome: string
  adesivo: NomeAdesivo
  /** classe Tailwind do tom claro (fundo de cartão) */
  claro: string
  /** classe Tailwind do tom forte (ícone, check, barra) */
  forte: string
  /** cor do tom forte em CSS, para SVG */
  forteCss: string
}

export const AREAS: Record<IdArea, Area> = {
  remedios: {
    id: 'remedios',
    nome: 'Remédios',
    adesivo: 'pilula',
    claro: 'bg-morango-claro',
    forte: 'bg-tomate',
    forteCss: 'var(--forte-tomate)',
  },
  consultas: {
    id: 'consultas',
    nome: 'Consultas',
    adesivo: 'prancheta',
    claro: 'bg-azul-nevoa',
    forte: 'bg-verde-piscina',
    forteCss: 'var(--forte-piscina)',
  },
  academia: {
    id: 'academia',
    nome: 'Academia',
    adesivo: 'haltere',
    claro: 'bg-pessego',
    forte: 'bg-laranja',
    forteCss: 'var(--forte-laranja)',
  },
  faculdade: {
    id: 'faculdade',
    nome: 'Faculdade',
    adesivo: 'livro',
    claro: 'bg-lavanda',
    forte: 'bg-rosa',
    forteCss: 'var(--forte-rosa)',
  },
  quarto: {
    id: 'quarto',
    nome: 'Quarto',
    adesivo: 'vassoura',
    claro: 'bg-manteiga',
    forte: 'bg-tinta',
    forteCss: 'var(--forte-chocolate)',
  },
  alimentacao: {
    id: 'alimentacao',
    nome: 'Alimentação',
    adesivo: 'prato',
    claro: 'bg-menta',
    forte: 'bg-verde-agua',
    forteCss: 'var(--forte-agua)',
  },
  // menta + verde-piscina: verde de dinheiro. Divide um tom com Alimentação e outro com Consultas,
  // mas a combinação é única, e o adesivo e o nome sempre aparecem.
  dinheiro: {
    id: 'dinheiro',
    nome: 'Dinheiro',
    adesivo: 'cofrinho',
    claro: 'bg-menta',
    forte: 'bg-verde-piscina',
    forteCss: 'var(--forte-piscina)',
  },
  // lilás-névoa + ameixa. O lilás é parecido com a lavanda da Faculdade; o que separa as duas
  // é a cor forte (ameixa × rosa), o adesivo e o nome.
  bemestar: {
    id: 'bemestar',
    nome: 'Bem-estar',
    adesivo: 'cerebro',
    claro: 'bg-lilas',
    forte: 'bg-ameixa',
    forteCss: 'var(--forte-ameixa)',
  },
  base: {
    id: 'base',
    nome: 'Calendário e rituais',
    adesivo: 'calendario',
    claro: 'bg-papel',
    forte: 'bg-tinta',
    forteCss: 'var(--forte-chocolate)',
  },
}

export const AREAS_PRINCIPAIS = (Object.values(AREAS) as Area[]).filter((a) => a.id !== 'base')

/** Áreas oferecidas no primeiro uso. O Bem-estar é opcional e se liga depois, nos Ajustes. */
export const AREAS_INICIO = AREAS_PRINCIPAIS.filter((a) => a.id !== 'bemestar')
