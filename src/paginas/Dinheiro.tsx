// Dinheiro: contas a pagar com lembrete antes e no dia, o resumo neutro do mês e os potes da semana
// (com gasto rápido pelo ⌘K).
// Tudo fica no aparelho; nada se conecta ao banco; sem conselho de investimento.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { EditorConta } from '../componentes/EditorConta'
import { PotesDaSemana } from '../componentes/Potes'
import { despagarConta, novaConta, pagarConta, useContas, useGastos, usePotes } from '../dados/dinheiro'
import { diasDaSemana } from '../logica/remedios'
import { useAgora } from '../dados/timer'
import { diaLocal } from '../logica/datas'
import { formatarValor, mesDe, ordenarContas, resumoDoMes, type Conta, type Vencimento } from '../logica/dinheiro'

function CaixaData({ v }: { v: Vencimento }) {
  const { t, i18n } = useTranslation()
  const data = new Date(`${v.dia}T12:00:00`)
  return (
    <div className="flex w-16 shrink-0 flex-col items-center rounded-2xl border-2 border-linha bg-papel px-2 py-1.5 text-center">
      {v.estado === 'hoje' ? (
        <span className="font-titulo py-1.5 text-lg leading-none font-semibold">{t('dinheiro.hojeCaixa')}</span>
      ) : (
        <>
          <span className="font-titulo text-3xl leading-none font-semibold tabular-nums">{data.getDate()}</span>
          <span className="text-xs font-bold">{data.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', '')}</span>
        </>
      )}
    </div>
  )
}

function ItemConta({ conta, v, editar }: { conta: Conta; v: Vencimento; editar: () => void }) {
  const { t, i18n } = useTranslation()
  const data = new Date(`${v.dia}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  const situacao =
    v.estado === 'atrasada'
      ? t('dinheiro.venceu', { data })
      : v.estado === 'hoje'
        ? t('dinheiro.venceHoje')
        : t('dinheiro.vence', { data, count: v.diasAte })
  return (
    <li className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-3 ${v.estado === 'depois' ? 'border-linha/40 bg-papel' : 'border-linha bg-manteiga'}`}>
      <CaixaData v={v} />
      <div className="min-w-0 flex-1 basis-40">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold break-words">{conta.nome}</span>
          {conta.valor !== undefined && <span className="font-semibold tabular-nums">{formatarValor(conta.valor, i18n.language)}</span>}
        </p>
        <p className="text-sm">
          {situacao} · {conta.repete ? t('dinheiro.todoMesCurto') : t('dinheiro.umaVezCurto')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Botao
          variante="secundario"
          tom="bg-menta"
          className="min-h-10 px-4 text-sm"
          icone={<span aria-hidden="true">✓</span>}
          aria-label={t('dinheiro.pagueiConta', { nome: conta.nome })}
          onClick={async () => {
            await pagarConta(conta.id, v.mes)
            mostrarAviso(t('dinheiro.paga', { nome: conta.nome }), () => despagarConta(conta.id, v.mes))
          }}
        >
          {t('dinheiro.paguei')}
        </Botao>
        <button type="button" onClick={editar} aria-label={t('dinheiro.editarConta')} className="text-sm font-bold underline decoration-2 underline-offset-4">
          {t('academia.editar')}
        </button>
      </div>
    </li>
  )
}

function ContasAPagar({ contas, hoje }: { contas: Conta[]; hoje: string }) {
  const { t, i18n } = useTranslation()
  const [editando, setEditando] = useState<{ conta: Conta; nova: boolean } | null>(null)
  const ordenadas = ordenarContas(contas, hoje)
  const aPagar = ordenadas.filter((x) => x.vencimento)
  const mes = mesDe(hoje)
  const pagasNoMes = contas.filter((c) => c.pagamentos.some((p) => p.mes === mes))
  const semNada = ordenadas.filter((x) => !x.vencimento && !pagasNoMes.includes(x.conta))
  const resumo = resumoDoMes(contas, mes)
  const nomeMes = new Date(`${mes}-15T12:00:00`).toLocaleDateString(i18n.language, { month: 'long' })

  return (
    <section aria-labelledby="titulo-contas" className="cartao flex flex-col gap-4 bg-menta p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="titulo-contas" className="flex-1 text-2xl font-semibold">
          {t('dinheiro.contasTitulo')}
        </h2>
        <Botao variante="secundario" tom="bg-papel" icone={<span aria-hidden="true">+</span>} onClick={() => setEditando({ conta: novaConta(), nova: true })}>
          {t('dinheiro.novaConta')}
        </Botao>
      </div>
      {contas.length === 0 ? (
        <p>{t('dinheiro.semContas')}</p>
      ) : (
        <>
          {resumo.contas > 0 && (
            <p className="rounded-2xl bg-papel/70 px-4 py-2 font-semibold">
              {t('dinheiro.resumo', {
                mes: nomeMes,
                pagas: resumo.pagas,
                contas: resumo.contas,
                total: formatarValor(resumo.total, i18n.language),
                pago: formatarValor(resumo.pago, i18n.language),
              })}
            </p>
          )}
          {aPagar.length ? (
            <ul className="flex flex-col gap-2">
              {aPagar.map(({ conta, vencimento }) => (
                <ItemConta key={conta.id} conta={conta} v={vencimento!} editar={() => setEditando({ conta, nova: false })} />
              ))}
            </ul>
          ) : (
            <p className="font-semibold">✓ {t('dinheiro.tudoPago')}</p>
          )}
          {pagasNoMes.length > 0 && (
            <details className="rounded-2xl border-2 border-linha/40 bg-papel/60 p-3">
              <summary className="cursor-pointer font-bold">{t('dinheiro.pagasNoMes', { count: pagasNoMes.length, mes: nomeMes })}</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {pagasNoMes.map((c) => {
                  const p = c.pagamentos.find((x) => x.mes === mes)!
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        ✓ <span className="font-semibold">{c.nome}</span>
                        {p.valor !== undefined && ` · ${formatarValor(p.valor, i18n.language)}`}
                        {' · '}
                        {t('dinheiro.pagaEm', { data: new Date(p.quando).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '') })}
                      </span>
                      <button type="button" onClick={() => despagarConta(c.id, mes)} className="text-sm font-bold underline decoration-2 underline-offset-4">
                        {t('dinheiro.desmarcar')}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </details>
          )}
          {semNada.length > 0 && (
            <p className="text-sm">
              {t('dinheiro.semNadaParaPagar')}{' '}
              {semNada.map(({ conta }, i) => (
                <span key={conta.id}>
                  {i > 0 && ', '}
                  <button type="button" onClick={() => setEditando({ conta, nova: false })} className="font-bold underline decoration-2 underline-offset-4">
                    {conta.nome}
                  </button>
                </span>
              ))}
            </p>
          )}
        </>
      )}
      {editando && <EditorConta conta={editando.conta} nova={editando.nova} fechar={() => setEditando(null)} />}
    </section>
  )
}

export function Dinheiro() {
  const { t } = useTranslation()
  const hoje = diaLocal(useAgora(60_000))
  const contas = useContas()
  const potes = usePotes()
  const gastos = useGastos()
  if (!contas || !potes || !gastos) return null
  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="cofrinho" tamanho={56} />
        {t('nav.dinheiro')}
      </h1>
      <p className="max-w-prose">{t('dinheiro.intro')}</p>
      <ContasAPagar contas={contas} hoje={hoje} />
      <PotesDaSemana potes={potes} gastos={gastos} semana={diasDaSemana(hoje)} />
    </div>
  )
}
