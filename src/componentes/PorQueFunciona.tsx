// Acordeão em pílula "Por que isso funciona?", com o nível de evidência honesto do guia.

export type NivelEvidencia = 'forte' | 'moderada' | 'inicial' | 'experiencial'

const NIVEIS: Record<NivelEvidencia, { bolinhas: number; descricao: string }> = {
  forte: { bolinhas: 3, descricao: 'meta-análises ou ensaios consistentes' },
  moderada: { bolinhas: 2, descricao: 'ensaios com limitações ou evidência forte só em outra faixa etária' },
  inicial: { bolinhas: 1, descricao: 'estudos pequenos, de laboratório ou levantamentos' },
  experiencial: { bolinhas: 0, descricao: 'recomendada por pessoas neurodivergentes ou clínicos, sem testes formais' },
}

export function SeloEvidencia({ nivel }: { nivel: NivelEvidencia }) {
  const { bolinhas } = NIVEIS[nivel]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-linha bg-papel px-3 py-1 text-sm font-bold">
      <span aria-hidden="true" className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border-2 border-linha ${i < bolinhas ? 'bg-tinta' : ''}`}
          />
        ))}
      </span>
      Evidência {nivel}
    </span>
  )
}

type Props = {
  tom?: string
  estrategia: string
  nivel: NivelEvidencia
  children: React.ReactNode
}

export function PorQueFunciona({ tom = 'bg-manteiga', estrategia, nivel, children }: Props) {
  return (
    <details className={`group rounded-[1.75rem] border-2 border-linha ${tom}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-5 py-2 font-bold [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="grid h-6 w-6 place-items-center rounded-full bg-botao text-sm text-botao-texto transition-transform group-open:rotate-45"
        >
          +
        </span>
        Por que isso funciona?
      </summary>
      <div className="space-y-3 px-5 pb-5 text-base leading-relaxed">
        <div>{children}</div>
        <div className="flex flex-wrap items-center gap-2">
          <SeloEvidencia nivel={nivel} />
          <span className="text-sm">{estrategia}</span>
        </div>
        <p className="text-sm">
          <strong>O que “{nivel}” quer dizer:</strong> {NIVEIS[nivel].descricao}.
        </p>
      </div>
    </details>
  )
}
