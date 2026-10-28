import type { NomeAdesivo } from '../componentes/Adesivo'

export type IdArea = 'remedios' | 'consultas' | 'academia' | 'faculdade' | 'quarto' | 'alimentacao' | 'base'

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
