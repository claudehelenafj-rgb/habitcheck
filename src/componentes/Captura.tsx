// Captura rápida: Cmd+K (ou Ctrl+K) ou o botão flutuante abrem uma janelinha
// para despejar qualquer coisa em 2 segundos. Cada linha vira um item da caixa de entrada.
// Com a área Dinheiro ligada, linha que começa com um valor ("35 ifood") vira gasto (com "não era gasto").

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { anotarGasto, apagarGasto, dinheiroLigado, usePotes } from '../dados/dinheiro'
import { capturar } from '../dados/tarefas'
import { formatarValor, lerGastoRapido, type Gasto } from '../logica/dinheiro'
import { separarItens } from '../logica/tarefas'
import { Adesivo } from './Adesivo'

let aberta = false
const ouvintes = new Set<() => void>()
export function abrirCaptura() {
  aberta = true
  ouvintes.forEach((f) => f())
}
function fecharCaptura() {
  aberta = false
  ouvintes.forEach((f) => f())
}
function useCapturaAberta() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => aberta,
  )
}

const ehMac = typeof navigator !== 'undefined' && /Mac|iPad|iPhone/.test(navigator.platform)
export const ATALHO_CAPTURA = ehMac ? '⌘K' : 'Ctrl+K'

function JanelaCaptura() {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const [texto, setTexto] = useState('')
  const [anotados, setAnotados] = useState(0)
  const [gastos, setGastos] = useState<Array<{ gasto: Gasto; linha: string }>>([])
  const potes = usePotes()

  useEffect(() => {
    ref.current?.showModal()
    campo.current?.focus()
  }, [])

  async function guardar() {
    const linhas = separarItens(texto)
    if (!linhas.length) return
    const comDinheiro = await dinheiroLigado()
    const novos: Array<{ gasto: Gasto; linha: string }> = []
    const itens: string[] = []
    for (const linha of linhas) {
      const g = comDinheiro ? lerGastoRapido(linha) : null
      if (g) novos.push({ gasto: await anotarGasto(g.valor, g.descricao), linha })
      else itens.push(linha)
    }
    if (itens.length) await capturar(itens)
    setAnotados(itens.length)
    setGastos(novos)
    setTexto('')
    campo.current?.focus()
  }

  /** "Não era gasto": desfaz o gasto e põe a linha na caixa de entrada. */
  async function naoEraGasto(id: string) {
    const item = gastos.find((x) => x.gasto.id === id)
    if (!item) return
    await apagarGasto(id)
    await capturar([item.linha])
    setGastos((gs) => gs.filter((x) => x.gasto.id !== id))
    setAnotados((n) => n + 1)
  }

  return (
    <dialog
      ref={ref}
      onClose={fecharCaptura}
      aria-labelledby="titulo-captura"
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
        className="flex flex-col gap-3"
      >
        <h2 id="titulo-captura" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="envelope" tamanho={36} />
          {t('captura.titulo')}
        </h2>
        <label htmlFor="campo-captura" className="so-leitor">
          {t('captura.campo')}
        </label>
        <textarea
          id="campo-captura"
          ref={campo}
          rows={3}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setAnotados(0)
            setGastos([])
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              guardar()
            }
          }}
          placeholder={t('captura.exemplo')}
          aria-describedby="dica-captura"
          className="w-full resize-y rounded-2xl border-2 border-linha bg-papel p-4 text-lg"
        />
        <p id="dica-captura" className="text-sm text-tinta-suave">
          {t('captura.dica')}
        </p>
        <div aria-live="polite" className="flex min-h-6 flex-col gap-1 font-semibold">
          {anotados > 0 && <p>✓ {t('captura.anotado', { count: anotados })}</p>}
          {gastos.map(({ gasto }) => {
            const pote = potes?.find((p) => p.id === gasto.poteId)
            return (
              <p key={gasto.id} className="flex flex-wrap items-center gap-x-3">
                <span>
                  ✓ {t('captura.gasto', { valor: formatarValor(gasto.valor, i18n.language), descricao: gasto.descricao })}
                  {pote ? ` · ${t('captura.noPote', { pote: pote.nome })}` : ` · ${t('captura.semPote')}`}
                </span>
                <button type="button" onClick={() => naoEraGasto(gasto.id)} className="text-sm underline decoration-2 underline-offset-4">
                  {t('captura.naoEraGasto')}
                </button>
              </p>
            )
          })}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="min-h-11 rounded-full border-2 border-linha px-5 font-bold"
          >
            {t('captura.fechar')}
          </button>
          <button type="submit" className="min-h-11 rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto">
            {t('captura.guardar')}
          </button>
        </div>
      </form>
    </dialog>
  )
}

/** Botão flutuante, janela de captura e o atalho Cmd+K. Usar uma vez, na moldura. */
export function Captura() {
  const { t } = useTranslation()
  const estaAberta = useCapturaAberta()

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!document.querySelector('dialog[open]')) abrirCaptura()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={abrirCaptura}
        className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 flex min-h-14 items-center gap-2 rounded-full border-2 border-linha bg-botao py-2 pr-5 pl-3 font-bold text-botao-texto shadow-[3px_3px_0_var(--linha)] md:right-6 md:bottom-6"
      >
        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-papel text-2xl leading-none text-tinta">
          +
        </span>
        {t('captura.botao')}
        <kbd className="hidden rounded-md border border-current/40 px-1.5 text-xs md:inline">{ATALHO_CAPTURA}</kbd>
      </button>
      {estaAberta && <JanelaCaptura />}
    </>
  )
}
