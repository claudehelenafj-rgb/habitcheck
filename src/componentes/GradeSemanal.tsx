import { Adesivo, type NomeAdesivo } from './Adesivo'

export type EstadoDia = 'feito' | 'minimo' | 'vazio' | 'futuro'

export type Dia = {
  rotulo: string
  nomeCompleto: string
  numero: number
  estado: EstadoDia
  hoje?: boolean
}

const DESCRICAO: Record<EstadoDia, string> = {
  feito: 'feito',
  minimo: 'feito na versão mínima',
  vazio: 'sem registro',
  futuro: 'ainda não chegou',
}

/** Traço de caneta desenhado à mão para circular o dia de hoje. */
export function CirculoCaneta({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 96" className={`pointer-events-none absolute -inset-1.5 z-10 h-[calc(100%+0.75rem)] w-[calc(100%+0.75rem)] overflow-visible ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <path
        className="traco-caneta"
        d="M44 6C20 4 6 22 6 48s14 44 36 42 32-20 32-44S60 6 36 8"
        fill="none"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

type Props = {
  titulo: string
  adesivo: NomeAdesivo
  dias: Dia[]
  tom: string
}

export function GradeSemanal({ titulo, adesivo, dias, tom }: Props) {
  const feitos = dias.filter((d) => d.estado === 'feito' || d.estado === 'minimo').length
  return (
    <section className={`cartao ${tom} p-4 sm:p-5`} aria-label={titulo}>
      <div className="mb-3 flex items-center gap-3">
        <Adesivo nome={adesivo} tamanho={36} />
        <h3 className="text-xl font-semibold">{titulo}</h3>
        <span className="ml-auto rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">
          {feitos} de {dias.length} dias
        </span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dias.map((dia) => (
          <li
            key={dia.rotulo}
            className="relative flex flex-col items-center gap-1 rounded-2xl bg-papel/70 px-1 pb-2 pt-1.5"
            aria-label={`${dia.nomeCompleto}, dia ${dia.numero}: ${DESCRICAO[dia.estado]}${dia.hoje ? ' (hoje)' : ''}`}
          >
            {dia.hoje && <CirculoCaneta />}
            <span className="rotulo text-[0.65rem]" aria-hidden="true">
              {dia.rotulo}
            </span>
            <span className="font-titulo text-lg font-semibold leading-none" aria-hidden="true">
              {dia.numero}
            </span>
            <span className="grid h-9 w-9 place-items-center" aria-hidden="true">
              {dia.estado === 'feito' && <Adesivo nome={adesivo} tamanho={32} />}
              {dia.estado === 'minimo' && (
                <span className="relative">
                  <Adesivo nome={adesivo} tamanho={24} />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-papel px-1 text-[0.6rem] font-bold">
                    mín.
                  </span>
                </span>
              )}
              {dia.estado === 'vazio' && <span className="h-7 w-7 rounded-full border-2 border-dashed border-linha/60" />}
              {dia.estado === 'futuro' && <span className="h-2 w-2 rounded-full bg-linha/30" />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
