// "Meu plano alimentar": a pessoa traz o PDF do plano, o app lê no aparelho, ela confere o que foi entendido
// e o plano aparece por horário, com "Agora é hora de…". O PDF fica guardado para abrir quando quiser.

import { useEffect, useRef, useState } from 'react'
import { permissaoAvisos, pedirPermissaoAvisos, type PermissaoAvisos } from '../lembretes'
import { useTranslation } from 'react-i18next'
import { apagarPlano, lerPdfDoPlano, restaurarPlano, salvarPlano, usePlanoAlimentar, type PdfNovo } from '../dados/planoAlimentar'
import { useAgora } from '../dados/timer'
import { comoDataUrl, linhasDoPdf } from '../lerPdf'
import { IDS_REFEICAO, type ConfigAlimentacao, type IdRefeicao } from '../logica/alimentacao'
import {
  lerPlano,
  observacao,
  opcoesParaTexto,
  refeicaoDoHorario,
  textoParaOpcoes,
  type OpcaoPlano,
  type PlanoAlimentar as Plano,
  type RefeicaoPlano,
} from '../logica/planoAlimentar'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { nomeRefeicao } from './Refeicoes'

const LIMITE_PDF = 15 * 1024 * 1024
const campo = 'min-h-11 rounded-2xl border-2 border-linha bg-papel px-4'
const botaoArquivo =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-full border-2 px-5 font-bold focus-within:outline focus-within:outline-3 focus-within:outline-offset-2'

/** Linha do rascunho: o texto das opções fica como a pessoa escreve, até salvar. */
type Linha = { chave: string; id: IdRefeicao; nome?: string; hora?: string; nota?: string; texto: string }
type Rascunho = { linhas: Linha[]; pdf?: PdfNovo | 'manter'; achou?: number }

const paraLinhas = (refeicoes: RefeicaoPlano[]): Linha[] =>
  refeicoes.map((r) => ({ chave: crypto.randomUUID(), id: r.id, nome: r.nome, hora: r.hora, nota: r.nota, texto: opcoesParaTexto(r.opcoes) }))

/** Juntando de volta: a mesma refeição escolhida duas vezes vira uma só, com as opções das duas. */
function paraRefeicoes(linhas: Linha[]): RefeicaoPlano[] {
  const porId = new Map<IdRefeicao, RefeicaoPlano>()
  for (const l of linhas) {
    const opcoes = textoParaOpcoes(l.texto)
    const ja = porId.get(l.id)
    const nota = l.nota?.trim()
    if (ja) {
      ja.opcoes.push(...opcoes)
      ja.hora ??= l.hora
      ja.nota ??= nota || undefined
    } else porId.set(l.id, { id: l.id, ...(l.nome ? { nome: l.nome } : {}), ...(l.hora ? { hora: l.hora } : {}), ...(nota ? { nota } : {}), opcoes })
  }
  return [...porId.values()]
}

function nomeNoPlano(t: ReturnType<typeof useTranslation>['t'], r: Pick<RefeicaoPlano, 'id' | 'nome'>) {
  return r.nome || nomeRefeicao(t, { id: r.id })
}

/**
 * As opções de uma refeição do plano, lado a lado; a observação de cada opção ("Obs: sanduíche") vem em itálico.
 * `compacto` (cartão "Agora", janelinha): só a primeira opção e quantas mais existem.
 */
