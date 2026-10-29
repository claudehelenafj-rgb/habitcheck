// "Não sei o que comer" (até 3 ideias da lista de comidas fáceis), as comidas fáceis que a pessoa já sabe
// preparar ou comprar, e a lista de compras. Nada de calorias nem de comida "certa".

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  acrescentarCompras,
  alternarComprado,
  apagarComida,
  criarComidasExemplo,
  restaurarComida,
  restaurarCompras,
  salvarComida,
  tirarComprados,
} from '../dados/alimentacao'
import { novoId } from '../dados/banco'
import {
  ordenarCompras,
  refeicaoMaisPerto,
  refeicoesAtivas,
  sugerirComidas,
  type Comida,
  type ConfigAlimentacao,
  type IdRefeicao,
  type ItemCompra,
} from '../logica/alimentacao'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { nomeRefeicao } from './Refeicoes'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'
const chip = (marcado: boolean) => `min-h-11 rounded-full border-2 border-linha px-4 text-sm font-semibold ${marcado ? 'bg-menta' : 'bg-papel'}`

/** Ideias para começar (os textos vêm das traduções). */
const EXEMPLOS: Array<{ chave: string; jeito: Comida['jeito']; refeicoes: IdRefeicao[] }> = [
  { chave: 'sanduiche', jeito: 'preparo', refeicoes: ['cafe', 'lanche', 'jantar'] },
  { chave: 'iogurte', jeito: 'preparo', refeicoes: ['cafe', 'lanche'] },
  { chave: 'macarrao', jeito: 'preparo', refeicoes: ['almoco', 'jantar'] },
  { chave: 'ovos', jeito: 'preparo', refeicoes: ['cafe', 'almoco', 'jantar'] },
  { chave: 'congelado', jeito: 'compro', refeicoes: ['almoco', 'jantar'] },
]

const separar = (texto: string) =>
  texto
    .split(/[,\n;]/)
    .map((x) => x.trim())
    .filter(Boolean)

export function NaoSeiOQueComer({ config, comidas }: { config: ConfigAlimentacao; comidas: Comida[] }) {
  const { t } = useTranslation()
  const [refeicao, setRefeicao] = useState<IdRefeicao | undefined>(() => refeicaoMaisPerto(config, new Date()))
  const [rodada, setRodada] = useState(0)
  const ativas = refeicoesAtivas(config)
  const escolhida = ativas.some((r) => r.id === refeicao) ? refeicao : ativas[0]?.id
  const ideias = escolhida ? sugerirComidas(comidas, escolhida, rodada) : []
  const quantasServem = escolhida ? comidas.filter((c) => !c.refeicoes.length || c.refeicoes.includes(escolhida)).length : 0

  return (
    <section id="nao-sei" aria-labelledby="titulo-nao-sei" className="cartao flex scroll-mt-6 flex-col gap-4 bg-papel p-5">
      <h2 id="titulo-nao-sei" tabIndex={-1} className="text-2xl font-semibold outline-none">
        {t('alimentacao.naoSeiOQue')}
      </h2>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('alimentacao.paraQual')}>
        {ativas.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={escolhida === r.id}
            onClick={() => {
              setRefeicao(r.id)
              setRodada(0)
            }}
            className={chip(escolhida === r.id)}
          >
            {escolhida === r.id && '✓ '}
            {nomeRefeicao(t, r)}
          </button>
        ))}
      </div>
      {ideias.length ? (
        <ul className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          {ideias.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 rounded-2xl border-2 border-linha bg-menta p-4">
              <span className="flex items-center gap-2 text-lg font-bold break-words">
                <Adesivo nome="prato" tamanho={28} />
                {c.nome}
              </span>
              <span className="text-sm font-semibold">{t(`alimentacao.jeitos.${c.jeito}`)}</span>
              {c.ingredientes.length > 0 && <span className="text-sm">{c.ingredientes.join(', ')}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>{comidas.length ? t('alimentacao.semIdeiaParaEssa') : t('alimentacao.semComidas')}</p>
      )}
      {quantasServem > 3 && (
        <Botao variante="secundario" tom="bg-menta" className="self-start" onClick={() => setRodada((r) => r + 1)}>
          {t('alimentacao.outrasIdeias')}
        </Botao>
      )}
    </section>
  )
}

