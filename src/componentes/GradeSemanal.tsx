import { useTranslation } from 'react-i18next'
import { Adesivo, type NomeAdesivo } from './Adesivo'

/** livre: dia que não estava combinado (fica só com um pontinho, como o futuro) */
export type EstadoDia = 'feito' | 'minimo' | 'vazio' | 'futuro' | 'livre'

export type Dia = {
  rotulo: string
  nomeCompleto: string
  numero: number
  estado: EstadoDia
  hoje?: boolean
  /** com isto, o dia vira um botão (ex.: marcar um dia que esqueceu de registrar) */
  aoTocar?: () => void
  /** texto curtinho do "meio feito" (padrão: "mín."), ex.: "2/4" */
  marca?: string
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
  /** como chamar o "meio feito" (padrão: versão mínima) */
  textoMinimo?: string
}

export function GradeSemanal({ titulo, adesivo, dias, tom, textoMinimo }: Props) {
  const { t } = useTranslation()
  const feitos = dias.filter((d) => d.estado === 'feito' || d.estado === 'minimo').length
  const descricao = (e: EstadoDia) => (e === 'minimo' && textoMinimo ? textoMinimo : t(`grade.${e}`))
  return (
    <section className={`cartao ${tom} p-4 sm:p-5`} aria-label={titulo}>
      <div className="mb-3 flex items-center gap-3">
        <Adesivo nome={adesivo} tamanho={36} />
        <h3 className="min-w-0 flex-1 text-xl font-semibold break-words">{titulo}</h3>
        <span className="shrink-0 rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">
          {t('grade.deDias', { feitos, total: dias.length })}
        </span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dias.map((dia) => {
          const rotulo = `${t('grade.dia', { nome: dia.nomeCompleto, numero: dia.numero })}: ${descricao(dia.estado)}${dia.hoje ? ` (${t('grade.hoje')})` : ''}`
          const conteudo = (
            <>
              {dia.hoje && <CirculoCaneta />}
              <span className="rotulo text-[0.65rem]" aria-hidden="true">
                {dia.rotulo}
              </span>
              <span className="font-titulo text-lg leading-none font-semibold" aria-hidden="true">
                {dia.numero}
              </span>
              <span className="grid h-9 w-9 place-items-center" aria-hidden="true">
                {dia.estado === 'feito' && <Adesivo nome={adesivo} tamanho={32} />}
                {dia.estado === 'minimo' && (
                  <span className="relative">
                    <Adesivo nome={adesivo} tamanho={24} />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-papel px-1 text-[0.6rem] font-bold">
                      {dia.marca ?? t('grade.min')}
                    </span>
                  </span>
                )}
                {dia.estado === 'vazio' && <span className="h-7 w-7 rounded-full border-2 border-dashed border-linha/60" />}
                {(dia.estado === 'futuro' || dia.estado === 'livre') && <span className="h-2 w-2 rounded-full bg-linha/30" />}
              </span>
            </>
          )
          const caixa = 'relative flex w-full flex-col items-center gap-1 rounded-2xl bg-papel/70 px-1 pb-2 pt-1.5'
          return dia.aoTocar ? (
            <li key={dia.rotulo}>
              <button type="button" onClick={dia.aoTocar} aria-label={rotulo} className={`${caixa} hover:bg-papel`}>
                {conteudo}
              </button>
            </li>
          ) : (
            <li key={dia.rotulo} className={caixa} aria-label={rotulo}>
              {conteudo}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
