// Cadastro de conta a pagar: nome, valor (opcional), vencimento todo mês ou uma vez só, quantos dias antes
// avisar e a ação escrita do lembrete. Nada se conecta ao banco: a pessoa paga onde já paga e marca aqui.

import type { TFunction } from 'i18next'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarConta, restaurarConta, salvarConta } from '../dados/dinheiro'
import { formatarValor, lerValor, valorParaCampo, type Conta, type Vencimento } from '../logica/dinheiro'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campo = 'min-h-12 rounded-2xl border-2 border-linha bg-papel px-4'
const AVISAR_ANTES = [0, 1, 2, 3, 5, 7]

/** Título e texto do lembrete de uma conta (também usados pela moldura). */
export function textosAvisoConta(t: TFunction, idioma: string, conta: Conta, aviso: { tipo: 'antes' | 'dia'; vencimento: Vencimento }): [string, string] {
  const data = new Date(`${aviso.vencimento.dia}T12:00:00`).toLocaleDateString(idioma, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  const partes = [
    aviso.tipo === 'dia' ? t('dinheiro.venceHojePonto') : t('dinheiro.venceEm', { count: aviso.vencimento.diasAte, data }),
    conta.valor ? `${formatarValor(conta.valor, idioma)}.` : '',
    conta.acao?.trim() || t('dinheiro.acaoPadrao'),
  ]
  return [t('dinheiro.avisoTitulo', { nome: conta.nome }), partes.filter(Boolean).join(' ')]
}

function Grupo({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 font-bold">{titulo}</legend>
      {children}
      {dica && <span className="text-sm">{dica}</span>}
    </fieldset>
  )
}

function Escolha({ marcado, onClick, children }: { marcado: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      onClick={onClick}
      className={`min-h-11 rounded-full border-2 border-linha px-4 text-sm font-bold ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
    >
      {marcado && '✓ '}
      {children}
    </button>
  )
}

export function EditorConta({ conta, nova, fechar }: { conta: Conta; nova: boolean; fechar: () => void }) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const [c, setC] = useState<Conta>(conta)
  const [valor, setValor] = useState(valorParaCampo(conta.valor))
  const [data, setData] = useState(conta.mes ? `${conta.mes}-${String(conta.dia).padStart(2, '0')}` : '')
  const [erro, setErro] = useState('')
  const mudar = (m: Partial<Conta>) => setC((x) => ({ ...x, ...m }))

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const valorLido = valor.trim() ? lerValor(valor) : undefined
  const exemplo: Conta = { ...c, nome: c.nome.trim() || t('dinheiro.nomeExemplo'), valor: valorLido ?? undefined }

  async function salvar() {
    const nome = c.nome.trim()
    if (!nome) return setErro(t('dinheiro.semNome'))
    if (valorLido === null || (valorLido !== undefined && valorLido <= 0)) return setErro(t('dinheiro.valorInvalido'))
    if (!c.repete && !data) return setErro(t('dinheiro.semData'))
    await salvarConta({
      ...c,
      nome,
      valor: valorLido,
      acao: c.acao?.trim() || undefined,
      ...(c.repete ? { mes: undefined } : { mes: data.slice(0, 7), dia: Number(data.slice(8, 10)) }),
    })
    ref.current?.close()
  }

  async function apagar() {
    const apagada = await apagarConta(conta.id)
    ref.current?.close()
    if (apagada) mostrarAviso(t('dinheiro.apagada', { nome: conta.nome }), () => restaurarConta(apagada))
  }

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-conta"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
        className="flex flex-col gap-5"
      >
        <h2 id="titulo-conta" className="flex items-center gap-2 text-2xl font-semibold">
          <Adesivo nome="cofrinho" tamanho={36} />
          {nova ? t('dinheiro.novaConta') : t('dinheiro.editarConta')}
        </h2>

        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-0 flex-[2] basis-56 flex-col gap-1.5">
            <span className="font-bold">{t('dinheiro.nome')}</span>
            <input autoFocus value={c.nome} onChange={(e) => mudar({ nome: e.target.value })} maxLength={50} placeholder={t('dinheiro.nomeExemplo')} className={campo} />
          </label>
          <label className="flex min-w-0 flex-1 basis-36 flex-col gap-1.5">
            <span className="font-bold">{t('dinheiro.valor')}</span>
            <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder={t('dinheiro.valorExemplo')} className={`${campo} tabular-nums`} />
          </label>
        </div>

        <Grupo titulo={t('dinheiro.quando')}>
          <div className="flex flex-wrap gap-2">
            <Escolha marcado={c.repete} onClick={() => mudar({ repete: true })}>
              {t('dinheiro.todoMes')}
            </Escolha>
            <Escolha marcado={!c.repete} onClick={() => mudar({ repete: false })}>
              {t('dinheiro.umaVez')}
            </Escolha>
          </div>
          {c.repete ? (
            <label className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{t('dinheiro.diaVencimento')}</span>
              <select value={c.dia} onChange={(e) => mudar({ dia: Number(e.target.value) })} className={`${campo} tabular-nums`}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {c.dia > 28 && <span className="basis-full text-sm">{t('dinheiro.mesCurto')}</span>}
            </label>
          ) : (
            <label className="flex flex-col gap-1.5 self-start">
              <span className="font-semibold">{t('dinheiro.venceEmData')}</span>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
            </label>
          )}
        </Grupo>

        <Grupo titulo={t('dinheiro.avisar')} dica={t('dinheiro.avisarDica')}>
          <div className="flex flex-wrap gap-2">
            {AVISAR_ANTES.map((n) => (
              <Escolha key={n} marcado={c.avisarDiasAntes === n} onClick={() => mudar({ avisarDiasAntes: n })}>
                {n === 0 ? t('dinheiro.soNoDia') : t('dinheiro.diasAntes', { count: n })}
              </Escolha>
            ))}
          </div>
        </Grupo>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">{t('dinheiro.acao')}</span>
          <input value={c.acao ?? ''} onChange={(e) => mudar({ acao: e.target.value })} maxLength={100} placeholder={t('dinheiro.acaoPadrao')} className={campo} />
          <span className="text-sm">
            {t('dinheiro.avisoFica', {
              texto: textosAvisoConta(t, i18n.language, exemplo, { tipo: 'dia', vencimento: { mes: '', dia: '2026-01-01', diasAte: 0, estado: 'hoje' } })[1],
            })}
          </span>
        </label>

        <p aria-live="polite" className="min-h-6 font-semibold">
          {erro && <>! {erro}</>}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!nova && (
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
