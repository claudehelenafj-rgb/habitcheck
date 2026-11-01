// Editor de tarefa (sistema de trabalho, estratégia 8): o quê, passos pequenos com "pronto quando",
// quanto tempo acho que leva e o que vem depois (recompensa).

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tarefa } from '../dados/banco'
import { usePerfil } from '../dados/perfil'
import { apagarTarefa, novoPasso, salvarTarefa, useTarefas } from '../dados/tarefas'
import { AREAS } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { BLOCOS } from '../logica/hoje'
import { cabeTarefaA } from '../logica/tarefas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

type Props = {
  tarefa: Tarefa
  nova: boolean
  fechar: () => void
  aoSalvar?: (t: Tarefa) => void
}

export function EditorTarefa({ tarefa, nova, fechar, aoSalvar }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const tarefas = useTarefas() ?? []
  const perfil = usePerfil()
  const [rascunho, setRascunho] = useState<Tarefa>(tarefa)
  const [erro, setErro] = useState('')
  const hoje = diaLocal()

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const mudar = (m: Partial<Tarefa>) => setRascunho((r) => ({ ...r, ...m }))
  const jaEraAHoje = tarefa.prioridade === 'A' && tarefa.dia === hoje
  const semLugarA = !jaEraAHoje && !cabeTarefaA(tarefas, hoje, tarefa.id)

  function escolherPrioridade(p: Tarefa['prioridade']) {
    if (p === 'A' && semLugarA) {
      setErro(t('tarefas.limiteA'))
      return
    }
    setErro('')
    mudar({ prioridade: p, dia: p === 'A' ? hoje : undefined, bloco: p === 'A' ? rascunho.bloco : undefined })
  }

  async function salvar() {
    const titulo = rascunho.titulo.trim()
    if (!titulo) {
      setErro(t('editor.tituloVazio'))
      return
    }
    const final: Tarefa = {
      ...rascunho,
      titulo,
      passos: rascunho.passos
        .map((p) => ({ ...p, texto: p.texto.trim(), pronto: p.pronto?.trim() || undefined }))
        .filter((p) => p.texto),
      recompensa: rascunho.recompensa?.trim() || undefined,
    }
    await salvarTarefa(final)
    aoSalvar?.(final)
    ref.current?.close()
  }

  async function apagar() {
    const apagada = await apagarTarefa(tarefa.id)
    ref.current?.close()
    mostrarAviso(t('editor.apagada'), apagada ? () => salvarTarefa(apagada) : undefined)
  }

  const areasDisponiveis = (perfil?.areasAtivas ?? []).map((id) => AREAS[id])
  if (rascunho.area && !areasDisponiveis.some((a) => a.id === rascunho.area)) areasDisponiveis.push(AREAS[rascunho.area])

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-editor"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
        className="flex flex-col gap-5"
      >
        <h2 id="titulo-editor" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="lista" tamanho={36} />
          {nova ? t('editor.tituloNova') : t('editor.tituloEditar')}
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editor.oQue')}</span>
          <input
            id="titulo-tarefa"
            autoFocus
            value={rascunho.titulo}
            onChange={(e) => mudar({ titulo: e.target.value })}
            className="min-h-12 rounded-2xl border-2 border-linha bg-papel px-4 text-lg"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-bold">{t('editor.prioridade')}</legend>
          <div className="flex flex-wrap gap-2">
            {(['A', 'B', 'C'] as const).map((p) => (
              <label
                key={p}
                className={`cursor-pointer rounded-full border-2 border-linha px-4 py-2 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
                  rascunho.prioridade === p ? 'bg-botao text-botao-texto' : 'bg-papel'
                }`}
              >
                <input
                  type="radio"
                  name="prioridade"
                  className="so-leitor"
                  checked={rascunho.prioridade === p}
                  onChange={() => escolherPrioridade(p)}
                />
                {rascunho.prioridade === p && <span aria-hidden="true">✓ </span>}
                {t(`editor.prio${p}`)}
              </label>
            ))}
          </div>
        </fieldset>

        {rascunho.prioridade === 'A' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 font-bold">{t('editor.quando')}</legend>
            <div className="flex flex-wrap gap-2">
              {([undefined, ...BLOCOS] as const).map((bloco) => (
                <label
                  key={bloco ?? 'qualquer'}
                  className={`cursor-pointer rounded-full border-2 border-linha px-4 py-2 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
                    rascunho.bloco === bloco ? 'bg-botao text-botao-texto' : 'bg-papel'
                  }`}
                >
                  <input type="radio" name="bloco" className="so-leitor" checked={rascunho.bloco === bloco} onChange={() => mudar({ bloco })} />
                  {rascunho.bloco === bloco && <span aria-hidden="true">✓ </span>}
                  {bloco ? t(`hoje.blocos.${bloco}`) : t('editor.qualquerHora')}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {areasDisponiveis.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 font-bold">{t('editor.area')}</legend>
            <div className="flex flex-wrap gap-2">
              {[undefined, ...areasDisponiveis].map((area) => {
                const marcado = rascunho.area === area?.id
                return (
                  <label
                    key={area?.id ?? 'nenhuma'}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-linha py-1 pr-3.5 pl-1.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
                      marcado ? 'ring-3 ring-linha ' : ''
                    }${area ? area.claro : 'bg-papel'}`}
                  >
                    <input type="radio" name="area" className="so-leitor" checked={marcado} onChange={() => mudar({ area: area?.id })} />
                    {area ? <Adesivo nome={area.adesivo} tamanho={24} /> : <span className="w-2" />}
                    {area ? t(`nav.${area.id}`) : t('editor.semArea')}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="font-bold">{t('editor.passos')}</legend>
          <p className="text-sm">{t('editor.passosDica')}</p>
          <ol className="flex flex-col gap-2">
            {rascunho.passos.map((passo, i) => (
              <li key={passo.id} className="flex flex-col gap-1.5 rounded-2xl border-2 border-linha/40 p-3 sm:flex-row sm:items-center">
                <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-manteiga text-sm font-bold text-chocolate">
                  {i + 1}
                </span>
                <input
                  aria-label={t('editor.passoTexto', { n: i + 1 })}
                  value={passo.texto}
                  onChange={(e) => mudar({ passos: rascunho.passos.map((p) => (p.id === passo.id ? { ...p, texto: e.target.value } : p)) })}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-linha bg-papel px-3"
                />
                <input
                  aria-label={`${t('editor.pronto')} ${i + 1}`}
                  placeholder={t('editor.pronto')}
                  value={passo.pronto ?? ''}
                  onChange={(e) => mudar({ passos: rascunho.passos.map((p) => (p.id === passo.id ? { ...p, pronto: e.target.value } : p)) })}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-linha/50 bg-papel px-3 text-sm"
                />
                <button
                  type="button"
                  aria-label={t('editor.removerPasso', { n: i + 1 })}
                  onClick={() => mudar({ passos: rascunho.passos.filter((p) => p.id !== passo.id) })}
                  className="grid h-11 w-11 shrink-0 place-items-center self-end rounded-full border-2 border-linha/40 font-bold sm:self-auto"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
          <Botao variante="secundario" tom="bg-manteiga" className="self-start" onClick={() => mudar({ passos: [...rascunho.passos, novoPasso()] })}>
            + {t('editor.novoPasso')}
          </Botao>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-bold">{t('editor.estimativa')}</span>
            <input
              id="estimativa"
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={rascunho.estimativaMin ?? ''}
              onChange={(e) => mudar({ estimativaMin: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
              className="min-h-12 rounded-2xl border-2 border-linha bg-papel px-4 tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-bold">{t('editor.recompensa')}</span>
            <input
              id="recompensa"
              placeholder={t('editor.recompensaEx')}
              value={rascunho.recompensa ?? ''}
              onChange={(e) => mudar({ recompensa: e.target.value })}
              className="min-h-12 rounded-2xl border-2 border-linha bg-papel px-4"
            />
          </label>
        </div>

        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!nova && (
            <Botao variante="contorno" onClick={apagar}>
              {t('editor.apagar')}
            </Botao>
          )}
          <span className="flex-1" />
          <Botao variante="contorno" onClick={() => ref.current?.close()}>
            {t('editor.cancelar')}
          </Botao>
          <Botao type="submit">{t('editor.salvar')}</Botao>
        </div>
      </form>
    </dialog>
  )
}
