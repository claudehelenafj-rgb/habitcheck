// Padrões que apareceram nas anotações, escritos como observação. Nunca dizem que uma coisa causa a outra.

import { useTranslation } from 'react-i18next'
import { useCheckinsDesde } from '../dados/checkins'
import { useRegistrosDesde, useRemedios } from '../dados/remedios'
import { useSintomasDesde } from '../dados/sintomas'
import { useSonos } from '../dados/sono'
import { somarDias, type Dia } from '../logica/datas'
import { padroes, type Padrao } from '../logica/padroes'

/** Padrões de "inicio" até ontem. undefined = carregando. */
export function usePadroes(inicio: Dia, hoje: Dia): Padrao[] | undefined {
  const checkins = useCheckinsDesde(inicio)
  const sintomas = useSintomasDesde(inicio)
  const sonos = useSonos()
  const remedios = useRemedios()
  const doses = useRegistrosDesde(inicio)
  if (!checkins || !sintomas || !sonos || !remedios || !doses) return undefined
  return padroes({ checkins, sintomas, sonos: sonos.filter((s) => s.noite >= somarDias(inicio, -1)), remedios, doses, inicio, hoje })
}

export function TextoPadrao({ p }: { p: Padrao }) {
  const { t, i18n } = useTranslation()
  const n = (x: number) => x.toLocaleString(i18n.language, { maximumFractionDigits: 1 })
  switch (p.tipo) {
    case 'sonoTensao':
      return <>{t('padroes.sonoTensao', { curto: n(p.curto), outros: n(p.outros) })}</>
    case 'sonoEnergia':
      return <>{t('padroes.sonoEnergia', { curto: n(p.curto), outros: n(p.outros) })}</>
    case 'doseSintomas':
      return <>{t('padroes.doseSintomas', { semTomar: n(p.semTomar), tomou: n(p.tomou) })}</>
    case 'diaDaSemana': {
      // 2026-10-04 foi domingo: soma o dia da semana para pegar o nome
      const dia = new Date(2026, 9, 4 + p.diaSemana).toLocaleDateString(i18n.language, { weekday: 'long' })
      return <>{t('padroes.diaDaSemana', { dia, media: n(p.media), geral: n(p.geral) })}</>
    }
  }
}

export function Padroes({ inicio, hoje }: { inicio: Dia; hoje: Dia }) {
  const { t } = useTranslation()
  const lista = usePadroes(inicio, hoje)
  if (!lista) return null
  return (
    <section aria-labelledby="titulo-padroes" className="flex flex-col gap-2">
      <h3 id="titulo-padroes" className="text-xl font-semibold">
        {t('padroes.titulo')}
      </h3>
      {lista.length ? (
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          {lista.map((p) => (
            <li key={p.tipo}>
              <TextoPadrao p={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-tinta-suave">{t('padroes.nenhum')}</p>
      )}
      <p className="text-sm text-tinta-suave">{t('padroes.aviso')}</p>
    </section>
  )
}