export function OpcoesDoPlano({ opcoes, compacto = false }: { opcoes: OpcaoPlano[]; compacto?: boolean }) {
  const { t } = useTranslation()
  const mostradas = compacto ? opcoes.slice(0, 1) : opcoes
  return (
    <>
      <ul className={`grid gap-2 ${mostradas.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {mostradas.map((o, i) => {
          const itens = o.filter((x) => !observacao(x))
          const obs = o.map(observacao).filter(Boolean)
          return (
            <li key={i} className="flex flex-col gap-1 rounded-xl border-2 border-linha/30 bg-papel px-3 py-2">
              {opcoes.length > 1 && <p className="rotulo">{t('planoAlimentar.opcao', { n: i + 1 })}</p>}
              {itens.length > 0 && (
                <ul className="list-disc pl-5">
                  {itens.map((item, j) => (
                    <li key={j} className="break-words">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {obs.map((x, j) => (
                <p key={j} className="font-destaque text-lg break-words italic">
                  {x}
                </p>
              ))}
            </li>
          )
        })}
      </ul>
      {compacto && opcoes.length > 1 && <p className="text-sm font-semibold">{t('planoAlimentar.maisOpcoes', { count: opcoes.length - 1 })}</p>}
    </>
  )
}

/** Botão que abre a escolha de arquivo (o campo fica escondido, mas recebe o foco do teclado). */
function EscolherPdf({ rotulo, aoEscolher, principal = true }: { rotulo: string; aoEscolher: (f: File) => void; principal?: boolean }) {
  return (
    <label className={`${botaoArquivo} ${principal ? 'border-botao bg-botao text-botao-texto' : 'border-linha bg-papel'}`}>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="so-leitor"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) aoEscolher(f)
        }}
      />
      <Adesivo nome="envelope" tamanho={22} />
      {rotulo}
    </label>
  )
}

function Conferir({ rascunho, aoSalvar, aoCancelar }: { rascunho: Rascunho; aoSalvar: () => void; aoCancelar: () => void }) {
  const { t } = useTranslation()
  const [linhas, setLinhas] = useState(rascunho.linhas)
  const [usarNoApp, setUsarNoApp] = useState(true)
  const [avisar, setAvisar] = useState(true)
  const [erro, setErro] = useState('')
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => titulo.current?.focus(), [])
  const mudar = (chave: string, m: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...m } : l)))
  const pdf = rascunho.pdf && rascunho.pdf !== 'manter' ? rascunho.pdf : undefined

  async function salvar() {
    const refeicoes = paraRefeicoes(linhas).filter((r) => r.hora || r.opcoes.length)
    if (!refeicoes.length) return setErro(t('planoAlimentar.nadaParaSalvar'))
    await salvarPlano(refeicoes, rascunho.pdf, { usarNoApp, avisar: usarNoApp && avisar })
    mostrarAviso(t('planoAlimentar.salvo'))
    aoSalvar()
  }

  return (
    <form
      aria-labelledby="titulo-conferir"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void salvar()
      }}
    >
      <div>
        <h3 id="titulo-conferir" ref={titulo} tabIndex={-1} className="text-xl font-semibold outline-none">
          {t('planoAlimentar.conferirTitulo')}
        </h3>
        <p className="max-w-prose">
          {rascunho.achou === undefined
            ? t('planoAlimentar.escrever')
            : rascunho.achou > 0
              ? t('planoAlimentar.achou', { count: rascunho.achou })
              : t('planoAlimentar.naoAchou')}
        </p>
        {pdf && <p className="text-sm">{t('planoAlimentar.arquivo', { nome: pdf.nome })}</p>}
      </div>
      <ol className="flex flex-col gap-3">
        {linhas.map((l) => {
          const nome = nomeNoPlano(t, l)
          return (
            <li key={l.chave} className="flex flex-col gap-3 rounded-2xl border-2 border-linha/50 bg-papel p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                  <span className="text-sm font-bold">{t('planoAlimentar.refeicao')}</span>
                  <select value={l.id} onChange={(e) => mudar(l.chave, { id: e.target.value as IdRefeicao, nome: undefined })} className={campo}>
                    {/* o nome que veio do PDF ("Colação") continua como opção da refeição dele */}
                    {IDS_REFEICAO.map((id) => (
                      <option key={id} value={id}>
                        {id === l.id && l.nome ? l.nome : nomeRefeicao(t, { id })}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{t('planoAlimentar.horario', { refeicao: nome })}</span>
                  <input type="time" value={l.hora ?? ''} onChange={(e) => mudar(l.chave, { hora: e.target.value || undefined })} className={`${campo} tabular-nums`} />
                </label>
                <button
                  type="button"
                  onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}
                  aria-label={t('planoAlimentar.tirar', { refeicao: nome })}
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-linha bg-papel text-lg font-bold"
                >
                  ×
                </button>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{t('planoAlimentar.nota', { refeicao: nome })}</span>
                <input value={l.nota ?? ''} onChange={(e) => mudar(l.chave, { nota: e.target.value })} maxLength={140} className={campo} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{t('planoAlimentar.oQueComer', { refeicao: nome })}</span>
                <textarea
                  value={l.texto}
                  onChange={(e) => mudar(l.chave, { texto: e.target.value })}
                  rows={Math.min(10, Math.max(3, l.texto.split('\n').length + 1))}
                  className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
                />
              </label>
            </li>
          )
        })}
      </ol>
      <p className="text-sm">{t('planoAlimentar.oQueComerDica')}</p>
      <Botao
        variante="contorno"
        className="self-start"
        onClick={() =>
          setLinhas((ls) => [...ls, { chave: crypto.randomUUID(), id: IDS_REFEICAO.find((id) => !ls.some((l) => l.id === id)) ?? 'lanche', texto: '' }])
        }
      >
        + {t('planoAlimentar.acrescentar')}
      </Botao>
      <label className="flex items-start gap-2">
        <input type="checkbox" checked={usarNoApp} onChange={(e) => setUsarNoApp(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--chocolate)]" />
        <span>
          <span className="font-bold">{t('planoAlimentar.usarNoApp')}</span>
          <span className="block text-sm">{t('planoAlimentar.usarNoAppDica')}</span>
        </span>
      </label>
      {usarNoApp && (
        <label className="flex items-start gap-2 pl-7">
          <input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--chocolate)]" />
          <span className="font-bold">{t('planoAlimentar.avisar')}</span>
        </label>
      )}
      <p aria-live="polite" className="min-h-6 font-semibold">
        {erro && <>! {erro}</>}
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit">{t('planoAlimentar.salvar')}</Botao>
        <Botao variante="contorno" onClick={aoCancelar}>
          {t('planoAlimentar.cancelar')}
        </Botao>
      </div>
    </form>
  )
}

/** O PDF guardado vira um link de verdade (abrir depois de esperar o banco seria bloqueado no iPad). */
function useLinkDoPdf(temPdf: boolean, salvoEm?: string): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!temPdf) return
    let link: string | undefined
    let cancelado = false
    void (async () => {
      const pdf = await lerPdfDoPlano()
      if (!pdf || cancelado) return
      link = URL.createObjectURL(await (await fetch(pdf.dados)).blob())
      setUrl(link)
    })()
    return () => {
      cancelado = true
      if (link) URL.revokeObjectURL(link)
      setUrl(undefined)
    }
  }, [temPdf, salvoEm])
  return url
}

/** Com lembretes ligados nas refeições: pedir a permissão de avisos do sistema, se ainda não foi pedida. */
function AvisosDoPlano({ config }: { config: ConfigAlimentacao }) {
  const { t } = useTranslation()
  const [permissao, setPermissao] = useState<PermissaoAvisos>(permissaoAvisos)
  if (!config.refeicoes.some((r) => r.ativa && r.lembrar && r.hora)) return null
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-semibold">{t('planoAlimentar.avisosLigados')}</p>
      {permissao === 'default' && (
        <Botao variante="contorno" className="self-start" onClick={async () => setPermissao(await pedirPermissaoAvisos())}>
          {t('remedios.ativarAvisos')}
        </Botao>
      )}
      {permissao === 'denied' && <p>{t('remedios.avisosNegados')}</p>}
      <p className="text-tinta-suave">{t('remedios.avisosAberto')}</p>
    </div>
  )
}

function PlanoPorHorario({ plano }: { plano: Plano }) {
  const { t } = useTranslation()
  const agora = useAgora(60_000)
  const { atual, proxima } = refeicaoDoHorario(plano.refeicoes, agora)
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-lg font-semibold" role="status">
        {atual && <span>{t('planoAlimentar.agoraTexto', { refeicao: nomeNoPlano(t, atual), hora: atual.hora })}</span>}
        {proxima && <span className="font-normal">{t('planoAlimentar.proxima', { refeicao: nomeNoPlano(t, proxima), hora: proxima.hora })}</span>}
      </p>
      <ol className="flex flex-col gap-3">
        {plano.refeicoes.map((r) => {
          const eAgora = atual?.id === r.id
          return (
            <li
              key={r.id}
              aria-current={eAgora ? 'time' : undefined}
              className={`flex flex-col gap-2 rounded-2xl border-2 p-4 ${eAgora ? 'border-linha bg-papel shadow-[3px_3px_0_var(--linha)]' : 'border-linha/40 bg-papel/70'}`}
            >
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-14 font-bold tabular-nums">{r.hora ?? t('planoAlimentar.semHora')}</span>
                <span className="text-lg font-bold">{nomeNoPlano(t, r)}</span>
                {eAgora && <span className="rounded-full border-2 border-linha bg-menta px-2 text-xs font-bold">{t('planoAlimentar.agora')}</span>}
              </p>
              {r.nota && <p className="text-sm italic">{r.nota}</p>}
              {r.opcoes.length > 0 && <OpcoesDoPlano opcoes={r.opcoes} />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function MeuPlanoAlimentar({ config }: { config: ConfigAlimentacao }) {
  const { t } = useTranslation()
  const plano = usePlanoAlimentar()
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [lendo, setLendo] = useState(false)
  const [erro, setErro] = useState('')
  const titulo = useRef<HTMLHeadingElement>(null)
  const link = useLinkDoPdf(!!plano?.arquivo, plano?.salvoEm)
  if (plano === undefined) return null
  // o formulário some ao salvar ou cancelar: o foco volta para o título da seção, e não para o começo da página
  const fecharRascunho = () => {
    setRascunho(null)
    setTimeout(() => titulo.current?.focus(), 0)
  }

  async function escolher(arquivo: File) {
    setErro('')
    if (arquivo.type !== 'application/pdf' && !arquivo.name.toLowerCase().endsWith('.pdf')) return setErro(t('planoAlimentar.naoEPdf'))
    if (arquivo.size > LIMITE_PDF) return setErro(t('planoAlimentar.grande'))
    setLendo(true)
    try {
      const [linhas, dados] = await Promise.all([arquivo.arrayBuffer().then(linhasDoPdf), comoDataUrl(arquivo)])
      const achadas = lerPlano(linhas)
      // sem nada achado (foto escaneada): as refeições ligadas, com os horários do app, para escrever
      const base: RefeicaoPlano[] = achadas.length ? achadas : config.refeicoes.filter((r) => r.ativa).map((r) => ({ id: r.id, hora: r.hora, opcoes: [] }))
      setRascunho({ linhas: paraLinhas(base), pdf: { nome: arquivo.name, tipo: 'application/pdf', tamanho: arquivo.size, dados }, achou: achadas.length })
    } catch {
      setErro(t('planoAlimentar.naoAbriu'))
    } finally {
      setLendo(false)
    }
  }

  async function apagar() {
    titulo.current?.focus()
    const copia = await apagarPlano()
    if (copia) mostrarAviso(t('planoAlimentar.apagado'), () => restaurarPlano(copia))
  }

  const escrevendoSemPdf = () =>
    setRascunho({ linhas: paraLinhas(config.refeicoes.filter((r) => r.ativa).map((r) => ({ id: r.id, hora: r.hora, opcoes: [] }))) })

  return (
    <section aria-labelledby="titulo-plano-alimentar" className="cartao flex flex-col gap-4 bg-papel p-5">
      <h2 id="titulo-plano-alimentar" ref={titulo} tabIndex={-1} className="flex items-center gap-2 text-2xl font-semibold outline-none">
        <Adesivo nome="prato" tamanho={36} />
        {t('planoAlimentar.titulo')}
      </h2>

      {rascunho ? (
        <Conferir rascunho={rascunho} aoSalvar={fecharRascunho} aoCancelar={fecharRascunho} />
      ) : plano ? (
        <>
          <PlanoPorHorario plano={plano} />
          <AvisosDoPlano config={config} />
          <div className="flex flex-wrap items-center gap-2">
            {link && (
              <a href={link} target="_blank" rel="noopener" className={`${botaoArquivo} border-linha bg-papel`}>
                {t('planoAlimentar.abrirPdf')}
              </a>
            )}
            <EscolherPdf rotulo={t('planoAlimentar.trocarPdf')} aoEscolher={escolher} principal={false} />
            <Botao variante="contorno" onClick={() => setRascunho({ linhas: paraLinhas(plano.refeicoes), pdf: plano.arquivo ? 'manter' : undefined })}>
              {t('planoAlimentar.editar')}
            </Botao>
            <Botao variante="contorno" onClick={apagar}>
              {t('planoAlimentar.apagar')}
            </Botao>
          </div>
        </>
      ) : (
        <>
          <p className="max-w-prose">{t('planoAlimentar.convite')}</p>
          <p className="text-sm">{t('planoAlimentar.privado')}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <EscolherPdf rotulo={t('planoAlimentar.escolher')} aoEscolher={escolher} />
            <button type="button" onClick={escrevendoSemPdf} className="font-bold underline decoration-2 underline-offset-4">
              {t('planoAlimentar.semPdf')}
            </button>
          </div>
        </>
      )}

      {(lendo || erro) && (
        <p role="status" className="font-semibold">
          {lendo ? t('planoAlimentar.lendo') : `! ${erro}`}
        </p>
      )}
    </section>
  )
}
