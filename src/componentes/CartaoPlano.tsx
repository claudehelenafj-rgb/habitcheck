// Cartão do plano de 2 semanas: em que dia estou, o que fazer nesta fase e a linha do tempo.

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { atualizarPerfil } from '../dados/perfil'
import { DURACAO_PLANO, faseDoDia, type IdFase } from '../logica/planoInicio'
import { Botao } from './Botao'
import { CirculoCaneta } from './GradeSemanal'

export const CORES_FASE: Record<IdFase, string> = {
  despejar: 'bg-manteiga',
  rituais: 'bg-lavanda',
  revisao1: 'bg-azul-nevoa',
  estrategia: 'bg-pessego',
  revisao2: 'bg-azul-nevoa',
  concluido: 'bg-menta',
}

export function CartaoPlano({ dia }: { dia: number }) {
  const { t } = useTranslation()
  const fase = faseDoDia(dia)
  const concluido = fase === 'concluido'
  return (
    <section aria-labelledby="titulo-plano" className={`cartao flex flex-col gap-4 p-5 sm:p-6 ${CORES_FASE[fase]}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="titulo-plano" className="text-2xl font-semibold">
          {t('plano.titulo')}
        </h2>
        {!concluido && (
          <span className="rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">
            {t('plano.dia', { dia })}
          </span>
        )}
      </div>

      <div>
        <p className="rotulo">
          {concluido ? t('plano.fases.concluido.quando') : `${t('plano.paraHoje')} · ${t(`plano.fases.${fase}.quando`)}`}
        </p>
        <p className="font-destaque text-3xl italic">{t(`plano.fases.${fase}.titulo`)}</p>
        <p className="mt-1 max-w-prose">{t(`plano.fases.${fase}.texto`)}</p>
      </div>

      {!concluido && (
        <ol aria-label={t('plano.linhaDoTempo')} className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
          {Array.from({ length: DURACAO_PLANO }, (_, i) => {
            const n = i + 1
            const passou = n < dia
            const hoje = n === dia
            return (
              <li
                key={n}
                aria-label={`${t('plano.dia', { dia: n })}${hoje ? ' ←' : ''}`}
                aria-current={hoje ? 'step' : undefined}
                className={`relative grid aspect-square place-items-center rounded-full border-2 border-linha text-sm font-bold ${
                  CORES_FASE[faseDoDia(n)]
                } ${passou ? 'opacity-60' : ''}`}
              >
                {hoje && <CirculoCaneta />}
                <span aria-hidden="true">{n}</span>
              </li>
            )
          })}
        </ol>
      )}

      {(fase === 'revisao2' || concluido) && (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/ajustes#areas"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto"
          >
            {t('plano.ativarArea')}
          </Link>
          {concluido && (
            <Botao variante="contorno" onClick={() => atualizarPerfil({ planoEscondido: true })}>
              {t('plano.esconder')}
            </Botao>
          )}
        </div>
      )}
    </section>
  )
}
