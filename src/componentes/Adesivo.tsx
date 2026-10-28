// Adesivos originais do Caderninho, no estilo papel recortado:
// formas facetadas em duas camadas de cor, borda branca (classe .adesivo),
// textura leve de papel e, em alguns, uma carinha.

import type { ReactNode } from 'react'

const COR = {
  creme: '#FBF6EE',
  chocolate: '#422F0E',
  lavanda: '#F9D4F8',
  azul: '#AECFD0',
  pessego: '#FFD094',
  manteiga: '#F7E9B2',
  menta: '#DDF2B8',
  morango: '#FCC4C0',
  rosa: '#EA5E86',
  tomate: '#EF6545',
  laranja: '#F49625',
  piscina: '#037F71',
  agua: '#57B1A8',
} as const

/** Pontos de um polígono "recortado à mão": raio alterna e varia um pouco. */
function poligono(cx: number, cy: number, raios: number[], giro = 0): string {
  const n = raios.length
  return (
    raios
      .map((r, i) => {
        const a = giro + (i / n) * Math.PI * 2 - Math.PI / 2
        return `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
      })
      .join('') + 'Z'
  )
}

const explosao = (cx: number, cy: number, fora: number, dentro: number, pontas: number, giro = 0) =>
  poligono(
    cx,
    cy,
    Array.from({ length: pontas * 2 }, (_, i) => (i % 2 === 0 ? fora * (1 - (i % 3) * 0.06) : dentro)),
    giro,
  )

const redondo = (cx: number, cy: number, r: number, lados = 11) =>
  poligono(
    cx,
    cy,
    Array.from({ length: lados }, (_, i) => r * (1 - (i % 3) * 0.035)),
    0.2,
  )

/** Duas camadas de papel: a de fora é um traço grosso; a de dentro, levemente deslocada. */
function Camadas({ d, fora, dentro, borda = 6 }: { d: string; fora: string; dentro: string; borda?: number }) {
  return (
    <>
      <path d={d} fill={fora} stroke={fora} strokeWidth={borda} strokeLinejoin="miter" />
      <path d={d} fill={dentro} transform="translate(0.6 -0.5)" />
    </>
  )
}

/** Carinha: olhos, sorriso e bochechas. */
function Rosto({
  x,
  y,
  e = 1,
  bochecha = COR.morango,
  dormindo = false,
}: {
  x: number
  y: number
  e?: number
  bochecha?: string
  dormindo?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`}>
      <ellipse cx="-7.5" cy="3" rx="2.6" ry="1.7" fill={bochecha} />
      <ellipse cx="7.5" cy="3" rx="2.6" ry="1.7" fill={bochecha} />
      {dormindo ? (
        <path d="M-6.5 -2q1.8 1.6 3.6 0M2.9 -2q1.8 1.6 3.6 0" fill="none" stroke={COR.chocolate} strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="-4.6" cy="-1.6" r="1.6" fill={COR.chocolate} />
          <circle cx="4.6" cy="-1.6" r="1.6" fill={COR.chocolate} />
          <circle cx="-4.1" cy="-2.1" r="0.5" fill="#fff" />
          <circle cx="5.1" cy="-2.1" r="0.5" fill="#fff" />
        </>
      )}
      <path d="M-2.2 1.6q2.2 2.2 4.4 0" fill="none" stroke={COR.chocolate} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  )
}

const desenhos = {
  pilula: (
    <g transform="rotate(-32 32 32)">
      <path d="M32 19H22l-7 4-3 9 3 9 7 4h10z" fill={COR.tomate} stroke={COR.pessego} strokeWidth={6} strokeLinejoin="miter" />
      <path d="M32 19h10l7 4 3 9-3 9-7 4H32z" fill={COR.morango} stroke={COR.pessego} strokeWidth={6} strokeLinejoin="miter" />
      <path d="M32 19H22l-7 4-3 9 3 9 7 4h10z" fill={COR.tomate} />
      <path d="M32 19h10l7 4 3 9-3 9-7 4H32z" fill={COR.morango} />
      <Rosto x={32} y={32} e={0.85} bochecha={COR.pessego} />
    </g>
  ),
  calendario: (
    <g>
      <Camadas d="M11 15L53 14L54 54L10 55Z" fora={COR.azul} dentro={COR.creme} />
      <path d="M11 15L53 14L53.4 26L10.6 27Z" fill={COR.piscina} />
      <path d="M21 9h4v10h-4zM39 9h4v10h-4z" fill={COR.chocolate} />
      <path d="M18 34h6v5h-6zM29 34h6v5h-6zM40 34h6v5h-6zM18 44h6v5h-6z" fill={COR.azul} />
      <path d="M29 46l3.5 3.5 8-8" fill="none" stroke={COR.piscina} strokeWidth={3.5} strokeLinecap="square" />
    </g>
  ),
  prancheta: (
    <g transform="rotate(-4 32 32)">
      <Camadas d="M14 14L50 13L52 56L13 57Z" fora={COR.piscina} dentro={COR.azul} />
      <path d="M24 9L40 9L41 17L23 17Z" fill={COR.creme} />
      <path d="M29 24h6v8h8v6h-8v8h-6v-8h-8v-6h8z" fill={COR.piscina} />
    </g>
  ),
  haltere: (
    <g transform="rotate(-18 32 32)">
      <path d="M17 29h30v6H17z" fill={COR.chocolate} />
      <Camadas d="M9 19L18 18L19 46L9 45Z" fora={COR.pessego} dentro={COR.laranja} borda={5} />
      <Camadas d="M46 18L55 19L55 45L45 46Z" fora={COR.pessego} dentro={COR.laranja} borda={5} />
    </g>
  ),
  livro: (
    <g transform="rotate(5 32 32)">
      <Camadas d="M12 12L51 11L52 54L12 55Z" fora={COR.lavanda} dentro={COR.rosa} />
      <path d="M12 12L19 12L19 55L12 55Z" fill={COR.lavanda} opacity={0.7} />
      <path d="M38 11L46 11L46 28L42 24L38 28Z" fill={COR.manteiga} />
      <path d="M25 36h20v4H25z" fill={COR.lavanda} />
    </g>
  ),
  vassoura: (
    <g transform="rotate(24 32 32)">
      <path d="M30 4h4v30h-4z" fill={COR.chocolate} />
      <Camadas d="M23 31L41 31L48 57L42 54L37 58L32 54L27 58L22 54L16 57Z" fora={COR.pessego} dentro={COR.manteiga} borda={5} />
      <path d="M24 37h16v3H24z" fill={COR.laranja} />
    </g>
  ),
  prato: (
    <g>
      <Camadas d={redondo(32, 33, 22, 14)} fora={COR.menta} dentro={COR.creme} />
      <path d={redondo(32, 33, 14, 10)} fill={COR.menta} />
      <path d="M24 36L34 26L42 28L38 37L28 40Z" fill={COR.agua} />
    </g>
  ),
  copo: (
    <g transform="rotate(-5 32 32)">
      <Camadas d="M15 11L49 11L44 56L20 56Z" fora={COR.azul} dentro={COR.creme} />
      <path d="M17.6 30L24 27L31 31L38 27L46.3 30L44 56L20 56Z" fill={COR.azul} />
      <path d="M24 38h3v3h-3zM34 45h2.5v2.5H34z" fill="#fff" />
    </g>
  ),
  estrela: (
    <g>
      <Camadas d={explosao(32, 33, 27, 12, 8, 0.1)} fora={COR.manteiga} dentro={COR.laranja} />
      <Rosto x={32} y={33} e={0.9} bochecha={COR.manteiga} />
    </g>
  ),
  coracao: (
    <g transform="rotate(-6 32 32)">
      <Camadas d="M32 55L10 33L8 20L14 11L24 10L32 18L40 10L50 11L56 20L54 33Z" fora={COR.morango} dentro={COR.rosa} />
      <Rosto x={32} y={29} e={1} bochecha={COR.morango} />
    </g>
  ),
  cereja: (
    <g>
      <path d="M21 40L30 12L33 13L24 41ZM42 38L38 12L41 11.5L45 38Z" fill={COR.chocolate} />
      <path d="M33 11L46 6L54 10L44 15Z" fill={COR.menta} />
      <Camadas d={redondo(20, 45, 10, 9)} fora={COR.morango} dentro={COR.tomate} borda={4} />
      <Camadas d={redondo(44, 43, 10, 9)} fora={COR.morango} dentro={COR.tomate} borda={4} />
    </g>
  ),
  envelope: (
    <g transform="rotate(-6 32 32)">
      <Camadas d="M8 17L56 16L56 50L8 51Z" fora={COR.pessego} dentro={COR.manteiga} />
      <path d="M8 17L32 36L56 16L56 20L32 40L8 21Z" fill={COR.pessego} />
      <path d="M32 44L26 38L26 34L29 32L32 35L35 32L38 34L38 38Z" fill={COR.rosa} />
    </g>
  ),
  sol: (
    <g>
      <path d={explosao(32, 32, 29, 19, 12)} fill={COR.laranja} />
      <Camadas d={redondo(32, 32, 16, 11)} fora={COR.pessego} dentro={COR.manteiga} borda={4} />
      <Rosto x={32} y={32} e={0.9} bochecha={COR.pessego} />
    </g>
  ),
  lua: (
    <g>
      <Camadas d="M38 7L26 10L16 18L11 30L13 43L21 52L33 57L45 55L54 47L44 46L35 41L29 32L28 21L32 12Z" fora={COR.lavanda} dentro={COR.manteiga} />
      <Rosto x={22} y={33} e={0.8} dormindo bochecha={COR.lavanda} />
      <path d="M50 14l2 4 4 1-4 1-2 4-1-4-4-1 4-1z" fill={COR.lavanda} />
    </g>
  ),
  sapinho: (
    <g>
      <Camadas
        d="M14 22L12 14L18 9L25 11L28 18L36 18L39 11L46 9L52 14L50 22L56 32L54 44L44 52L20 52L10 44L8 32Z"
        fora={COR.agua}
        dentro={COR.menta}
      />
      <circle cx="20" cy="15" r="3" fill={COR.chocolate} />
      <circle cx="44" cy="15" r="3" fill={COR.chocolate} />
      <ellipse cx="17" cy="37" rx="4" ry="2.5" fill={COR.morango} />
      <ellipse cx="47" cy="37" rx="4" ry="2.5" fill={COR.morango} />
      <path d="M22 34q10 9 20 0" fill="none" stroke={COR.chocolate} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
  flor: (
    <g>
      <Camadas
        d={poligono(32, 32, [27, 17, 28, 16, 27, 17, 28, 16, 27, 17, 28, 16], 0.25)}
        fora={COR.lavanda}
        dentro={COR.rosa}
      />
      <path d={redondo(32, 32, 12, 9)} fill={COR.manteiga} />
      <Rosto x={32} y={32} e={0.75} bochecha={COR.pessego} />
    </g>
  ),
  balao: (
    <g>
      <Camadas d="M10 14L52 12L55 40L30 42L18 54L20 42L9 40Z" fora={COR.azul} dentro={COR.creme} />
      <path d="M20 25h5v5h-5zM30 25h5v5h-5zM40 25h5v5h-5z" fill={COR.chocolate} />
    </g>
  ),
  explosao: (
    <Camadas d={explosao(32, 32, 28, 11, 9, 0.3)} fora={COR.piscina} dentro={COR.azul} />
  ),
  interrogacao: (
    <g transform="rotate(-6 32 32)">
      <path d="M21 22L22 13L32 9L42 12L44 22L36 30L34 39" fill="none" stroke={COR.azul} strokeWidth={14} strokeLinejoin="miter" />
      <path d="M21 22L22 13L32 9L42 12L44 22L36 30L34 39" fill="none" stroke={COR.agua} strokeWidth={7} strokeLinejoin="miter" />
      <Camadas d="M29 46L38 45L39 55L29 56Z" fora={COR.azul} dentro={COR.agua} borda={5} />
    </g>
  ),
  exclamacao: (
    <g transform="rotate(4 32 32)">
      <Camadas d="M24 7L41 6L37 40L28 41Z" fora={COR.lavanda} dentro={COR.rosa} />
      <Camadas d="M27 47L37 46L38 57L27 58Z" fora={COR.lavanda} dentro={COR.rosa} borda={5} />
    </g>
  ),
  lista: (
    <g transform="rotate(-5 32 32)">
      <Camadas d="M13 9L51 8L52 56L12 57Z" fora={COR.pessego} dentro={COR.creme} />
      <path d="M20 19l3 3 6-6M20 32l3 3 6-6" fill="none" stroke={COR.piscina} strokeWidth={3} strokeLinecap="square" />
      <path d="M33 19h12M33 32h12M33 45h12" stroke={COR.chocolate} strokeWidth={3} />
      <path d="M20 42h7v7h-7z" fill="none" stroke={COR.chocolate} strokeWidth={2.5} />
    </g>
  ),
  cofrinho: (
    <g>
      <path d="M27 6L37 6L38 12L26 12Z" fill={COR.laranja} />
      <path d="M28 8.5h8" stroke={COR.manteiga} strokeWidth={1.5} />
      <Camadas
        d="M14 24L20 19L30 17L42 18L50 23L54 30L54 38L50 45L46 47L45 55L39 55L38 49L26 49L25 55L19 55L18 47L12 43L9 36L10 28Z"
        fora={COR.morango}
        dentro={COR.rosa}
      />
      <path d="M16 22L14 13L22 19Z" fill={COR.morango} />
      <path d="M27 21h10" stroke={COR.chocolate} strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx="53" cy="34" rx="5" ry="6" fill={COR.morango} />
      <circle cx="52" cy="32.5" r="1" fill={COR.chocolate} />
      <circle cx="52" cy="35.5" r="1" fill={COR.chocolate} />
      <circle cx="41" cy="29" r="1.8" fill={COR.chocolate} />
      <ellipse cx="44" cy="37" rx="3" ry="1.8" fill={COR.morango} />
      <path d="M9 31q-5 -1 -4 -5" fill="none" stroke={COR.rosa} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  ),
  engrenagem: (
    <g transform="rotate(8 32 32)">
      <Camadas
        d={poligono(32, 32, Array.from({ length: 32 }, (_, i) => (i % 4 < 2 ? 26 : 20)), Math.PI / 32)}
        fora={COR.azul}
        dentro={COR.lavanda}
      />
      <path d={redondo(32, 32, 9, 9)} fill={COR.creme} />
      <Rosto x={32} y={32} e={0.55} bochecha={COR.morango} />
    </g>
  ),
} satisfies Record<string, ReactNode>

export type NomeAdesivo = keyof typeof desenhos
export const NOMES_ADESIVOS = Object.keys(desenhos) as NomeAdesivo[]

/** Filtro de textura de papel. Renderizado uma vez na raiz do app. */
export function DefinicoesAdesivo() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="textura-papel" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="ruido" />
        <feColorMatrix
          in="ruido"
          type="matrix"
          values="0 0 0 0 0.26  0 0 0 0 0.18  0 0 0 0 0.05  0 0 0 0.16 0"
          result="pontos"
        />
        <feComposite in="pontos" in2="SourceGraphic" operator="in" result="manchas" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="manchas" />
        </feMerge>
      </filter>
    </svg>
  )
}

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
      className={`adesivo inline-block shrink-0 overflow-visible ${decorativo ? 'decor' : ''} ${className}`}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
    >
      <g filter="url(#textura-papel)">{desenhos[nome]}</g>
    </svg>
  )
}
