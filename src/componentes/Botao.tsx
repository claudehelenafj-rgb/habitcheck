import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'principal' | 'secundario' | 'contorno'

const ESTILOS: Record<Variante, string> = {
  principal: 'bg-botao text-botao-texto border-botao',
  secundario: 'text-tinta border-linha',
  contorno: 'bg-transparent text-tinta border-linha',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  /** classe do tom claro para botões secundários (ex.: bg-menta) */
  tom?: string
  icone?: ReactNode
  atalho?: string
  grande?: boolean
}

export function Botao({
  variante = 'principal',
  tom = 'bg-manteiga',
  icone,
  atalho,
  grande = false,
  className = '',
  children,
  ...resto
}: Props) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold transition-transform
        hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50
        ${grande ? 'min-h-14 px-7 text-lg' : 'min-h-11 px-5 text-base'}
        ${ESTILOS[variante]} ${variante === 'secundario' ? tom : ''} ${className}`}
      {...resto}
    >
      {icone}
      <span>{children}</span>
      {atalho && (
        <kbd className="rounded-md border border-current/40 px-1.5 py-0.5 font-texto text-xs font-semibold opacity-80">
          {atalho}
        </kbd>
      )}
    </button>
  )
}
