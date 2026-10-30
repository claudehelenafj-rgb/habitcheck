// Conteúdo de cada passo dos rituais da manhã e da noite. Cada passo lê o que precisa do banco
// e grava na hora (com "Desfazer" quando muda uma tarefa).

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Tarefa } from '../dados/banco'
import { useBemEstar } from '../dados/bemEstar'
import { useConsultas } from '../dados/consultas'
import { useContasAtivas } from '../dados/dinheiro'
import { useEventos } from '../dados/eventos'
import { useAvaliacoes } from '../dados/faculdade'
import { marcarHabito, useHabitosAtivos } from '../dados/habitos'
import type { Perfil } from '../dados/perfil'
import { desfazerResposta, responderDose, useDosesDoDia } from '../dados/remedios'
import { concluirTarefa, novaTarefa, reabrirTarefa, salvarTarefa, useCaixaAberta, useTarefas } from '../dados/tarefas'
import { AREAS, type IdArea } from '../design/areas'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import { formatarValor } from '../logica/dinheiro'
import { AREAS_COM_HABITOS, diaDoPreparo, temPreparo } from '../logica/habitos'
import { BLOCOS, habitosDoDia, tarefasDoDia, type Bloco } from '../logica/hoje'
import { estadoDose, type DosePrevista, type StatusDose } from '../logica/remedios'
import {
  agendaDoDia,
  candidatasParaHoje,
  consultasParaConferir,
  dosesSemResposta,
  escolhidasParaHoje,
  paraODia,
  pendenciasDoDia,
  virarB,
  type ItemAgenda,
  type RegistroRitual,
} from '../logica/rituais'
import { noiteDaRotina } from '../logica/sono'
import { cabeTarefaA, LIMITE_TAREFAS_A } from '../logica/tarefas'
import { Adesivo, type NomeAdesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { BaseDeLancamento } from './CartaoHabito'
import { CheckinEmocoes } from './CheckinEmocoes'
import { ListaCaixa } from './ListaCaixa'
import { ProtecaoBemEstar } from './ProtecaoBemEstar'
import { RotinaDesacelerar } from './Sono'

export type PropsPasso = { dia: Dia; agora: Date; perfil: Perfil; registro?: RegistroRitual }

const link = 'self-start font-bold underline decoration-2 underline-offset-4'
const linha = 'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-linha/40 bg-papel px-3 py-2'

function useDataCurta() {
  const { i18n } = useTranslation()
  return (dia: Dia) =>
    new Date(`${dia}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}

function Subtitulo({ children, id }: { children: string; id?: string }) {
  return (
    <h3 id={id} tabIndex={id ? -1 : undefined} className="text-lg font-bold outline-none">
      {children}
    </h3>
  )
}

/**
 * Depois de um clique que tira o botão da tela (a tarefa muda de lista, a dose foi respondida...), leva o foco
 * para um lugar que faz sentido, em vez de ele voltar para o começo da página.
 */
function focarDepois(alvos: Array<() => Element | null | undefined>) {
  const clicado = document.activeElement
  let tentativas = 0
  const tentar = () => {
    const ainda = clicado && clicado !== document.body && document.contains(clicado) && document.activeElement === clicado
    if (ainda && tentativas++ < 20) return void setTimeout(tentar, 25)
    if (document.activeElement !== document.body && document.activeElement !== clicado) return
    for (const alvo of alvos) {
      const el = alvo()
      if (el instanceof HTMLElement && !(el as HTMLButtonElement).disabled) return el.focus()
    }
    document.getElementById('titulo-passo')?.focus()
  }
  setTimeout(tentar, 0)
}

const porRotulo = (rotulo: string) => document.querySelector(`main [aria-label="${CSS.escape(rotulo)}"]`)

// ---------- check-in (manhã) ----------

export function PassoCheckin() {
  return (
    <ProtecaoBemEstar compacto>
      <CheckinEmocoes compacto />
    </ProtecaoBemEstar>
  )
}

// ---------- o dia ----------

const ADESIVO_AGENDA: Record<ItemAgenda['tipo'], NomeAdesivo> = { consulta: 'prancheta', evento: 'calendario', avaliacao: 'livro', conta: 'cofrinho' }

function ListaAgenda({ itens, vazio }: { itens: ItemAgenda[]; vazio: string }) {
  const { t, i18n } = useTranslation()
  if (!itens.length) return <p>{vazio}</p>
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((item) => {
        const detalhe =
          item.tipo === 'consulta'
            ? [item.local, item.arrumar && t('rituais.arrumarAs', { hora: item.arrumar })]
            : item.tipo === 'evento'
              ? [item.local]
              : item.tipo === 'avaliacao'
                ? [`${t(`faculdade.tipos.${item.avaliacao.tipo}`)} · ${item.avaliacao.materia}`]
                : [item.valor !== undefined && formatarValor(item.valor, i18n.language), item.estado === 'hoje' ? t('dinheiro.venceHoje') : t('dinheiro.ainda')]
        return (
          <li key={`${item.tipo}|${item.id}`} className={linha}>
            <span className="w-16 shrink-0 font-bold tabular-nums">{item.hora ?? (item.tipo === 'conta' ? '' : t('rituais.diaTodo'))}</span>
            <Adesivo nome={ADESIVO_AGENDA[item.tipo]} tamanho={26} />
            <span className="min-w-0 flex-1 basis-40">
              <span className="font-semibold break-words">{item.titulo}</span>
              {detalhe.some(Boolean) && <span className="block text-sm">{detalhe.filter(Boolean).join(' · ')}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function useAgenda(dia: Dia): ItemAgenda[] | undefined {
  const consultas = useConsultas()
  const eventos = useEventos()
  const avaliacoes = useAvaliacoes()
  const contas = useContasAtivas()
  if (!consultas || !eventos || !avaliacoes || contas === undefined) return undefined
  return agendaDoDia({ consultas, eventos, avaliacoes, contas: contas ?? [] }, dia)
}

export function PassoDia({ dia }: PropsPasso) {
  const { t } = useTranslation()
  const agenda = useAgenda(dia)
  const habitos = useHabitosAtivos()
  if (!agenda || !habitos) return null
  const doDia = habitosDoDia(habitos.habitos, habitos.registros, dia)
  return (
    <div className="flex flex-col gap-4">
      <ListaAgenda itens={agenda} vazio={t('rituais.semCompromissos')} />
      {doDia.length > 0 && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.tambemHoje')}</Subtitulo>
          <ul className="flex flex-wrap gap-2">
            {doDia.map(({ habito }) => (
              <li key={habito.id} className={`flex items-center gap-2 rounded-full border-2 border-linha/60 py-1 pr-3 pl-1 text-sm font-semibold ${AREAS[habito.area ?? 'academia'].claro}`}>
                <Adesivo nome={habito.adesivo} tamanho={20} />
                {habito.titulo}
                {habito.bloco && <span className="font-normal">· {t(`hoje.blocos.${habito.bloco}`)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------- até 3 tarefas A (manhã) ----------

const MOSTRAR_CANDIDATAS = 6

function EscolhaBloco({ tarefa }: { tarefa: Tarefa }) {
  const { t } = useTranslation()
  const opcoes: Array<Bloco | undefined> = [...BLOCOS, undefined]
  return (
    <div role="group" aria-label={t('rituais.quando', { titulo: tarefa.titulo })} className="flex flex-wrap gap-1.5">
      {opcoes.map((b) => {
        const marcado = tarefa.bloco === b
        return (
          <button
            key={b ?? 'qualquer'}
            type="button"
            aria-pressed={marcado}
            onClick={() => salvarTarefa({ ...tarefa, bloco: b })}
            className={`min-h-9 rounded-full border-2 border-linha px-3 text-sm font-bold ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`}
          >
            {b ? t(`hoje.blocos.${b}`) : t('hoje.qualquerHora')}
          </button>
        )
      })}
    </div>
  )
}

export function PassoTarefasA({ dia }: PropsPasso) {
  const { t } = useTranslation()
  const dataCurta = useDataCurta()
  const tarefas = useTarefas()
  const [texto, setTexto] = useState('')
  const [todas, setTodas] = useState(false)
  const campo = useRef<HTMLInputElement>(null)
  if (!tarefas) return null
  const escolhidas = escolhidasParaHoje(tarefas, dia)
  const candidatas = candidatasParaHoje(tarefas, dia)
  const cabe = cabeTarefaA(tarefas, dia)
  const mostradas = todas ? candidatas : candidatas.slice(0, MOSTRAR_CANDIDATAS)

  async function porHoje(x: Tarefa, i: number) {
    // o foco vai para a próxima candidata (a que sobe para este lugar) ou para as escolhidas, se encheu
    focarDepois([() => document.querySelectorAll('main [data-candidata]')[i] ?? document.querySelectorAll('main [data-candidata]')[i - 1], () => document.getElementById('titulo-escolhidas')])
    await salvarTarefa(paraODia(x, dia))
    mostrarAviso(t('rituais.posta', { titulo: x.titulo }), () => salvarTarefa(x))
  }
  async function tirar(x: Tarefa) {
    focarDepois([() => document.getElementById('titulo-escolhidas')])
    await salvarTarefa(virarB(x))
    mostrarAviso(t('rituais.tirada', { titulo: x.titulo }), () => salvarTarefa(x))
  }
  async function acrescentar() {
    const titulo = texto.trim()
    if (!titulo) return
    const nova = novaTarefa(titulo)
    await salvarTarefa(cabe ? paraODia(nova, dia) : nova)
    if (!cabe) mostrarAviso(t('rituais.ficouB', { titulo }))
    setTexto('')
    campo.current?.focus()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Subtitulo id="titulo-escolhidas">{t('rituais.escolhidas')}</Subtitulo>
          <span className="flex gap-1" role="img" aria-label={`${escolhidas.length} / ${LIMITE_TAREFAS_A}`}>
            {Array.from({ length: LIMITE_TAREFAS_A }, (_, i) => (
              <span key={i} className={`h-4 w-4 rounded-full border-2 border-linha ${i < escolhidas.length ? 'bg-tinta' : ''}`} />
            ))}
          </span>
        </div>
        {escolhidas.length ? (
          <ul className="flex flex-col gap-2">
            {escolhidas.map((x) => (
              <li key={x.id} className="flex flex-col gap-2 rounded-2xl border-2 border-linha bg-manteiga p-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`min-w-0 flex-1 basis-40 font-bold break-words ${x.feitaEm ? 'line-through decoration-2' : ''}`}>
                    {x.feitaEm && '✓ '}
                    {x.titulo}
                  </span>
                  {!x.feitaEm && (
                    <button type="button" onClick={() => tirar(x)} aria-label={t('rituais.tirarDeHojeNome', { titulo: x.titulo })} className="text-sm font-bold underline decoration-2 underline-offset-4">
                      {t('rituais.tirarDeHoje')}
                    </button>
                  )}
                </div>
                {!x.feitaEm && <EscolhaBloco tarefa={x} />}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('rituais.nenhumaEscolhida')}</p>
        )}
        {!cabe && <p className="font-semibold">{t('rituais.cheio')}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Subtitulo>{t('rituais.paraEscolher')}</Subtitulo>
        {candidatas.length ? (
          <ul className="flex flex-col gap-2">
            {mostradas.map((x, i) => (
              <li key={x.id} className={linha}>
                <span className="min-w-0 flex-1 basis-40 font-semibold break-words">{x.titulo}</span>
                <span className="rounded-full border-2 border-linha/40 px-2 text-xs font-bold">
                  {x.prioridade === 'A' ? (x.dia ? t('rituais.aDeDia', { data: dataCurta(x.dia) }) : t('rituais.aSemDia')) : x.prioridade}
                </span>
                <Botao
                  variante="secundario"
                  tom="bg-manteiga"
                  className="min-h-9 px-3 text-sm"
                  disabled={!cabe}
                  data-candidata
                  onClick={() => porHoje(x, i)}
                  aria-label={t('rituais.paraHojeNome', { titulo: x.titulo })}
                >
                  {t('rituais.paraHoje')}
                </Botao>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('rituais.nadaParaEscolher')}</p>
        )}
        {!todas && candidatas.length > MOSTRAR_CANDIDATAS && (
          <button type="button" onClick={() => setTodas(true)} className={link}>
            {t('rituais.mostrarMais', { count: candidatas.length - MOSTRAR_CANDIDATAS })}
          </button>
        )}
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void acrescentar()
        }}
      >
        <label className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
          <span className="font-bold">{t('rituais.outraCoisa')}</span>
          <input ref={campo} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={120} className="min-h-11 rounded-full border-2 border-linha bg-papel px-4" />
        </label>
        <Botao type="submit" variante="contorno" disabled={!texto.trim()}>
          + {t('rituais.porEmHoje')}
        </Botao>
      </form>
    </div>
  )
}

// ---------- remédios e consultas (manhã) ----------

function LinhaDose({ dose, registro, agora }: { dose: DosePrevista; registro?: Parameters<typeof estadoDose>[1]; agora: Date }) {
  const { t } = useTranslation()
  const estado = estadoDose(dose, registro, agora)
  const responder = async (status: StatusDose) => {
    // a linha fica sem botões (ou some, à noite): o foco vai para a próxima dose sem resposta
    focarDepois([() => document.querySelector('main [data-dose]')])
    await responderDose(dose, status)
    mostrarAviso(status === 'tomei' ? t('remedios.respTomei') : t('remedios.respPulei'), () => desfazerResposta(dose))
  }
  return (
    <li className={linha}>
      <span className="w-14 shrink-0 font-bold tabular-nums">{dose.horario}</span>
      <Adesivo nome="pilula" tamanho={24} />
      <span className="min-w-0 flex-1 basis-32 font-semibold break-words">{dose.remedio.nome}</span>
      {estado === 'agora' ? (
        <span className="flex flex-wrap gap-2">
          <Botao data-dose className="min-h-9 px-3 text-sm" onClick={() => responder('tomei')} aria-label={t('rituais.tomeiNome', { nome: dose.remedio.nome, hora: dose.horario })}>
            ✓ {t('remedios.tomei')}
          </Botao>
          <Botao variante="contorno" className="min-h-9 px-3 text-sm" onClick={() => responder('pulei')} aria-label={t('rituais.puleiNome', { nome: dose.remedio.nome, hora: dose.horario })}>
            {t('remedios.pular')}
          </Botao>
        </span>
      ) : (
        <span className="text-sm font-semibold">
          {estado === 'tomei' ? `✓ ${t('rituais.doseTomada')}` : estado === 'pulei' ? t('rituais.dosePulada') : estado === 'adiada' ? t('rituais.doseAdiada') : t('rituais.doseDepois')}
        </span>
      )}
    </li>
  )
}

export function PassoRemedios({ dia, agora, perfil }: PropsPasso) {
  const { t } = useTranslation()
  const dataCurta = useDataCurta()
  const doses = useDosesDoDia(dia)
  const consultas = useConsultas()
  if (!doses || !consultas) return null
  const comRemedios = perfil.areasAtivas.includes('remedios')
  const comConsultas = perfil.areasAtivas.includes('consultas')
  const conferir = consultasParaConferir(consultas, dia)
  return (
    <div className="flex flex-col gap-5">
      {comRemedios && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.remediosHoje')}</Subtitulo>
          {doses.doses.length ? (
            <ul className="flex flex-col gap-2">
              {doses.doses.map((d) => (
                <LinhaDose key={d.id} dose={d} registro={doses.registros.find((r) => r.id === d.id)} agora={agora} />
              ))}
            </ul>
          ) : (
            <p>{t('rituais.semRemedios')}</p>
          )}
          <Link to="/remedios" className={link}>
            {t('rituais.abrirRemedios')}
          </Link>
        </div>
      )}
      {comConsultas && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.consultasProximas')}</Subtitulo>
          {conferir.proximas.length ? (
            <ul className="flex flex-col gap-2">
              {conferir.proximas.map((c) => (
                <li key={c.id} className={linha}>
                  <span className="shrink-0 font-bold">{c.data === dia ? t('nav.hoje') : dataCurta(c.data!)}</span>
                  {c.hora && <span className="font-bold tabular-nums">{c.hora}</span>}
                  <Adesivo nome="prancheta" tamanho={24} />
                  <span className="min-w-0 flex-1 basis-32 font-semibold break-words">{c.titulo}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('rituais.semConsultas')}</p>
          )}
          {conferir.marcar.map((c) => (
            <p key={c.id} className="rounded-2xl border-2 border-linha bg-azul-nevoa px-3 py-2 font-semibold">
              {t('rituais.horaDeMarcar', { titulo: c.titulo })}
            </p>
          ))}
          <Link to="/consultas" className={link}>
            {t('rituais.abrirConsultas')}
          </Link>
        </div>
      )}
    </div>
  )
}

// ---------- o que deu para fazer (noite) ----------

export function PassoFeito({ dia, agora, perfil }: PropsPasso) {
  const { t } = useTranslation()
  const tarefas = useTarefas()
  const habitos = useHabitosAtivos()
  const doses = useDosesDoDia(dia)
  if (!tarefas || !habitos || !doses) return null
  const doDia = tarefasDoDia(tarefas, dia).sort((x, y) => x.criadaEm.localeCompare(y.criadaEm))
  const habitosHoje = habitosDoDia(habitos.habitos, habitos.registros, dia)
  const semResposta = perfil.areasAtivas.includes('remedios') ? dosesSemResposta(doses.doses, doses.registros, agora) : []
  if (!doDia.length && !habitosHoje.length && !semResposta.length) return <p>{t('rituais.nadaMarcado')}</p>

  return (
    <div className="flex flex-col gap-5">
      {doDia.length > 0 && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.tarefas')}</Subtitulo>
          <ul className="flex flex-col gap-2">
            {doDia.map((x) => (
              <li key={x.id}>
                <label className={`${linha} cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={!!x.feitaEm}
                    onChange={() => (x.feitaEm ? reabrirTarefa(x.id) : concluirTarefa(x.id))}
                    className="h-6 w-6 shrink-0 accent-[var(--chocolate)]"
                  />
                  <span className={`min-w-0 flex-1 font-semibold break-words ${x.feitaEm ? 'line-through decoration-2' : ''}`}>{x.titulo}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {habitosHoje.length > 0 && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.habitos')}</Subtitulo>
          <ul className="flex flex-col gap-2">
            {habitosHoje.map(({ habito, registro }) => (
              <li key={habito.id} className={linha}>
                <Adesivo nome={habito.adesivo} tamanho={26} />
                <span className="min-w-0 flex-1 basis-32 font-semibold break-words">{habito.titulo}</span>
                {registro ? (
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold">✓ {registro.nivel === 'completo' ? t('rituais.habitoFeito') : t('rituais.habitoMinimo')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        focarDepois([() => porRotulo(t('rituais.fizNome', { titulo: habito.titulo }))])
                        void marcarHabito(habito.id, dia, undefined)
                      }}
                      aria-label={t('rituais.desmarcarNome', { titulo: habito.titulo })}
                      className="text-sm font-bold underline decoration-2 underline-offset-4"
                    >
                      {t('academia.desmarcar')}
                    </button>
                  </span>
                ) : (
                  <span className="flex flex-wrap gap-2">
                    <Botao
                      className="min-h-9 px-3 text-sm"
                      onClick={() => {
                        focarDepois([() => porRotulo(t('rituais.desmarcarNome', { titulo: habito.titulo }))])
                        void marcarHabito(habito.id, dia, 'completo')
                      }} aria-label={t('rituais.fizNome', { titulo: habito.titulo })}>
                      ✓ {t('rituais.fiz')}
                    </Botao>
                    {habito.minima && (
                      <Botao
                        variante="secundario"
                        tom="bg-pessego"
                        className="min-h-9 px-3 text-sm"
                        onClick={() => {
                          focarDepois([() => porRotulo(t('rituais.desmarcarNome', { titulo: habito.titulo }))])
                          void marcarHabito(habito.id, dia, 'minimo')
                        }}
                        aria-label={t('rituais.fizMinimoNome', { titulo: habito.titulo })}
                      >
                        {t('rituais.fizMinimo')}
                      </Botao>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {semResposta.length > 0 && (
        <div className="flex flex-col gap-2">
          <Subtitulo>{t('rituais.remediosSemResposta')}</Subtitulo>
          <ul className="flex flex-col gap-2">
            {semResposta.map((d) => (
              <LinhaDose key={d.id} dose={d} agora={agora} registro={doses.registros.find((r) => r.id === d.id)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------- pendências (noite) ----------

export function PassoPendencias({ dia }: PropsPasso) {
  const { t } = useTranslation()
  const dataCurta = useDataCurta()
  const tarefas = useTarefas()
  if (!tarefas) return null
  const pendentes = pendenciasDoDia(tarefas, dia)
  const amanha = somarDias(dia, 1)
  const cabeAmanha = cabeTarefaA(tarefas, amanha)
  if (!pendentes.length) return <p className="text-lg font-semibold">✓ {t('rituais.semPendencias')}</p>

  // a pendência sai da lista: o foco vai para a próxima
  const proxima = (i: number) => [() => document.querySelectorAll('main [data-pendencia]')[i], () => document.querySelectorAll('main [data-pendencia]')[i - 1]]
  async function passar(x: Tarefa, i: number) {
    focarDepois(proxima(i))
    await salvarTarefa(paraODia(x, amanha))
    mostrarAviso(t('rituais.passada', { titulo: x.titulo }), () => salvarTarefa(x))
  }
  async function paraB(x: Tarefa, i: number) {
    focarDepois(proxima(i))
    await salvarTarefa(virarB(x))
    mostrarAviso(t('rituais.virouB', { titulo: x.titulo }), () => salvarTarefa(x))
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {pendentes.map((x, i) => (
          <li key={x.id} className={linha}>
            <span className="min-w-0 flex-1 basis-40">
              <span className="font-semibold break-words">{x.titulo}</span>
              {x.dia !== dia && <span className="block text-sm">{t('rituais.deDia', { data: dataCurta(x.dia!) })}</span>}
            </span>
            <span className="flex flex-wrap gap-2">
              <Botao
                variante="secundario"
                tom="bg-manteiga"
                className="min-h-9 px-3 text-sm"
                disabled={!cabeAmanha}
                onClick={() => passar(x, i)}
                aria-label={t('rituais.amanhaNome', { titulo: x.titulo })}
              >
                {t('rituais.amanha')}
              </Botao>
              <Botao variante="contorno" className="min-h-9 px-3 text-sm" data-pendencia onClick={() => paraB(x, i)} aria-label={t('rituais.virarBNome', { titulo: x.titulo })}>
                {t('tarefas.virarB')}
              </Botao>
            </span>
          </li>
        ))}
      </ul>
      {!cabeAmanha && <p className="font-semibold">{t('rituais.amanhaCheio')}</p>}
    </div>
  )
}

// ---------- caixa de entrada (noite) ----------

export function PassoCaixa({ perfil }: PropsPasso) {
  const { t } = useTranslation()
  const itens = useCaixaAberta()
  if (!itens) return null
  if (!itens.length) {
    return (
      <p className="flex items-center gap-3 text-lg font-semibold">
        <Adesivo nome="sapinho" tamanho={48} />
        {t('caixa.vazia')}
      </p>
    )
  }
  const areasHabito = AREAS_COM_HABITOS.filter((a): a is IdArea => perfil.areasAtivas.includes(a))
  return (
    <div className="flex flex-col gap-2">
      <p className="rotulo" aria-live="polite">
        {t('caixa.contagem', { count: itens.length })}
      </p>
      <ListaCaixa itens={itens} areasHabito={areasHabito} />
    </div>
  )
}

// ---------- amanhã (noite) ----------

export function PassoAmanha({ dia, agora }: PropsPasso) {
  const { t } = useTranslation()
  const amanha = somarDias(dia, 1)
  const agenda = useAgenda(amanha)
  const tarefas = useTarefas()
  const habitos = useHabitosAtivos()
  if (!agenda || !tarefas || !habitos) return null
  const aDeAmanha = escolhidasParaHoje(tarefas, amanha)
  const comBase = habitos.habitos.filter(
    (h) => temPreparo(h) && diaDoPreparo(h, habitos.registros.filter((r) => r.habitoId === h.id), agora) === amanha,
  )
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Subtitulo>{t('rituais.agendaAmanha')}</Subtitulo>
        <ListaAgenda itens={agenda} vazio={t('rituais.semAgendaAmanha')} />
      </div>
      <div className="flex flex-col gap-2">
        <Subtitulo>{t('rituais.aDeAmanha')}</Subtitulo>
        {aDeAmanha.length ? (
          <ul className="flex flex-col gap-2">
            {aDeAmanha.map((x) => (
              <li key={x.id} className={`${linha} font-semibold`}>
                {x.titulo}
                {x.bloco && <span className="text-sm font-normal">· {t(`hoje.blocos.${x.bloco}`)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('rituais.nenhumaAmanha')}</p>
        )}
      </div>
      {comBase.map((h) => (
        <BaseDeLancamento key={h.id} habito={h} registros={habitos.registros.filter((r) => r.habitoId === h.id)} />
      ))}
    </div>
  )
}

// ---------- desacelerar (noite) ----------

function ConteudoDesacelerar({ agora }: { agora: Date }) {
  const { t } = useTranslation()
  const config = useBemEstar()
  if (!config) return null
  return (
    <div className="flex flex-col gap-4">
      <RotinaDesacelerar config={config} noite={noiteDaRotina(agora, diaLocal(agora))} />
      {config.sono?.acordarAs && <p className="font-semibold">{t('rituais.acordarAs', { hora: config.sono.acordarAs })}</p>}
      <Link to="/nao-consigo-dormir" className={link}>
        {t('sono.naoConsigo')}
      </Link>
    </div>
  )
}

export function PassoDesacelerar({ agora }: PropsPasso) {
  return (
    <ProtecaoBemEstar compacto>
      <ConteudoDesacelerar agora={agora} />
    </ProtecaoBemEstar>
  )
}
