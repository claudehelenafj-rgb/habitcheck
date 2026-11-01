// Cartão de uma tarefa: um clique para concluir (com adesivo sendo colado),
// próximo passo à vista com seu "pronto quando", progresso dos passos e recompensa.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import type { Tarefa } from '../dados/banco'
import { alternarPasso, concluirTarefa, reabrirTarefa, salvarTarefa } from '../dados/tarefas'
import { AREAS } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { passosCompletos, progressoPassos, proximoPasso } from '../logica/tarefas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

function semAnimacao() {
  return (
    document.documentElement.dataset.animacoes === 'nao' ||
    document.documentElement.dataset.calmo === 'sim' ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

type Props = {
  tarefa: Tarefa
  editar: () => void
  /** para tarefas A de outro dia */
  podeTrazerParaHoje?: boolean
  deOutroDia?: boolean
}

export function CartaoTarefa({ tarefa, editar, podeTrazerParaHoje, deOutroDia }: Props) {
  const { t } = useTranslation()
  const [colando, setColando] = useState(false)
  const area = tarefa.area ? AREAS[tarefa.area] : undefined
  const feita = !!tarefa.feitaEm
  const passo = proximoPasso(tarefa)
  const { feitos, total } = progressoPassos(tarefa)
  const adesivo = area?.adesivo ?? 'estrela'
  const { pathname } = useLocation()

  async function concluir() {
    if (feita) {
      await reabrirTarefa(tarefa.id)
      return
    }
    setColando(true)
    await new Promise((r) => setTimeout(r, semAnimacao() ? 0 : 520))
    await concluirTarefa(tarefa.id)
    mostrarAviso(t('tarefas.concluida'), () => reabrirTarefa(tarefa.id))
  }

  return (
    <article
      className={`cartao flex gap-3 p-4 ${area ? area.claro : 'bg-papel'}`}
      aria-label={tarefa.titulo}
    >
      <button
        type="button"
        onClick={concluir}
        aria-pressed={feita}
        aria-label={feita ? t('tarefas.reabrir', { titulo: tarefa.titulo }) : t('tarefas.concluir', { titulo: tarefa.titulo })}
        className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel transition-transform hover:scale-105"
      >
        {(feita || colando) && (
          <span className={colando && !feita ? 'colando' : ''}>
            <Adesivo nome={adesivo} tamanho={40} />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <h3 className="min-w-0 flex-1 text-lg leading-snug font-bold break-words">{tarefa.titulo}</h3>
          {area && (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-linha/40 bg-papel px-2 py-0.5 text-xs font-bold">
              <Adesivo nome={area.adesivo} tamanho={18} />
              {t(`nav.${area.id}`)}
            </span>
          )}
          {tarefa.estimativaMin && !feita && (
            <span className="rounded-full border-2 border-linha/40 bg-papel px-2 py-0.5 text-xs font-bold tabular-nums">
              ~{t('tarefas.minutos', { n: tarefa.estimativaMin })}
            </span>
          )}
        </div>

        {!feita && passo && (
          <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-papel/80 p-2">
            <input
              type="checkbox"
              checked={passo.feito}
              onChange={() => alternarPasso(tarefa.id, passo.id)}
              aria-label={t('tarefas.marcarPasso', { texto: passo.texto })}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--chocolate)]"
            />
            <span className="text-sm">
              <span className="rotulo mr-1">{t('tarefas.proximoPasso')}</span>
              <span className="font-semibold">{passo.texto}</span>
              {passo.pronto && (
                <span className="block">
                  <span className="font-destaque text-base italic">{t('tarefas.prontoQuando')}:</span> {passo.pronto}
                </span>
              )}
            </span>
          </label>
        )}

        {!feita && passosCompletos(tarefa) && <p className="text-sm font-semibold">{t('tarefas.todosPassos')}</p>}

        {total > 0 && !feita && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="h-2.5 w-24 overflow-hidden rounded-full border-2 border-linha bg-papel">
              <span className="block h-full bg-tinta" style={{ width: `${(feitos / total) * 100}%` }} />
            </span>
            {t('tarefas.passos', { feitos, total })}
          </div>
        )}

        {tarefa.recompensa && !feita && <p className="text-sm">{t('tarefas.depois', { recompensa: tarefa.recompensa })}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          {!feita && (
            <button type="button" onClick={editar} className="text-sm font-bold underline decoration-2 underline-offset-4">
              {t('tarefas.editar')}
            </button>
          )}
          {!feita && (
            <Link
              to={`/foco?tarefa=${tarefa.id}&volta=${pathname}`}
              aria-label={t('foco.abrirTarefa', { titulo: tarefa.titulo })}
              className="text-sm font-bold underline decoration-2 underline-offset-4"
            >
              {t('foco.abrir')}
            </Link>
          )}
          {deOutroDia && (
            <>
              {podeTrazerParaHoje && (
                <Botao variante="secundario" tom="bg-manteiga" className="min-h-9 px-3 text-sm" onClick={() => salvarTarefa({ ...tarefa, dia: diaLocal() })}>
                  {t('tarefas.paraHoje')}
                </Botao>
              )}
              <Botao
                variante="contorno"
                className="min-h-9 px-3 text-sm"
                onClick={() => salvarTarefa({ ...tarefa, prioridade: 'B', dia: undefined })}
              >
                {t('tarefas.virarB')}
              </Botao>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
