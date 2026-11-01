// Peças visuais pequenas: letreiro, timer que encolhe, anel de progresso,
// foto com fita e anotação à mão.

import type { ReactNode } from 'react'
import { Adesivo, type NomeAdesivo } from './Adesivo'

/** Faixa de letreiro. Fica parada no modo calmo e com "reduzir movimento". */
export function Letreiro({ frases }: { frases: string[] }) {
  const itens = [...frases, ...frases]
  return (
    <div className="overflow-hidden border-y-2 border-linha bg-destaque py-2 text-destaque-texto">
      <p className="so-leitor">{frases.join(' · ')}</p>
      <div className="letreiro-trilho" aria-hidden="true">
        {itens.map((frase, i) => (
          <span key={i} className="flex items-center gap-4 whitespace-nowrap px-4 font-titulo text-lg font-semibold">
            {frase}
            <span className="text-base">✿</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Timer visual: o disco colorido encolhe conforme o tempo passa. */
export function TimerVisual({
  fracaoRestante,
  rotulo,
  cor = 'var(--forte-rosa)',
  tamanho = 180,
}: {
  fracaoRestante: number
  rotulo: string
  cor?: string
  tamanho?: number
}) {
  const f = Math.min(1, Math.max(0, fracaoRestante))
  const angulo = f * 2 * Math.PI
  const x = 50 + 44 * Math.sin(angulo)
  const y = 50 - 44 * Math.cos(angulo)
  const fatia =
    f >= 0.9999
      ? 'M50 6a44 44 0 1 1 0 88a44 44 0 1 1 0-88z'
      : `M50 50L50 6A44 44 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}z`
  return (
    <div className="inline-flex flex-col items-center gap-2">
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="var(--papel)" stroke="var(--linha)" strokeWidth="2.5" />
        {f > 0 && <path d={fatia} fill={cor} stroke="var(--linha)" strokeWidth="1.5" strokeLinejoin="round" />}
        <circle cx="50" cy="50" r="3" fill="var(--linha)" />
      </svg>
    </div>
      <span className="rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-lg font-bold" role="timer" aria-live="off">
        {rotulo}
      </span>
    </div>
  )
}

/** Anel de progresso de uma área, com o adesivo no centro. */
export function AnelProgresso({
  feitos,
  total,
  nome,
  adesivo,
  cor,
}: {
  feitos: number
  total: number
  nome: string
  adesivo: NomeAdesivo
  cor: string
}) {
  const r = 26
  const circ = 2 * Math.PI * r
  const f = total === 0 ? 0 : Math.min(1, feitos / total)
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <div className="relative grid h-20 w-20 place-items-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--linha)" strokeWidth="9" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--papel)" strokeWidth="6" />
          {f > 0 && (
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke={cor}
              strokeWidth="6"
              strokeDasharray={`${circ * f} ${circ}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <Adesivo nome={adesivo} tamanho={30} />
      </div>
      <figcaption className="text-center text-sm font-bold leading-tight">
        {nome}
        <span className="block font-semibold">
          {feitos} de {total}
        </span>
      </figcaption>
    </figure>
  )
}

/** Foto inclinada presa com fita adesiva, com etiqueta. */
export function FotoComFita({
  etiqueta,
  inclinacao = -3,
  children,
}: {
  etiqueta: string
  inclinacao?: number
  children: ReactNode
}) {
  return (
    <figure
      className="relative w-44 border-2 border-linha bg-white p-2 pb-3 shadow-[3px_3px_0_var(--linha)]"
      style={{ transform: `rotate(${inclinacao}deg)` }}
    >
      <span
        aria-hidden="true"
        className="decor absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 bg-[rgb(247_233_178/0.85)] shadow-sm"
      />
      <div className="aspect-square overflow-hidden border border-linha/30">{children}</div>
      <figcaption className="rotulo mt-2 text-center text-chocolate">{etiqueta}</figcaption>
    </figure>
  )
}

/** Anotação à mão com seta, para dicas do primeiro uso. Só decoração curta. */
export function Anotacao({ texto, className = '' }: { texto: string; className?: string }) {
  return (
    <span className={`decor pointer-events-none inline-flex items-end gap-1 ${className}`} aria-hidden="true">
      <span className="font-mao text-2xl font-semibold leading-none">{texto}</span>
      <svg viewBox="0 0 60 40" width="54" height="36">
        <path
          d="M4 6c18-2 34 6 42 24"
          fill="none"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M38 26l9 6 2-11" fill="none" stroke="var(--tinta)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function AdesivoSolto({ nome, className }: { nome: NomeAdesivo; className: string }) {
  return <Adesivo nome={nome} tamanho={56} decorativo className={`pointer-events-none absolute ${className}`} />
}
