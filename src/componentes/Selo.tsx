// Selo recortado (flor, onda ou nuvem) para números de destaque.

export type FormaSelo = 'flor' | 'onda' | 'nuvem'

export function caminhoSelo(forma: FormaSelo, raio = 48, centro = 50): string {
  const pontos = 240
  const raioEm = (t: number) => {
    switch (forma) {
      case 'flor':
        return raio * (0.86 + 0.14 * Math.abs(Math.cos(6 * t)))
      case 'onda':
        return raio * (0.93 + 0.07 * Math.sin(16 * t))
      case 'nuvem':
        return raio * (0.8 + 0.2 * Math.abs(Math.cos(3.5 * t)) ** 0.6)
    }
  }
  const partes: string[] = []
  for (let i = 0; i < pontos; i++) {
    const t = (i / pontos) * Math.PI * 2
    const r = raioEm(t)
    const x = centro + r * Math.cos(t)
    const y = centro + r * Math.sin(t)
    partes.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return partes.join('') + 'Z'
}

const FUNDOS = {
  rosa: { fundo: 'var(--rosa-selo)', texto: 'var(--chocolate)' },
  tomate: { fundo: 'var(--tomate-selo)', texto: 'var(--chocolate)' },
  laranja: { fundo: 'var(--laranja)', texto: 'var(--chocolate)' },
  piscina: { fundo: 'var(--verde-piscina)', texto: 'var(--creme)' },
  agua: { fundo: 'var(--verde-agua)', texto: 'var(--chocolate)' },
  chocolate: { fundo: 'var(--chocolate)', texto: 'var(--creme)' },
  manteiga: { fundo: 'var(--manteiga)', texto: 'var(--chocolate)' },
} as const

type Props = {
  forma?: FormaSelo
  cor?: keyof typeof FUNDOS
  numero: string
  legenda: string
  tamanho?: number
}

export function Selo({ forma = 'flor', cor = 'rosa', numero, legenda, tamanho = 112 }: Props) {
  const { fundo, texto } = FUNDOS[cor]
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center text-center"
      style={{ width: tamanho, height: tamanho, color: texto }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={caminhoSelo(forma)} fill={fundo} stroke="#422F0E" strokeWidth={2.5} />
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className="font-titulo text-[1.75rem] font-bold">{numero}</span>
        <span className="mt-1 max-w-[5.5rem] text-[0.7rem] font-bold leading-tight">{legenda}</span>
      </span>
    </div>
  )
}