type Rascunho = { id?: string; nome: string; jeito: Comida['jeito']; refeicoes: IdRefeicao[]; ingredientes: string }
const vazio: Rascunho = { nome: '', jeito: 'preparo', refeicoes: [], ingredientes: '' }

export function ComidasFaceis({ config, comidas }: { config: ConfigAlimentacao; comidas: Comida[] }) {
  const { t, i18n } = useTranslation()
  const [r, setR] = useState<Rascunho>(vazio)
  const ordenadas = [...comidas].sort((a, b) => a.nome.localeCompare(b.nome, i18n.language, { sensitivity: 'base' }))
  const nomeDe = (id: IdRefeicao) => nomeRefeicao(t, config.refeicoes.find((x) => x.id === id) ?? { id })

  async function salvar() {
    if (!r.nome.trim()) return
    const atual = r.id ? comidas.find((c) => c.id === r.id) : undefined
    await salvarComida({
      id: r.id ?? novoId(),
      nome: r.nome.trim(),
      jeito: r.jeito,
      refeicoes: r.refeicoes,
      ingredientes: separar(r.ingredientes),
      criadaEm: atual?.criadaEm ?? new Date().toISOString(),
    })
    setR(vazio)
  }

  return (
    <section aria-labelledby="titulo-comidas" className="cartao flex flex-col gap-4 bg-papel p-5">
      <h2 id="titulo-comidas" className="text-2xl font-semibold">
        {t('alimentacao.comidasTitulo')}
      </h2>
      <p className="max-w-prose">{t('alimentacao.comidasTexto')}</p>
      {ordenadas.length ? (
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
          {ordenadas.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 rounded-2xl border-2 border-linha/40 p-4">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-bold break-words">{c.nome}</span>
                <span className="rounded-full border-2 border-linha/40 px-2 text-xs font-bold">{t(`alimentacao.jeitos.${c.jeito}`)}</span>
              </p>
              <p className="text-sm">
                {c.refeicoes.length ? c.refeicoes.map(nomeDe).join(', ') : t('alimentacao.qualquerRefeicao')}
                {c.ingredientes.length > 0 && ` · ${c.ingredientes.join(', ')}`}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {c.ingredientes.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const n = await acrescentarCompras(c.ingredientes)
                      mostrarAviso(n ? t('alimentacao.foiParaLista', { count: n }) : t('alimentacao.jaNaLista'))
                    }}
                    className="text-sm font-bold underline decoration-2 underline-offset-4"
                  >
                    {t('alimentacao.porNaLista')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setR({ id: c.id, nome: c.nome, jeito: c.jeito, refeicoes: c.refeicoes, ingredientes: c.ingredientes.join(', ') })}
                  aria-label={t('alimentacao.editarComida', { nome: c.nome })}
                  className="text-sm font-bold underline decoration-2 underline-offset-4"
                >
                  {t('academia.editar')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const apagada = await apagarComida(c.id)
                    if (apagada) mostrarAviso(t('alimentacao.comidaApagada', { nome: c.nome }), () => restaurarComida(apagada))
                  }}
                  aria-label={t('alimentacao.apagarComida', { nome: c.nome })}
                  className="text-sm font-bold underline decoration-2 underline-offset-4"
                >
                  {t('editorHabito.apagar')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Botao
          variante="secundario"
          tom="bg-menta"
          className="self-start"
          onClick={() =>
            criarComidasExemplo(
              EXEMPLOS.map((e) => ({
                nome: t(`alimentacao.exemplos.${e.chave}.nome`),
                jeito: e.jeito,
                refeicoes: e.refeicoes,
                ingredientes: separar(t(`alimentacao.exemplos.${e.chave}.ingredientes`)),
              })),
            )
          }
        >
          {t('alimentacao.comecarComIdeias')}
        </Botao>
      )}

      <form
        className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-linha/50 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <h3 className="font-bold">{r.id ? t('alimentacao.editarComidaTitulo') : t('alimentacao.novaComida')}</h3>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('alimentacao.nomeComida')}</span>
          <input value={r.nome} onChange={(e) => setR({ ...r, nome: e.target.value })} maxLength={60} placeholder={t('alimentacao.nomeComidaExemplo')} className={campo} />
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-bold">{t('alimentacao.comoE')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {(['preparo', 'compro'] as const).map((j) => (
              <button key={j} type="button" aria-pressed={r.jeito === j} onClick={() => setR({ ...r, jeito: j })} className={chip(r.jeito === j)}>
                {r.jeito === j && '✓ '}
                {t(`alimentacao.jeitos.${j}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-bold">{t('alimentacao.servePara')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {config.refeicoes.map((x) => {
              const marcado = r.refeicoes.includes(x.id)
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => setR({ ...r, refeicoes: marcado ? r.refeicoes.filter((y) => y !== x.id) : [...r.refeicoes, x.id] })}
                  className={chip(marcado)}
                >
                  {marcado && '✓ '}
                  {nomeRefeicao(t, x)}
                </button>
              )
            })}
          </div>
          <span className="text-sm">{t('alimentacao.serveDica')}</span>
        </fieldset>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('alimentacao.ingredientes')}</span>
          <input value={r.ingredientes} onChange={(e) => setR({ ...r, ingredientes: e.target.value })} maxLength={200} placeholder={t('alimentacao.ingredientesExemplo')} className={campo} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Botao type="submit" disabled={!r.nome.trim()}>
            {r.id ? t('editorHabito.salvar') : `+ ${t('alimentacao.acrescentarComida')}`}
          </Botao>
          {r.id && (
            <Botao variante="contorno" onClick={() => setR(vazio)}>
              {t('editorHabito.cancelar')}
            </Botao>
          )}
        </div>
      </form>
    </section>
  )
}

export function ListaDeCompras({ compras }: { compras: ItemCompra[] }) {
  const { t } = useTranslation()
  const [texto, setTexto] = useState('')
  const [jaTinha, setJaTinha] = useState(false)
  const lista = ordenarCompras(compras)
  const falta = compras.filter((i) => !i.compradoEm).length
  const comprados = compras.length - falta

  return (
    <section aria-labelledby="titulo-compras" className="cartao flex flex-col gap-4 bg-papel p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="titulo-compras" className="flex-1 text-2xl font-semibold">
          {t('alimentacao.comprasTitulo')}
        </h2>
        {falta > 0 && <span className="rounded-full border-2 border-linha px-3 py-0.5 text-sm font-bold">{t('alimentacao.paraComprar', { count: falta })}</span>}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!texto.trim()) return
          const n = await acrescentarCompras(texto)
          setJaTinha(n === 0)
          setTexto('')
        }}
      >
        <label className="min-w-0 flex-1 basis-56">
          <span className="so-leitor">{t('alimentacao.oQueFalta')}</span>
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setJaTinha(false)
            }}
            placeholder={t('alimentacao.oQueFaltaExemplo')}
            className={`${campo} w-full`}
          />
        </label>
        <Botao type="submit" variante="contorno">
          + {t('editorHabito.acrescentar')}
        </Botao>
      </form>
      <p role="status" className="min-h-5 text-sm">
        {jaTinha ? t('alimentacao.jaNaLista') : t('alimentacao.oQueFaltaDica')}
      </p>
      {lista.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {lista.map((i) => {
            const comprado = !!i.compradoEm
            return (
              <li key={i.id}>
                <button
                  type="button"
                  aria-pressed={comprado}
                  onClick={() => alternarComprado(i.id)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 py-2 text-left font-semibold ${comprado ? 'border-linha/40 bg-papel/60' : 'border-linha bg-papel'}`}
                >
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel">
                    {comprado ? '✓' : ''}
                  </span>
                  <span className={`break-words ${comprado ? 'line-through decoration-2' : ''}`}>{i.nome}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>{t('alimentacao.listaVazia')}</p>
      )}
      {comprados > 0 && (
        <Botao
          variante="contorno"
          className="self-start"
          onClick={async () => {
            const tirados = await tirarComprados()
            mostrarAviso(t('alimentacao.compradosTirados', { count: tirados.length }), () => restaurarCompras(tirados))
          }}
        >
          {t('alimentacao.tirarComprados', { count: comprados })}
        </Botao>
      )}
    </section>
  )
}
