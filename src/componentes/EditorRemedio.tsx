// Cadastro de remédio, feito pela própria pessoa: nome, horários, dias, observação,
// texto do lembrete, estoque (opcional), repetições e o horário em que percebe mais efeito. Sem sugestão de dose.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarRemedio, salvarRemedio } from '../dados/remedios'
import { textoDoLembrete, type Remedio } from '../logica/remedios'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campo = 'min-h-12 rounded-2xl border-2 border-linha bg-papel px-4'

function Numero({ id, rotulo, valor, mudar, min = 0, max = 999 }: { id: string; rotulo: string; valor: number; mudar: (n: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{rotulo}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(valor) ? valor : ''}
        onChange={(e) => mudar(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className={`${campo} tabular-nums`}
      />
    </label>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 font-bold">{titulo}</legend>
      {children}
    </fieldset>
  )
}

export function EditorRemedio({ remedio, novo, fechar }: { remedio: Remedio; novo: boolean; fechar: () => void }) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const [r, setR] = useState<Remedio>(remedio)
  const [erro, setErro] = useState('')
  const [efeitoDe, setEfeitoDe] = useState(remedio.efeito?.de ?? '')
  const [efeitoAte, setEfeitoAte] = useState(remedio.efeito?.ate ?? '')
  const mudar = (m: Partial<Remedio>) => setR((x) => ({ ...x, ...m }))

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  // nomes curtos dos dias, começando na segunda (0 = domingo)
  const ordemDias = [1, 2, 3, 4, 5, 6, 0]
  const nomeDia = (d: number) => new Date(2026, 9, 25 + d).toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '')

  async function salvar() {
    const nome = r.nome.trim()
    const horarios = [...new Set(r.horarios.filter(Boolean))].sort()
    if (!nome) return setErro(t('editorRemedio.nomeVazio'))
    if (!horarios.length) return setErro(t('editorRemedio.semHorario'))
    // a janela de efeito só vale com começo e fim diferentes; incompleta, fica de fora
    const efeito = efeitoDe && efeitoAte && efeitoDe !== efeitoAte ? { de: efeitoDe, ate: efeitoAte } : undefined
    await salvarRemedio({ ...r, nome, horarios, observacao: r.observacao?.trim() || undefined, acao: r.acao?.trim() || undefined, efeito })
    ref.current?.close()
  }

  async function apagar() {
    const apagado = await apagarRemedio(remedio.id)
    ref.current?.close()
    mostrarAviso(t('editorRemedio.apagado'), apagado ? () => salvarRemedio(apagado) : undefined)
  }

  const todos = !r.diasSemana?.length
  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-remedio"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
        className="flex flex-col gap-5"
      >
        <h2 id="titulo-remedio" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="pilula" tamanho={36} />
          {novo ? t('editorRemedio.tituloNovo') : t('editorRemedio.tituloEditar')}
        </h2>
        <p className="text-sm">{t('remedios.aviso')}</p>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorRemedio.nome')}</span>
          <input id="nome-remedio" autoFocus value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} className={`${campo} text-lg`} />
        </label>

        <Grupo titulo={t('editorRemedio.horarios')}>
          <ul className="flex flex-wrap gap-2">
            {r.horarios.map((h, i) => (
              <li key={i} className="flex items-center gap-1 rounded-full border-2 border-linha bg-morango-claro py-1 pr-1 pl-3">
                <input
                  type="time"
                  aria-label={t('editorRemedio.horarioN', { n: i + 1 })}
                  value={h}
                  onChange={(e) => mudar({ horarios: r.horarios.map((x, j) => (j === i ? e.target.value : x)) })}
                  className="min-h-9 bg-transparent font-bold tabular-nums"
                />
                <button
                  type="button"
                  aria-label={t('editorRemedio.removerHorario', { n: i + 1 })}
                  onClick={() => mudar({ horarios: r.horarios.filter((_, j) => j !== i) })}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-linha/40 bg-papel font-bold"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <Botao variante="secundario" tom="bg-morango-claro" className="self-start" onClick={() => mudar({ horarios: [...r.horarios, '20:00'] })}>
            + {t('editorRemedio.adicionarHorario')}
          </Botao>
        </Grupo>

        <Grupo titulo={t('editorRemedio.dias')}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={todos}
              onClick={() => mudar({ diasSemana: undefined })}
              className={`min-h-10 rounded-full border-2 border-linha px-4 text-sm font-bold ${todos ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
            >
              {todos && '✓ '}
              {t('editorRemedio.todosDias')}
            </button>
            {ordemDias.map((d) => {
              const marcado = !todos && r.diasSemana!.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => {
                    const atuais = todos ? [] : r.diasSemana!
                    const novos = marcado ? atuais.filter((x) => x !== d) : [...atuais, d]
                    mudar({ diasSemana: novos.length === 7 || !novos.length ? undefined : novos })
                  }}
                  className={`min-h-10 min-w-12 rounded-full border-2 border-linha px-3 text-sm font-bold capitalize ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
                >
                  {nomeDia(d)}
                </button>
              )
            })}
          </div>
        </Grupo>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorRemedio.observacao')}</span>
          <input
            id="obs-remedio"
            placeholder={t('editorRemedio.observacaoEx')}
            value={r.observacao ?? ''}
            onChange={(e) => mudar({ observacao: e.target.value })}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('editorRemedio.acao')}</span>
          <input
            id="acao-remedio"
            placeholder={textoDoLembrete({ ...r, acao: undefined, nome: r.nome || '…' })}
            value={r.acao ?? ''}
            onChange={(e) => mudar({ acao: e.target.value })}
            className={campo}
          />
          <span className="text-sm">{t('editorRemedio.acaoDica', { padrao: textoDoLembrete({ ...r, acao: undefined, nome: r.nome || '…' }) })}</span>
        </label>

        <Grupo titulo={t('editorRemedio.efeito')}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t('editorRemedio.efeitoDe')}</span>
              <input id="efeito-de" type="time" value={efeitoDe} onChange={(e) => setEfeitoDe(e.target.value)} className={campo} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t('editorRemedio.efeitoAte')}</span>
              <input id="efeito-ate" type="time" value={efeitoAte} onChange={(e) => setEfeitoAte(e.target.value)} className={campo} />
            </label>
          </div>
          <span className="text-sm">{t('editorRemedio.efeitoDica')}</span>
        </Grupo>

        <Grupo titulo={t('editorRemedio.repetir')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Numero id="rep-vezes" rotulo={t('editorRemedio.repetirVezes')} valor={r.repetir.vezes} max={5} mudar={(vezes) => mudar({ repetir: { ...r.repetir, vezes } })} />
            <Numero
              id="rep-intervalo"
              rotulo={t('editorRemedio.repetirIntervalo')}
              valor={r.repetir.intervaloMin}
              min={5}
              max={60}
              mudar={(intervaloMin) => mudar({ repetir: { ...r.repetir, intervaloMin } })}
            />
          </div>
        </Grupo>

        <Grupo titulo={t('editorRemedio.estoque')}>
          <label className="flex items-center gap-2 font-semibold">
            <input
              id="controlar-estoque"
              type="checkbox"
              checked={!!r.estoque}
              onChange={(e) => mudar({ estoque: e.target.checked ? { quantidade: 30, porDose: 1, avisarComDias: 7 } : undefined })}
              className="h-5 w-5 accent-[var(--chocolate)]"
            />
            {t('editorRemedio.estoque')}
          </label>
          {r.estoque && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Numero id="est-qtd" rotulo={t('editorRemedio.estoqueQtd')} valor={r.estoque.quantidade} mudar={(quantidade) => mudar({ estoque: { ...r.estoque!, quantidade } })} />
              <Numero id="est-dose" rotulo={t('editorRemedio.estoquePorDose')} valor={r.estoque.porDose} min={1} max={20} mudar={(porDose) => mudar({ estoque: { ...r.estoque!, porDose } })} />
              <Numero id="est-avisar" rotulo={t('editorRemedio.estoqueAvisar')} valor={r.estoque.avisarComDias} min={1} max={60} mudar={(avisarComDias) => mudar({ estoque: { ...r.estoque!, avisarComDias } })} />
            </div>
          )}
        </Grupo>

        <label className="flex items-center gap-2 font-semibold">
          <input id="remedio-ativo" type="checkbox" checked={r.ativo} onChange={(e) => mudar({ ativo: e.target.checked })} className="h-5 w-5 accent-[var(--chocolate)]" />
          {t('editorRemedio.ativo')}
        </label>

        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!novo && (
            <Botao variante="contorno" onClick={apagar}>
              {t('editorRemedio.apagar')}
            </Botao>
          )}
          <span className="flex-1" />
          <Botao variante="contorno" onClick={() => ref.current?.close()}>
            {t('editorRemedio.cancelar')}
          </Botao>
          <Botao type="submit">{t('editorRemedio.salvar')}</Botao>
        </div>
      </form>
    </dialog>
  )
}
