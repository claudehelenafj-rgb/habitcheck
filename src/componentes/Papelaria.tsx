// Peças de papelaria: miçangas de letrinhas e folha de caderno com fita.

import type { ReactNode } from 'react'

/**
 * Palavra escrita em miçangas de letrinhas. Só para palavras curtas (até ~10 letras):
 * o leitor de tela lê a palavra inteira.
 */
export function Micangas({ texto, tamanho = 40, className = '' }: { texto: string; tamanho?: number; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`} role="img" aria-label={texto}>
      {[...texto.toUpperCase()].map((letra, i) =>
        letra === ' ' ? (
          <span key={i} style={{ width: tamanho * 0.4 }} />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="micanga grid place-items-center rounded-full font-texto font-bold text-chocolate"
            style={{
              width: tamanho,
              height: tamanho * 0.92,
              fontSize: tamanho * 0.5,
              transform: `rotate(${((i * 37) % 11) - 5}deg)`,
            }}
          >
            {letra}
          </span>
        ),
      )}
    </span>
  )
}

/** Estrelinha de giz de cera (decorativa). */
export function EstrelaGiz({ cor, tamanho, className = '' }: { cor: string; tamanho: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={tamanho}
      height={tamanho}
      className={`decor pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      <path
        d="M20 2l3 11 10-6-6 10 11 3-11 3 6 10-10-6-3 11-3-11-10 6 6-10-11-3 11-3-6-10 10 6z"
        fill={cor}
        filter="url(#giz)"
      />
    </svg>
  )
}

/** Filtro de "giz de cera" para as estrelinhas. Renderizado uma vez na raiz do app. */
export function DefinicoesGiz() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="giz">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="2" result="ruido" />
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale="2.5" result="tremido" />
        <feColorMatrix
          in="ruido"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.1"
          result="falhas"
        />
        <feComposite in="tremido" in2="falhas" operator="in" />
      </filter>
    </svg>
  )
}

/**
 * Folha de caderno: furos, margem vermelha, pauta azul e um pedaço de fita no topo.
 * A pauta acompanha a altura da linha do texto (2rem), para escrever "em cima" das linhas.
 */
export function FolhaCaderno({
  children,
  fita = 'var(--rosa-selo)',
  inclinacao = -1,
  className = '',
}: {
  children: ReactNode
  fita?: string
  inclinacao?: number
  className?: string
}) {
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${inclinacao}deg)` }}>
      <span
        aria-hidden="true"
        className="decor absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-1 opacity-90 shadow-sm"
        style={{ background: fita }}
      />
      <div className="folha-caderno relative rounded-md pt-8 pr-5 pb-6 pl-16 shadow-[2px_3px_0_rgb(66_47_14/0.18)]">
        <span aria-hidden="true" className="absolute top-8 left-4 flex flex-col gap-12">
          <span className="h-4 w-4 rounded-full bg-fundo shadow-[inset_1px_1px_2px_rgb(66_47_14/0.3)]" />
          <span className="h-4 w-4 rounded-full bg-fundo shadow-[inset_1px_1px_2px_rgb(66_47_14/0.3)]" />
          <span className="h-4 w-4 rounded-full bg-fundo shadow-[inset_1px_1px_2px_rgb(66_47_14/0.3)]" />
        </span>
        {children}
      </div>
    </div>
  )
}
