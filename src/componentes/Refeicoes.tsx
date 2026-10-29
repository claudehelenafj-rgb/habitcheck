// Bolinhas das refeições e copos de água: tocar enche, tocar de novo esvazia. Sem número de calorias,
// sem comida certa ou errada: só "comi" e "bebi".

import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { marcarCopo, marcarRefeicao } from '../dados/alimentacao'
import { refeicoesAtivas, type ConfigAlimentacao, type DiaAlimentacao, type Refeicao } from '../logica/alimentacao'
import type { Dia } from '../logica/datas'
import { Adesivo } from './Adesivo'

export function nomeRefeicao(t: TFunction, r: Pick<Refeicao, 'id' | 'nome'>): string {
  return r.nome?.trim() || t(`alimentacao.refeicoes.${r.id}`)
}

export function BolinhasRefeicoes({ config, dia, hoje }: { config: ConfigAlimentacao; dia?: DiaAlimentacao; hoje: Dia }) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-3">
      {refeicoesAtivas(config).map((r) => {
        const feita = !!dia?.refeicoes[r.id]
        return (
          <li key={r.id}>
            <button type="button" aria-pressed={feita} onClick={() => marcarRefeicao(hoje, r.id)} className="flex w-24 flex-col items-center gap-1.5 text-center">
              <span
                aria-hidden="true"
                className={`grid h-20 w-20 place-items-center rounded-full border-2 border-linha ${feita ? 'bg-papel shadow-[3px_3px_0_var(--linha)]' : 'border-dashed bg-papel/50'}`}
              >
                {feita && <Adesivo nome="prato" tamanho={56} />}
              </span>
              <span className="font-bold break-words">{nomeRefeicao(t, r)}</span>
              {r.hora && <span className="text-sm tabular-nums">{r.hora}</span>}
              <span className="so-leitor">{feita ? t('alimentacao.comi') : ''}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function CoposDeAgua({ config, dia, hoje }: { config: ConfigAlimentacao; dia?: DiaAlimentacao; hoje: Dia }) {
  const { t } = useTranslation()
  const agua = dia?.agua ?? 0
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {Array.from({ length: config.aguaMeta }, (_, i) => i + 1).map((n) => {
          const cheio = n <= agua
          return (
            <li key={n}>
              <button
                type="button"
                aria-pressed={cheio}
                aria-label={t('alimentacao.copoN', { n, total: config.aguaMeta })}
                onClick={() => marcarCopo(hoje, n)}
                className={`grid h-12 w-12 place-items-center rounded-full border-2 border-linha ${cheio ? 'bg-papel' : 'border-dashed bg-papel/50'}`}
              >
                {cheio && <Adesivo nome="copo" tamanho={34} />}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="font-semibold" aria-live="polite">
        {agua >= config.aguaMeta ? `✓ ${t('alimentacao.aguaFeita', { total: config.aguaMeta })}` : t('alimentacao.copos', { n: agua, total: config.aguaMeta })}
      </p>
    </div>
  )
}
