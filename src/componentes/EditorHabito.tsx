// Cadastro de hábito: nome, plano se-então, versão mínima, quantas vezes por semana (ou dias combinados),
// parte do dia e lembrete com o plano escrito.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarHabito, restaurarHabito, salvarHabito } from '../dados/habitos'
import type { Habito } from '../logica/habitos'
import { BLOCOS } from '../logica/hoje'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campo = 'min-h-12 rounded-2xl border-2 border-linha bg-papel px-4'
// segunda primeiro (0 = domingo)
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]

function Grupo({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 font-bold">{titulo}</legend>
      {children}
      {dica && <span className="text-sm">{dica}</span>}
    </fieldset>
  )
}

function Escolha({
  marcado,
  onClick,
  children,
  rotulo,
  capitalizar = false,
}: {
  marcado: boolean
  onClick: () => void
  children: ReactNode
  rotulo?: string
  /** nomes curtos dos dias vêm em minúscula do idioma ("seg") */
  capitalizar?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      aria-label={rotulo}
      onClick={onClick}
      className={`min-h-11 min-w-11 rounded-full border-2 border-linha px-3 text-sm font-bold ${capitalizar ? 'capitalize' : ''} ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
    >
      {marcado && '✓ '}
      {children}
    </button>
  )
}

export function EditorHabito({ habito, novo, fechar, aoSalvar }: { habito: Habito; novo: boolean; fechar: () => void; aoSalvar?: () => void }) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const [h, setH] = useState<Habito>(habito)
  const [erro, setErro] = useState('')
  const mudar = (m: Partial<Habito>) => setH((x) => ({ ...x, ...m }))
  const nomeDia = (d: number, tipo: 'short' | 'long') =>
    new Date(2026, 10, 1 + d).toLocaleDateString(i18n.language, { weekday: tipo }).replace('.', '')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const qualquerDia = !h.dias.length
  const se = h.se.trim() || t('editorHabito.seExemplo')
  const entao = h.entao.trim() || t('editorHabito.entaoExemplo')

  async function salvar() {
    const titulo = h.titulo.trim()
    if (!titulo) return setErro(t('editorHabito.semNome'))
    if (!h.se.trim() || !h.entao.trim()) return setErro(t('editorHabito.semPlano'))
    const dias = [...h.dias].sort()
    await salvarHabito({
      ...h,
      titulo,
      se: h.se.trim(),
      entao: h.entao.trim(),
      minima: h.minima.trim(),
      dias,
      meta: dias.length || h.meta,
      lembrete: h.lembrete || undefined,
    })
    aoSalvar?.()
    ref.current?.close()
  }

  async function apagar() {
    const apagado = await apagarHabito(habito.id)
    ref.current?.close()
    mostrarAviso(t('editorHabito.apagado', { titulo: habito.titulo }), () => restaurarHabito(apagado))
  }

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-habito"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
        className="flex flex-col gap-5"
      >
        <h2 id="titulo-habito" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome={h.adesivo} tamanho={36} />
          {novo ? t('editorHabito.tituloNovo') : t('editorHabito.tituloEditar')}
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorHabito.nome')}</span>
          <input autoFocus value={h.titulo} onChange={(e) => mudar({ titulo: e.target.value })} maxLength={60} placeholder={t('editorHabito.nomeExemplo')} className={`${campo} text-lg`} />
        </label>

        <Grupo titulo={t('editorHabito.plano')} dica={t('editorHabito.planoDica')}>
          <label className="flex flex-col gap-1">
            <span className="font-destaque text-2xl italic">{t('editorHabito.se')}</span>
            <input value={h.se} onChange={(e) => mudar({ se: e.target.value })} maxLength={100} placeholder={t('editorHabito.seExemplo')} className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-destaque text-2xl italic">{t('editorHabito.entao')}</span>
            <input value={h.entao} onChange={(e) => mudar({ entao: e.target.value })} maxLength={100} placeholder={t('editorHabito.entaoExemplo')} className={campo} />
          </label>
          <p className="rounded-2xl border-2 border-dashed border-linha/50 px-4 py-2" aria-live="polite">
            <span className="so-leitor">{t('editorHabito.comoFica')} </span>
            {t('academia.seEntao', { se, entao })}
          </p>
        </Grupo>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorHabito.minima')}</span>
          <input value={h.minima} onChange={(e) => mudar({ minima: e.target.value })} maxLength={80} placeholder={t('editorHabito.minimaExemplo')} className={campo} />
          <span className="text-sm">{t('editorHabito.minimaDica')}</span>
        </label>

        <Grupo titulo={t('editorHabito.dias')} dica={qualquerDia ? undefined : t('editorHabito.diasMeta', { count: h.dias.length })}>
          <div className="flex flex-wrap gap-2">
            <Escolha marcado={qualquerDia} onClick={() => mudar({ dias: [] })}>
              {t('editorHabito.qualquerDia')}
            </Escolha>
            {ORDEM_DIAS.map((d) => {
              const marcado = h.dias.includes(d)
              return (
                <Escolha
                  key={d}
                  marcado={marcado}
                  capitalizar
                  rotulo={nomeDia(d, 'long')}
                  onClick={() => {
                    const dias = marcado ? h.dias.filter((x) => x !== d) : [...h.dias, d]
                    mudar({ dias: dias.length === 7 ? [] : dias, ...(dias.length === 7 ? { meta: 7 } : {}) })
                  }}
                >
                  {nomeDia(d, 'short')}
                </Escolha>
              )
            })}
          </div>
        </Grupo>

        {qualquerDia && (
          <Grupo titulo={t('editorHabito.meta')}>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Escolha key={n} marcado={h.meta === n} onClick={() => mudar({ meta: n })} rotulo={t('editorHabito.vezes', { count: n })}>
                  {n}
                </Escolha>
              ))}
            </div>
          </Grupo>
        )}

        <Grupo titulo={t('editorHabito.bloco')} dica={t('editorHabito.blocoDica')}>
          <div className="flex flex-wrap gap-2">
            {BLOCOS.map((b) => (
              <Escolha key={b} marcado={h.bloco === b} onClick={() => mudar({ bloco: b })}>
                {t(`hoje.blocos.${b}`)}
              </Escolha>
            ))}
            <Escolha marcado={!h.bloco} onClick={() => mudar({ bloco: undefined })}>
              {t('hoje.qualquerHora')}
            </Escolha>
          </div>
        </Grupo>

        <Grupo titulo={t('editorHabito.lembrete')}>
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={!!h.lembrete}
              onChange={(e) => mudar({ lembrete: e.target.checked ? '18:00' : undefined })}
              className="h-5 w-5 accent-[var(--chocolate)]"
            />
            {t('editorHabito.lembrar')}
          </label>
          {h.lembrete && (
            <>
              <label className="flex flex-col gap-1.5 self-start">
                <span className="text-sm font-bold">{t('editorHabito.horaLembrete')}</span>
                <input type="time" value={h.lembrete} onChange={(e) => mudar({ lembrete: e.target.value || '18:00' })} className={campo} />
              </label>
              <p className="text-sm">
                {t('editorHabito.lembreteFica', { titulo: h.titulo.trim() || t('editorHabito.nomeExemplo'), plano: t('academia.seEntao', { se, entao }) })}
              </p>
            </>
          )}
        </Grupo>

        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!novo && (
            <Botao variante="contorno" onClick={apagar}>
              {t('editorHabito.apagar')}
            </Botao>
          )}
          <span className="flex-1" />
          <Botao variante="contorno" onClick={() => ref.current?.close()}>
            {t('editorHabito.cancelar')}
          </Botao>
          <Botao type="submit">{t('editorHabito.salvar')}</Botao>
        </div>
      </form>
    </dialog>
  )
}
