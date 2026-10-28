// Editor de evento do calendário: nome, dia, dia todo ou horário, local e notas.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarEvento, salvarEvento } from '../dados/eventos'
import type { Evento } from '../logica/calendario'
import { diaLocal, somarDias } from '../logica/datas'
import { momento } from '../logica/remedios'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campo = 'min-h-12 rounded-2xl border-2 border-linha bg-papel px-4'
const hhmm = (d: Date) => d.toTimeString().slice(0, 5)

export function EditorEvento({ evento, novo, fechar, aoSalvar }: { evento: Evento; novo: boolean; fechar: () => void; aoSalvar?: () => void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const ini = new Date(evento.inicio)
  const fimOriginal = new Date(evento.fim)
  const [titulo, setTitulo] = useState(evento.titulo)
  const [dia, setDia] = useState(diaLocal(ini))
  const [diaInteiro, setDiaInteiro] = useState(evento.diaInteiro)
  const [inicio, setInicio] = useState(hhmm(ini))
  const [fim, setFim] = useState(hhmm(fimOriginal))
  const [local, setLocal] = useState(evento.local ?? '')
  const [notas, setNotas] = useState(evento.descricao ?? '')
  const [erro, setErro] = useState('')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function salvar() {
    if (!titulo.trim()) return setErro(t('editorEvento.tituloVazio'))
    let i: Date
    let f: Date
    if (diaInteiro) {
      // mantém quantos dias o evento durava (ex.: viagem de 3 dias)
      const dias = evento.diaInteiro ? Math.max(1, Math.round((fimOriginal.getTime() - ini.getTime()) / 86_400_000)) : 1
      i = momento(dia, '00:00')
      f = momento(somarDias(dia, dias), '00:00')
    } else {
      i = momento(dia, inicio)
      f = momento(dia, fim)
      if (f <= i) return setErro(t('editorEvento.fimAntes'))
    }
    await salvarEvento({
      ...evento,
      titulo: titulo.trim(),
      diaInteiro,
      inicio: i.toISOString(),
      fim: f.toISOString(),
      local: local.trim() || undefined,
      descricao: notas.trim() || undefined,
    })
    aoSalvar?.()
    ref.current?.close()
  }

  async function apagar() {
    const apagado = await apagarEvento(evento.id)
    ref.current?.close()
    mostrarAviso(t('editorEvento.apagado'), apagado ? () => salvarEvento(apagado) : undefined)
  }

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-evento"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
        className="flex flex-col gap-4"
      >
        <h2 id="titulo-evento" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="calendario" tamanho={36} />
          {novo ? t('editorEvento.tituloNovo') : t('editorEvento.tituloEditar')}
        </h2>
        {evento.origem !== 'caderninho' && <p className="rounded-2xl border-2 border-linha/40 p-3 text-sm">{t('editorEvento.importadoAviso')}</p>}
        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorEvento.oQue')}</span>
          <input id="titulo-evento-campo" autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} className={`${campo} text-lg`} />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t('editorEvento.dia')}</span>
            <input id="dia-evento" type="date" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} className={campo} />
          </label>
          <label className="flex min-h-12 items-center gap-2 font-bold">
            <input id="dia-inteiro" type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} className="h-5 w-5 accent-[var(--chocolate)]" />
            {t('editorEvento.diaInteiro')}
          </label>
        </div>
        {!diaInteiro && (
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t('editorEvento.inicio')}</span>
              <input id="inicio-evento" type="time" value={inicio} onChange={(e) => e.target.value && setInicio(e.target.value)} className={`${campo} tabular-nums`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t('editorEvento.fim')}</span>
              <input id="fim-evento" type="time" value={fim} onChange={(e) => e.target.value && setFim(e.target.value)} className={`${campo} tabular-nums`} />
            </label>
          </div>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t('editorEvento.local')}</span>
          <input id="local-evento" value={local} onChange={(e) => setLocal(e.target.value)} className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t('editorEvento.notas')}</span>
          <textarea id="notas-evento" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className="rounded-2xl border-2 border-linha bg-papel p-3" />
        </label>
        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!novo && (
            <Botao variante="contorno" onClick={apagar}>
              {t('editorEvento.apagar')}
            </Botao>
          )}
          <span className="flex-1" />
          <Botao variante="contorno" onClick={() => ref.current?.close()}>
            {t('editorEvento.cancelar')}
          </Botao>
          <Botao type="submit">{t('editorEvento.salvar')}</Botao>
        </div>
      </form>
    </dialog>
  )
}
