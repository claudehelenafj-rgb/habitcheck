// Tela provisória para as partes que ficam prontas nas próximas etapas.

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { AREAS } from '../design/areas'
import type { Tela } from '../rotas'

export function EmBreve({ tela }: { tela: Tela }) {
  const { t } = useTranslation()
  const tom = tela.area ? AREAS[tela.area].claro : 'bg-papel'
  return (
    <section className="flex flex-col gap-6">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome={tela.adesivo} tamanho={56} />
        {t(`nav.${tela.id}`)}
      </h1>
      <div className={`cartao ${tom} flex flex-col items-start gap-3 p-6`}>
        <div aria-hidden="true" className="decor estampa estampa-atual h-6 w-full rounded-full border-2 border-linha bg-papel" />
        <p className="text-2xl font-semibold">{t('emBreve.titulo', { etapa: tela.etapa })}</p>
        <p className="max-w-prose">{t('emBreve.texto')}</p>
        <Link
          to="/ajustes"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto"
        >
          {t('emBreve.voltar')}
        </Link>
      </div>
    </section>
  )
}
