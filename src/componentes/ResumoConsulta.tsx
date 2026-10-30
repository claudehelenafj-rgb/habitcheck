// Ferramenta "Resumo para a consulta": escolher o período e o que entra, anotar perguntas,
// ver os padrões e abrir a página para imprimir ou salvar em PDF (tudo gerado no aparelho).

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { mudarBemEstar, useBemEstar } from '../dados/bemEstar'
import { diaLocal, somarDias } from '../logica/datas'
import { Adesivo } from './Adesivo'
import { Padroes } from './Padroes'

export const PARTES_RESUMO = ['checkins', 'sintomas', 'sono', 'remedios', 'hobbies', 'padroes'] as const
export type ParteResumo = (typeof PARTES_RESUMO)[number]
export const SEMANAS_RESUMO = [2, 4, 8] as const

export function linkResumo(semanas: number, partes: readonly ParteResumo[]) {
  return `/resumo-consulta?semanas=${semanas}&inclui=${partes.join(',')}`
}

export function ResumoConsulta() {
  const { t } = useTranslation()
  const config = useBemEstar()
  const [semanas, setSemanas] = useState<number>(2)
  const [partes, setPartes] = useState<ParteResumo[]>([...PARTES_RESUMO])
  if (!config) return null
  const hoje = diaLocal()
  return (
    <section aria-labelledby="titulo-resumo" className="cartao flex flex-col gap-5 bg-papel p-3 sm:p-6">
      <div className="flex items-center gap-3">
        <Adesivo nome="prancheta" tamanho={44} />
        <h2 id="titulo-resumo" className="flex-1 text-2xl font-semibold">
          {t('bemEstar.ferramentas.resumo.nome')}
        </h2>
      </div>
      <p className="max-w-prose">{t('resumo.explica')}</p>

      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-1.5 w-full font-bold">{t('resumo.periodo')}</legend>
        {SEMANAS_RESUMO.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={semanas === s}
            onClick={() => setSemanas(s)}
            className={`min-h-10 rounded-full border-2 border-linha px-4 font-semibold ${semanas === s ? 'bg-lilas' : 'bg-papel'}`}
          >
            {semanas === s && '✓ '}
            {t('resumo.semanas', { count: s })}
          </button>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 font-bold">{t('resumo.oQueEntra')}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {PARTES_RESUMO.map((p) => (
            <label key={p} className="flex min-h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={partes.includes(p)}
                onChange={() => setPartes((x) => (x.includes(p) ? x.filter((y) => y !== p) : PARTES_RESUMO.filter((y) => y === p || x.includes(y))))}
                className="h-5 w-5 accent-[var(--forte-ameixa)]"
              />
              {t(`resumo.partes.${p}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="font-bold">{t('resumo.perguntas')}</span>
        <textarea
          rows={3}
          defaultValue={config.perguntasConsulta ?? ''}
          placeholder={t('resumo.perguntasExemplo')}
          onBlur={(e) => {
            const texto = e.target.value
            mudarBemEstar(() => ({ perguntasConsulta: texto }))
          }}
          className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
        />
      </label>

      <Link
        to={linkResumo(semanas, partes)}
        className="inline-flex min-h-12 items-center self-start rounded-full border-2 border-botao bg-botao px-6 font-bold text-botao-texto"
      >
        {t('resumo.abrir')}
      </Link>

      <hr className="border-t-2 border-linha/20" />
      <Padroes inicio={somarDias(hoje, -semanas * 7)} hoje={hoje} />
    </section>
  )
}
