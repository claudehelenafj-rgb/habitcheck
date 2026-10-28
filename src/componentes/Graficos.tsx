// Gráficos dos objetivos: número em destaque, colunas por semana e mapa de calor do mês.
// Regras: um só tom por gráfico, texto nunca na cor do dado, tooltip no hover e no foco,
// e sempre uma tabela com os mesmos números. Dia sem registro é neutro, nunca "erro".

import { useState } from 'react'

export function CartaoNumero({
  rotulo,
  valor,
  detalhe,
  tom = 'bg-papel',
}: {
  rotulo: string
  valor: string
  detalhe?: string
  tom?: string
}) {
  return (
    <div className={`cartao ${tom} flex flex-col gap-1 p-4`}>
      <span className="text-sm font-semibold">{rotulo}</span>
      <span className="font-texto text-4xl font-semibold leading-none">{valor}</span>
      {detalhe && <span className="text-sm">{detalhe}</span>}
    </div>
  )
}

function TabelaDados({ titulo, linhas, unidade }: { titulo: string; linhas: Array<[string, number]>; unidade: string }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">Ver como tabela</summary>
      <table className="mt-2 w-full max-w-sm border-collapse tabular-nums">
        <caption className="so-leitor">{titulo}</caption>
        <thead>
          <tr className="border-b-2 border-linha text-left">
            <th className="py-1 pr-4">Período</th>
            <th className="py-1">{unidade}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(([rotulo, valor]) => (
            <tr key={rotulo} className="border-b border-linha/20">
              <td className="py-1 pr-4">{rotulo}</td>
              <td className="py-1">{valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

export type PontoSemana = { rotulo: string; descricao: string; valor: number }

/** Colunas: uma série, um tom, valor escrito só na última coluna. */
export function ColunasSemanais({
  titulo,
  subtitulo,
  dados,
  maximo,
  unidade,
  cor = 'var(--forte-rosa)',
}: {
  titulo: string
  subtitulo: string
  dados: PontoSemana[]
  maximo: number
  unidade: string
  cor?: string
}) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const altura = 140
  const marcas = [0, Math.round(maximo / 2), maximo]
  return (
    <figure className="cartao bg-papel p-4 sm:p-5">
      <figcaption>
        <h4 className="text-lg font-semibold">{titulo}</h4>
        <p className="text-sm text-tinta-suave">{subtitulo}</p>
      </figcaption>
      <div className="relative mt-4 flex gap-2 pl-6" style={{ height: altura + 24 }}>
        {/* grade: linhas finas e discretas */}
        {marcas.map((m) => (
          <div
            key={m}
            className="pointer-events-none absolute right-0 left-6 border-t border-linha/15"
            style={{ bottom: 24 + (m / maximo) * altura }}
          >
            <span className="absolute -top-2.5 -left-6 w-5 text-right text-xs tabular-nums text-tinta-suave">{m}</span>
          </div>
        ))}
        {dados.map((d, i) => {
          const h = Math.max(0, (d.valor / maximo) * altura)
          const ultimo = i === dados.length - 1
          return (
            <div
              key={d.rotulo}
              className="relative flex flex-1 flex-col items-center justify-end rounded-lg outline-none focus-visible:outline-3 focus-visible:outline-offset-2"
              style={{ paddingBottom: 24 }}
              tabIndex={0}
              aria-label={`${d.descricao}: ${d.valor} ${unidade}`}
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
            >
              {(ultimo || ativo === i) && (
                <span
                  className={`absolute z-10 rounded-lg px-2 py-0.5 text-sm font-bold whitespace-nowrap ${
                    ativo === i ? 'border-2 border-linha bg-papel shadow-[2px_2px_0_var(--linha)]' : ''
                  }`}
                  style={{ bottom: 24 + h + 4 }}
                >
                  {d.valor}
                  {ativo === i && <span className="ml-1 font-normal">{unidade} · {d.descricao}</span>}
                </span>
              )}
              <div
                className="w-full max-w-6 rounded-t-[4px] transition-opacity"
                style={{ height: h, background: cor, opacity: ativo === null || ativo === i ? 1 : 0.55 }}
              />
              <span className="absolute bottom-0 text-xs text-tinta-suave">{d.rotulo}</span>
            </div>
          )
        })}
        <div className="pointer-events-none absolute right-0 left-6 border-t-2 border-linha" style={{ bottom: 24 }} />
      </div>
      <TabelaDados titulo={titulo} unidade={unidade} linhas={dados.map((d) => [d.descricao, d.valor])} />
    </figure>
  )
}

export type DiaMapa = { dia: number; valor: number; hoje?: boolean; futuro?: boolean }

const FAIXAS = [
  { ate: 0, cor: 'transparent', nome: 'nada registrado' },
  { ate: 15, cor: 'var(--mapa-1)', nome: 'até 15 min' },
  { ate: 30, cor: 'var(--mapa-2)', nome: '16 a 30 min' },
  { ate: 45, cor: 'var(--mapa-3)', nome: '31 a 45 min' },
  { ate: Infinity, cor: 'var(--mapa-4)', nome: 'mais de 45 min' },
]
const faixa = (v: number) => FAIXAS.find((f) => v <= f.ate)!

/** Mapa de calor do mês. Começa no dia da semana certo; dias vazios ficam neutros. */
export function MapaDeCalor({
  titulo,
  subtitulo,
  dias,
  primeiroDiaSemana,
}: {
  titulo: string
  subtitulo: string
  dias: DiaMapa[]
  /** 0 = domingo */
  primeiroDiaSemana: number
}) {
  const [ativo, setAtivo] = useState<DiaMapa | null>(null)
  const semana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  return (
    <figure className="cartao bg-papel p-4 sm:p-5">
      <figcaption>
        <h4 className="text-lg font-semibold">{titulo}</h4>
        <p className="text-sm text-tinta-suave">{subtitulo}</p>
      </figcaption>
      <div className="mt-3 grid max-w-xs grid-cols-7 gap-1.5" role="list" aria-label={titulo}>
        {semana.map((s, i) => (
          <span key={i} className="text-center text-xs font-bold text-tinta-suave" aria-hidden="true">
            {s}
          </span>
        ))}
        {Array.from({ length: primeiroDiaSemana }, (_, i) => (
          <span key={`v${i}`} aria-hidden="true" />
        ))}
        {dias.map((d) => {
          const f = faixa(d.valor)
          return (
            <span
              key={d.dia}
              tabIndex={d.futuro ? -1 : 0}
              role="listitem"
              aria-label={`Dia ${d.dia}: ${d.futuro ? 'ainda não chegou' : `${d.valor} minutos`}${d.hoje ? ' (hoje)' : ''}`}
              onPointerEnter={() => setAtivo(d)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(d)}
              onBlur={() => setAtivo(null)}
              className={`aspect-square rounded-md outline-none focus-visible:outline-3 ${
                d.futuro ? 'border border-dashed border-linha/25' : d.valor === 0 ? 'border-2 border-linha/35' : ''
              } ${d.hoje ? 'ring-2 ring-linha ring-offset-2 ring-offset-papel' : ''}`}
              style={{ background: d.futuro ? 'transparent' : f.cor }}
            />
          )
        })}
      </div>
      <p className="mt-2 h-5 text-sm" aria-live="polite">
        {ativo && !ativo.futuro ? (
          <>
            <strong>{ativo.valor} min</strong> no dia {ativo.dia}
          </>
        ) : null}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {FAIXAS.map((f) => (
          <span key={f.nome} className="inline-flex items-center gap-1">
            <span
              className={`h-3 w-3 rounded-sm ${f.ate === 0 ? 'border-2 border-linha/35' : ''}`}
              style={{ background: f.cor }}
            />
            {f.nome}
          </span>
        ))}
      </div>
      <TabelaDados
        titulo={titulo}
        unidade="minutos"
        linhas={dias.filter((d) => !d.futuro).map((d) => [`Dia ${d.dia}`, d.valor])}
      />
    </figure>
  )
}
