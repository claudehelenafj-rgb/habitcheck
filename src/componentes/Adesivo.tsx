// Adesivos originais do Caderninho (SVG desenhado à mão no código).
// Cada adesivo tem traço em chocolate; o contorno branco e a sombra vêm da classe .adesivo.

import type { ReactNode } from 'react'

const C = '#422F0E' // traço sempre chocolate: o adesivo é um "objeto" e não muda no modo escuro
const T = { stroke: C, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

const desenhos = {
  pilula: (
    <g transform="rotate(-35 32 32)">
      <path d="M32 14h-9a12 12 0 0 0 0 36h9z" fill="#EF6545" {...T} />
      <path d="M32 14h9a12 12 0 0 1 0 36h-9z" fill="#FCC4C0" {...T} />
      <path d="M18 24a7 7 0 0 1 5-4" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    </g>
  ),
  calendario: (
    <g>
      <rect x="10" y="14" width="44" height="40" rx="7" fill="#FBF6EE" {...T} />
      <path d="M10 28V21a7 7 0 0 1 7-7h30a7 7 0 0 1 7 7v7z" fill="#037F71" {...T} />
      <path d="M22 9v10M42 9v10" {...T} />
      <circle cx="22" cy="37" r="2.5" fill={C} />
      <circle cx="32" cy="37" r="2.5" fill={C} />
      <circle cx="42" cy="37" r="2.5" fill={C} />
      <circle cx="22" cy="46" r="2.5" fill={C} />
      <path d="M28 45l3 3 6-7" fill="none" {...T} stroke="#037F71" />
    </g>
  ),
  prancheta: (
    <g>
      <rect x="13" y="12" width="38" height="44" rx="6" fill="#AECFD0" {...T} />
      <rect x="23" y="7" width="18" height="10" rx="4" fill="#FBF6EE" {...T} />
      <path d="M32 26v16M24 34h16" stroke="#037F71" strokeWidth={6} strokeLinecap="round" />
      <path d="M22 49h20" {...T} />
    </g>
  ),
  haltere: (
    <g transform="rotate(-20 32 32)">
      <path d="M18 32h28" {...T} strokeWidth={5} />
      <rect x="9" y="20" width="9" height="24" rx="3" fill="#F49625" {...T} />
      <rect x="46" y="20" width="9" height="24" rx="3" fill="#F49625" {...T} />
      <rect x="4" y="25" width="5" height="14" rx="2" fill="#FFD094" {...T} />
      <rect x="55" y="25" width="5" height="14" rx="2" fill="#FFD094" {...T} />
    </g>
  ),
  livro: (
    <g>
      <path d="M14 12h32a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14z" fill="#F9D4F8" {...T} />
      <path d="M14 12a5 5 0 0 0-5 5v33a5 5 0 0 1 5-5h36" fill="#EA5E86" {...T} />
      <path d="M14 45v9" {...T} />
      <path d="M38 12v18l-4-3-4 3V12" fill="#EA5E86" {...T} />
      <path d="M20 37h20" {...T} />
    </g>
  ),
  vassoura: (
    <g transform="rotate(25 32 32)">
      <path d="M32 4v30" {...T} strokeWidth={4} />
      <path d="M24 32h16l6 26H18z" fill="#F7E9B2" {...T} />
      <path d="M26 38h12" {...T} />
      <path d="M26 46l-2 10M32 46v10M38 46l2 10" {...T} strokeWidth={2} />
    </g>
  ),
  prato: (
    <g>
      <circle cx="32" cy="34" r="22" fill="#FBF6EE" {...T} />
      <circle cx="32" cy="34" r="14" fill="#DDF2B8" {...T} />
      <path d="M26 36c2-8 10-10 14-8-1 6-7 11-14 8z" fill="#57B1A8" {...T} />
      <path d="M26 36l7-5" {...T} strokeWidth={2} />
    </g>
  ),
  copo: (
    <g>
      <path d="M16 12h32l-4 42a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#FBF6EE" {...T} />
      <path d="M18.5 30c4-3 8 3 13 0s9 3 14 0l-2.7 24a4 4 0 0 1-4 3.6H25a4 4 0 0 1-4-3.6z" fill="#AECFD0" />
      <path d="M16 12h32l-4 42a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="none" {...T} />
      <path d="M18.5 30c4-3 8 3 13 0s9 3 14 0" fill="none" {...T} strokeWidth={2} />
      <circle cx="28" cy="42" r="2" fill="#FFFFFF" />
      <circle cx="36" cy="48" r="1.5" fill="#FFFFFF" />
    </g>
  ),
  estrela: (
    <path
      d="M32 7l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 24l16-2z"
      fill="#F7E9B2"
      {...T}
      transform="rotate(-8 32 32)"
    />
  ),
  coracao: (
    <g transform="rotate(8 32 32)">
      <path d="M32 54S8 40 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 30-24 30z" fill="#EA5E86" {...T} />
      <path d="M17 22a6 6 0 0 1 6-5" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    </g>
  ),
  cereja: (
    <g>
      <path d="M22 42c2-14 6-24 18-32M44 40c-2-12-2-22-4-30" fill="none" {...T} />
      <path d="M40 10c6-4 13-3 16 2-6 3-12 2-16-2z" fill="#DDF2B8" {...T} />
      <circle cx="21" cy="46" r="10" fill="#EF6545" {...T} />
      <circle cx="44" cy="44" r="10" fill="#EF6545" {...T} />
      <path d="M16 43a5 5 0 0 1 4-4M39 41a5 5 0 0 1 4-4" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  envelope: (
    <g transform="rotate(-6 32 32)">
      <rect x="8" y="16" width="48" height="34" rx="5" fill="#F7E9B2" {...T} />
      <path d="M8 21l24 16 24-16" fill="none" {...T} />
      <circle cx="46" cy="16" r="7" fill="#EA5E86" {...T} />
    </g>
  ),
  sol: (
    <g>
      <circle cx="32" cy="32" r="12" fill="#FFD094" {...T} />
      <path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5" {...T} stroke="#422F0E" />
    </g>
  ),
  lua: (
    <g>
      <path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z" fill="#F9D4F8" {...T} />
      <circle cx="46" cy="18" r="2" fill={C} />
      <circle cx="52" cy="28" r="1.5" fill={C} />
    </g>
  ),
} satisfies Record<string, ReactNode>

export type NomeAdesivo = keyof typeof desenhos
export const NOMES_ADESIVOS = Object.keys(desenhos) as NomeAdesivo[]

type Props = {
  nome: NomeAdesivo
  tamanho?: number
  /** Texto para leitor de tela. Sem ele, o adesivo é tratado como decoração. */
  rotulo?: string
  className?: string
  decorativo?: boolean
}

export function Adesivo({ nome, tamanho = 48, rotulo, className = '', decorativo = false }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={tamanho}
      height={tamanho}
      className={`adesivo inline-block shrink-0 ${decorativo ? 'decor' : ''} ${className}`}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
    >
      {desenhos[nome]}
    </svg>
  )
}
