// Pausa antes de comprar (a vontade de comprar espera 48 h na lista de desejos, depois vem o "ainda quero?")
// e cofrinhos (meta de economia, o que já foi guardado e o gráfico do que entrou por mês). Sem conselho de
// investimento e sem bronca: desistir de uma compra é só "ficou com você".

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  anotarDesejo,
  apagarCofrinho,
  apagarDesejo,
  decidirDesejo,
  moverNoCofrinho,
  apagarDeposito,
  novoCofrinho,
  restaurarCofrinho,
  restaurarDesejo,
  salvarCofrinho,
} from '../dados/dinheiro'
import type { Dia } from '../logica/datas'
import {
  desistenciasDoMes,
  fimDaEspera,
  formatarValor,
  guardadoPorMes,
  horasParaDecidir,
  lerValor,
  mesDe,
  prontoParaDecidir,
  progressoCofrinho,
  valorParaCampo,
  type Cofrinho,
  type Deposito,
  type Desejo,
} from '../logica/dinheiro'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { ColunasSemanais } from './Graficos'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'

export function PausaAntesDeComprar({ desejos, agora }: { desejos: Desejo[]; agora: Date }) {
  const { t, i18n } = useTranslation()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const lido = valor.trim() ? lerValor(valor) : undefined
  const reais = (v: number) => formatarValor(v, i18n.language)
  const esperando = desejos.filter((d) => !d.decisao && !prontoParaDecidir(d, agora))
  const prontos = desejos.filter((d) => prontoParaDecidir(d, agora))
  const decididos = desejos.filter((d) => d.decisao).sort((a, b) => (b.decididoEm ?? '').localeCompare(a.decididoEm ?? ''))
  const ficou = desistenciasDoMes(desejos, mesDe(agora.toISOString().slice(0, 10)))
  const quando = (d: Desejo) =>
    fimDaEspera(d).toLocaleString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '')

  async function decidir(d: Desejo, decisao: NonNullable<Desejo['decisao']>) {
    await decidirDesejo(d.id, decisao)
    mostrarAviso(t(decisao === 'desisti' ? 'dinheiro.desistiu' : 'dinheiro.vaiComprar', { nome: d.nome }), () => decidirDesejo(d.id, undefined))
  }

  return (
    <section aria-labelledby="titulo-pausa" className="cartao flex flex-col gap-4 bg-papel p-5">
      <h2 id="titulo-pausa" className="text-2xl font-semibold">
        {t('dinheiro.pausaTitulo')}
      </h2>
      <p className="max-w-prose">{t('dinheiro.pausaTexto')}</p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!nome.trim() || lido === null) return
          await anotarDesejo(nome, lido ?? undefined)
          setNome('')
          setValor('')
        }}
      >
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.desejo')}</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} placeholder={t('dinheiro.desejoExemplo')} className={campo} />
        </label>
        <label className="flex w-32 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.valor')}</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="250,00" className={`${campo} tabular-nums`} />
        </label>
        <Botao type="submit" variante="contorno" disabled={!nome.trim() || lido === null}>
          {t('dinheiro.esperar48')}
        </Botao>
      </form>

      {prontos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {prontos.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 rounded-2xl border-2 border-linha bg-manteiga p-4">
              <p className="text-lg font-bold">
                {t('dinheiro.aindaQuer', { nome: d.nome })}
                {d.valor !== undefined && <span className="ml-2 font-semibold tabular-nums">{reais(d.valor)}</span>}
              </p>
              <p className="text-sm">{t('dinheiro.esperaAcabou')}</p>
              <div className="flex flex-wrap gap-2">
                <Botao variante="secundario" tom="bg-papel" className="min-h-10 px-4 text-sm" onClick={() => decidir(d, 'comprei')}>
                  {t('dinheiro.simQuero')}
                </Botao>
                <Botao variante="secundario" tom="bg-menta" className="min-h-10 px-4 text-sm" onClick={() => decidir(d, 'desisti')}>
                  {t('dinheiro.naoQuero')}
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      {esperando.length > 0 && (
        <ul className="flex flex-col gap-2">
          {esperando.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-linha/40 px-4 py-2">
              <span className="min-w-0 flex-1 basis-48 break-words">
                <span className="font-bold">{d.nome}</span>
                {d.valor !== undefined && <span className="ml-2 tabular-nums">{reais(d.valor)}</span>}
                <span className="block text-sm">{t('dinheiro.esperando', { quando: quando(d), count: horasParaDecidir(d, agora) })}</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  const apagado = await apagarDesejo(d.id)
                  if (apagado) mostrarAviso(t('dinheiro.desejoApagado', { nome: d.nome }), () => restaurarDesejo(apagado))
                }}
                aria-label={t('dinheiro.apagarDesejo', { nome: d.nome })}
                className="text-sm font-bold underline decoration-2 underline-offset-4"
              >
                {t('editorHabito.apagar')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {ficou.quantos > 0 && (
        <p className="flex items-center gap-2 font-semibold">
          <Adesivo nome="cofrinho" tamanho={28} />
          {ficou.valor > 0 ? t('dinheiro.ficouComVoce', { valor: reais(ficou.valor), count: ficou.quantos }) : t('dinheiro.desistiuDe', { count: ficou.quantos })}
        </p>
      )}

      {decididos.length > 0 && (
        <details className="rounded-2xl border-2 border-linha/40 p-3">
          <summary className="cursor-pointer font-bold">{t('dinheiro.decididos', { count: decididos.length })}</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {decididos.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-3">
                <span>
                  {d.nome} · {t(d.decisao === 'desisti' ? 'dinheiro.desisti' : 'dinheiro.comprei')}
                </span>
                <button type="button" onClick={() => decidirDesejo(d.id, undefined)} className="text-sm font-bold underline decoration-2 underline-offset-4">
                  {t('dinheiro.desmarcar')}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function CartaoCofrinho({ cofrinho, depositos, hoje }: { cofrinho: Cofrinho; depositos: Deposito[]; hoje: Dia }) {
  const { t, i18n } = useTranslation()
  const [valor, setValor] = useState('')
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(cofrinho.nome)
  const [meta, setMeta] = useState(valorParaCampo(cofrinho.meta))
  const lido = lerValor(valor)
  const metaLida = lerValor(meta)
  const reais = (v: number) => formatarValor(v, i18n.language)
  const { guardado, fracao, falta } = progressoCofrinho(cofrinho, depositos)
  const porMes = guardadoPorMes(depositos, cofrinho.id, hoje)
  const nomeMes = (mes: string, tipo: 'short' | 'long') => new Date(`${mes}-15T12:00:00`).toLocaleDateString(i18n.language, { month: tipo }).replace('.', '')

  async function mover(sinal: 1 | -1) {
    if (!lido || lido <= 0) return
    const d = await moverNoCofrinho(cofrinho.id, sinal * lido)
    setValor('')
    mostrarAviso(t(sinal > 0 ? 'dinheiro.guardou' : 'dinheiro.tirou', { valor: reais(lido) }), () => apagarDeposito(d.id))
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border-2 border-linha bg-papel p-4">
      {editando ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!nome.trim() || !metaLida || metaLida <= 0) return
            await salvarCofrinho({ ...cofrinho, nome: nome.trim(), meta: metaLida })
            setEditando(false)
          }}
        >
          <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
            <span className="text-sm font-bold">{t('dinheiro.nomeCofrinho')}</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} className={campo} />
          </label>
          <label className="flex w-36 flex-col gap-1">
            <span className="text-sm font-bold">{t('dinheiro.meta')}</span>
            <input value={meta} onChange={(e) => setMeta(e.target.value)} inputMode="decimal" className={`${campo} tabular-nums`} />
          </label>
          <Botao type="submit" className="min-h-10 px-4 text-sm" disabled={!nome.trim() || !metaLida || metaLida <= 0}>
            {t('editorHabito.salvar')}
          </Botao>
          <Botao
            variante="contorno"
            className="min-h-10 px-4 text-sm"
            onClick={async () => {
              const apagado = await apagarCofrinho(cofrinho.id)
              mostrarAviso(t('dinheiro.cofrinhoApagado', { nome: cofrinho.nome }), () => restaurarCofrinho(apagado))
            }}
          >
            {t('editorHabito.apagar')}
          </Botao>
        </form>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="flex-1 text-lg font-bold break-words">{cofrinho.nome}</h3>
          <button type="button" onClick={() => setEditando(true)} aria-label={t('dinheiro.editarCofrinho', { nome: cofrinho.nome })} className="text-sm font-bold underline decoration-2 underline-offset-4">
            {t('academia.editar')}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-texto text-4xl leading-none font-semibold tabular-nums">{reais(guardado)}</span>
          <span className="tabular-nums">{t('dinheiro.deMeta', { meta: reais(cofrinho.meta), pct: Math.round(fracao * 100) })}</span>
        </p>
        <div aria-hidden="true" className="h-5 overflow-hidden rounded-full border-2 border-linha bg-papel">
          <div className="h-full rounded-full" style={{ width: `${fracao * 100}%`, background: 'var(--forte-piscina)' }} />
        </div>
        <p className="text-sm font-semibold">
          {falta === 0 ? (
            <span className="inline-flex items-center gap-1">
              <Adesivo nome="estrela" tamanho={22} /> {t('dinheiro.metaAlcancada')}
            </span>
          ) : (
            t('dinheiro.falta', { valor: reais(falta) })
          )}
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void mover(1)
        }}
      >
        <label className="flex w-36 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.quanto')}</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="50,00" className={`${campo} tabular-nums`} />
        </label>
        <Botao type="submit" variante="secundario" tom="bg-menta" className="min-h-11" disabled={!lido || lido <= 0}>
          + {t('dinheiro.guardar')}
        </Botao>
        <Botao variante="contorno" className="min-h-11" disabled={!lido || lido <= 0} onClick={() => mover(-1)}>
          − {t('dinheiro.tirar')}
        </Botao>
      </form>
      {porMes.some((m) => m.valor > 0) && (
        <ColunasSemanais
          titulo={t('dinheiro.guardadoPorMes')}
          subtitulo={t('dinheiro.ultimos6')}
          dados={porMes.map((m) => ({ rotulo: nomeMes(m.mes, 'short'), descricao: nomeMes(m.mes, 'long'), valor: m.valor / 100 }))}
          maximo={Math.max(...porMes.map((m) => Math.ceil(m.valor / 100)), 1)}
          unidade="R$"
          cor="var(--forte-piscina)"
          formatar={(v) => reais(Math.round(v * 100))}
        />
      )}
    </li>
  )
}

export function Cofrinhos({ cofrinhos, depositos, hoje }: { cofrinhos: Cofrinho[]; depositos: Deposito[]; hoje: Dia }) {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [meta, setMeta] = useState('')
  const lida = lerValor(meta)
  return (
    <section aria-labelledby="titulo-cofrinho" className="cartao flex flex-col gap-4 bg-menta p-5">
      <h2 id="titulo-cofrinho" className="flex items-center gap-2 text-2xl font-semibold">
        <Adesivo nome="cofrinho" tamanho={36} />
        {t('dinheiro.cofrinhoTitulo')}
      </h2>
      {cofrinhos.length ? (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {cofrinhos.map((c) => (
            <CartaoCofrinho key={c.id} cofrinho={c} depositos={depositos} hoje={hoje} />
          ))}
        </ul>
      ) : (
        <p>{t('dinheiro.semCofrinho')}</p>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!nome.trim() || !lida || lida <= 0) return
          await novoCofrinho(nome, lida)
          setNome('')
          setMeta('')
        }}
      >
        <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.novoCofrinho')}</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} placeholder={t('dinheiro.novoCofrinhoExemplo')} className={campo} />
        </label>
        <label className="flex w-36 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.meta')}</span>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} inputMode="decimal" placeholder="1.000,00" className={`${campo} tabular-nums`} />
        </label>
        <Botao type="submit" variante="secundario" tom="bg-papel" disabled={!nome.trim() || !lida || lida <= 0}>
          + {t('dinheiro.criarCofrinho')}
        </Botao>
      </form>
    </section>
  )
}
