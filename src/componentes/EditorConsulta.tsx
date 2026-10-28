// Editor de consulta: "preciso marcar" (prazo e repetição) ou "já está marcada"
// (dia, hora, tempos de chegar e de se arrumar com folga), checklist de preparo e perguntas.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { novoId } from '../dados/banco'
import { apagarConsulta, salvarConsulta } from '../dados/consultas'
import { planoReverso, type Consulta } from '../logica/consultas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campo = 'min-h-12 rounded-2xl border-2 border-linha bg-papel px-4'
const FOLGAS = [25, 30, 40, 50]
const REPETICOES = [0, 3, 6, 12]

function Pilula({ marcado, onClick, children }: { marcado: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      onClick={onClick}
      className={`min-h-10 rounded-full border-2 border-linha px-4 text-sm font-bold ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
    >
      {marcado && '✓ '}
      {children}
    </button>
  )
}

export function EditorConsulta({ consulta, nova, fechar }: { consulta: Consulta; nova: boolean; fechar: () => void }) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const [c, setC] = useState<Consulta>(consulta)
  const [erro, setErro] = useState('')
  const mudar = (m: Partial<Consulta>) => setC((x) => ({ ...x, ...m }))

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const plano = c.status === 'marcada' ? planoReverso(c) : null
  const hhmm = (d: Date) => d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  async function salvar() {
    const titulo = c.titulo.trim()
    if (!titulo) return setErro(t('editorConsulta.tituloVazio'))
    if (c.status === 'marcada' && (!c.data || !c.hora)) return setErro(t('editorConsulta.semData'))
    await salvarConsulta({
      ...c,
      titulo,
      profissional: c.profissional?.trim() || undefined,
      local: c.local?.trim() || undefined,
      perguntas: c.perguntas?.trim() || undefined,
      preparo: c.preparo.map((p) => ({ ...p, texto: p.texto.trim() })).filter((p) => p.texto),
      recorrenciaMeses: c.recorrenciaMeses || undefined,
    })
    ref.current?.close()
  }

  async function apagar() {
    const apagada = await apagarConsulta(consulta.id)
    ref.current?.close()
    mostrarAviso(t('editorConsulta.apagada'), apagada ? () => salvarConsulta(apagada) : undefined)
  }

  const numero = (id: string, rotulo: string, valor: number, chave: 'duracaoMin' | 'deslocamentoMin' | 'preparoMin') => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{rotulo}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={600}
        value={valor}
        onChange={(e) => mudar({ [chave]: Math.min(600, Math.max(0, Number(e.target.value) || 0)) })}
        className={`${campo} tabular-nums`}
      />
    </label>
  )

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-consulta"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
        className="flex flex-col gap-5"
      >
        <h2 id="titulo-consulta" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="prancheta" tamanho={36} />
          {nova ? t('editorConsulta.tituloNova') : t('editorConsulta.tituloEditar')}
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorConsulta.oQue')}</span>
          <input id="titulo-consulta-campo" autoFocus placeholder={t('editorConsulta.oQueEx')} value={c.titulo} onChange={(e) => mudar({ titulo: e.target.value })} className={`${campo} text-lg`} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t('editorConsulta.profissional')}</span>
            <input id="profissional" value={c.profissional ?? ''} onChange={(e) => mudar({ profissional: e.target.value })} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t('editorConsulta.local')}</span>
            <input id="local" value={c.local ?? ''} onChange={(e) => mudar({ local: e.target.value })} className={campo} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-bold">{t('editorConsulta.situacao')}</legend>
          <div className="flex flex-wrap gap-2">
            <Pilula marcado={c.status === 'marcar'} onClick={() => mudar({ status: 'marcar' })}>
              {t('editorConsulta.precisoMarcar')}
            </Pilula>
            <Pilula marcado={c.status === 'marcada'} onClick={() => mudar({ status: 'marcada' })}>
              {t('editorConsulta.marcada')}
            </Pilula>
          </div>
        </fieldset>

        {c.status === 'marcar' ? (
          <label className="flex flex-col gap-1.5">
            <span className="font-bold">{t('editorConsulta.marcarAte')}</span>
            <input id="marcar-ate" type="date" value={c.marcarAte ?? ''} onChange={(e) => mudar({ marcarAte: e.target.value || undefined })} className={`${campo} max-w-60`} />
          </label>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold">{t('editorConsulta.data')}</span>
                <input id="data-consulta" type="date" value={c.data ?? ''} onChange={(e) => mudar({ data: e.target.value || undefined })} className={campo} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold">{t('editorConsulta.hora')}</span>
                <input id="hora-consulta" type="time" value={c.hora ?? ''} onChange={(e) => mudar({ hora: e.target.value || undefined })} className={`${campo} tabular-nums`} />
              </label>
              {numero('duracao', t('editorConsulta.duracao'), c.duracaoMin, 'duracaoMin')}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {numero('deslocamento', t('editorConsulta.deslocamento'), c.deslocamentoMin, 'deslocamentoMin')}
              {numero('preparo-min', t('editorConsulta.preparoMin'), c.preparoMin, 'preparoMin')}
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-bold">{t('editorConsulta.folga')}</legend>
              <div className="flex flex-wrap gap-2">
                {FOLGAS.map((f) => (
                  <Pilula key={f} marcado={c.folgaPct === f} onClick={() => mudar({ folgaPct: f })}>
                    +{f}%
                  </Pilula>
                ))}
              </div>
              <p className="text-sm">{t('editorConsulta.folgaDica')}</p>
            </fieldset>
            {plano && (
              <p className="rounded-2xl border-2 border-linha bg-azul-nevoa p-3 font-semibold" aria-live="polite">
                {t('editorConsulta.plano', { arrumar: hhmm(plano.comecarArrumar), sair: hhmm(plano.sairDeCasa) })}
              </p>
            )}
          </>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-bold">{t('editorConsulta.repetir')}</legend>
          <div className="flex flex-wrap gap-2">
            {REPETICOES.map((n) => (
              <Pilula key={n} marcado={(c.recorrenciaMeses ?? 0) === n} onClick={() => mudar({ recorrenciaMeses: n || undefined })}>
                {n ? t('editorConsulta.meses', { n }) : t('editorConsulta.naoRepete')}
              </Pilula>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-bold">{t('editorConsulta.preparo')}</legend>
          <ul className="flex flex-col gap-2">
            {c.preparo.map((item, i) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  aria-label={t('editorConsulta.itemN', { n: i + 1 })}
                  value={item.texto}
                  onChange={(e) => mudar({ preparo: c.preparo.map((p) => (p.id === item.id ? { ...p, texto: e.target.value } : p)) })}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-linha bg-papel px-3"
                />
                <button
                  type="button"
                  aria-label={t('editorConsulta.removerItem', { n: i + 1 })}
                  onClick={() => mudar({ preparo: c.preparo.filter((p) => p.id !== item.id) })}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-linha/40 font-bold"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <Botao variante="secundario" tom="bg-azul-nevoa" className="self-start" onClick={() => mudar({ preparo: [...c.preparo, { id: novoId(), texto: '', feito: false }] })}>
            + {t('editorConsulta.novoItem')}
          </Botao>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorConsulta.perguntas')}</span>
          <textarea id="perguntas" rows={3} value={c.perguntas ?? ''} onChange={(e) => mudar({ perguntas: e.target.value })} className="rounded-2xl border-2 border-linha bg-papel p-3" />
        </label>

        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!nova && (
            <Botao variante="contorno" onClick={apagar}>
              {t('editorConsulta.apagar')}
            </Botao>
          )}
          <span className="flex-1" />
          <Botao variante="contorno" onClick={() => ref.current?.close()}>
            {t('editorConsulta.cancelar')}
          </Botao>
          <Botao type="submit">{t('editorConsulta.salvar')}</Botao>
        </div>
      </form>
    </dialog>
  )
}
