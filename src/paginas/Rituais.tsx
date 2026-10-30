// Rituais de 5 minutos: a tela com os dois rituais (o que tem em cada um, a semana em adesivos e os lembretes)
// e o ritual guiado, um passo de cada vez, com o timer de 5 minutos. Sair no meio guarda o passo.

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useOutletContext, useParams } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { Letreiro, TimerVisual } from '../componentes/Enfeites'
import { GradeSemanal, type Dia as DiaGrade } from '../componentes/GradeSemanal'
import type { ContextoMoldura } from '../componentes/Moldura'
import {
  PassoAmanha,
  PassoCaixa,
  PassoCheckin,
  PassoDesacelerar,
  PassoDia,
  PassoFeito,
  PassoPendencias,
  PassoRemedios,
  PassoTarefasA,
  type PropsPasso,
} from '../componentes/PassosRitual'
import { PassoAlarmes, PassoDinheiro, PassoHobbies, PassoPerguntas, PassoProximas, PassoSemana, RespostasAntigas } from '../componentes/PassosRevisao'
import { useBemEstar, type ConfigBemEstar } from '../dados/bemEstar'
import type { Perfil } from '../dados/perfil'
import {
  comecarRitual,
  irParaPasso,
  mudarConfigRituais,
  recomecarTimer,
  refazerRitual,
  terminarRitual,
  useConfigRituais,
  useRevisoes,
  useRitual,
  useRituaisDesde,
} from '../dados/rituais'
import { useAgora } from '../dados/timer'
import { pedirPermissaoAvisos, permissaoAvisos, type PermissaoAvisos } from '../lembretes'
import { diaLocal, somarDias } from '../logica/datas'
import { diasDaSemana } from '../logica/remedios'
import {
  diaDoRitual,
  duracaoDoRitual,
  eDiaDaRevisao,
  idRitual,
  indiceDoPasso,
  passosDoRitual,
  RITUAIS,
  ritualDaHora,
  segundosRestantesRitual,
  TODOS_OS_RITUAIS,
  type ConfigRituais,
  type IdPassoRitual,
  type IdRitual,
  type OpcoesRitual,
  type RegistroRitual,
} from '../logica/rituais'

const TOM: Record<IdRitual, string> = { manha: 'bg-manteiga', noite: 'bg-lavanda', revisao: 'bg-azul-nevoa' }
const ADESIVO: Record<IdRitual, 'sol' | 'lua' | 'calendario'> = { manha: 'sol', noite: 'lua', revisao: 'calendario' }
const COR_TIMER: Record<IdRitual, string> = { manha: 'var(--forte-laranja)', noite: 'var(--forte-ameixa)', revisao: 'var(--forte-piscina)' }

const PASSOS: Record<IdPassoRitual, (p: PropsPasso) => ReactNode> = {
  checkin: PassoCheckin,
  dia: PassoDia,
  tarefasA: PassoTarefasA,
  remedios: PassoRemedios,
  feito: PassoFeito,
  pendencias: PassoPendencias,
  caixa: PassoCaixa,
  amanha: PassoAmanha,
  desacelerar: PassoDesacelerar,
  semana: PassoSemana,
  alarmes: PassoAlarmes,
  hobbies: PassoHobbies,
  dinheiro: PassoDinheiro,
  proximas: PassoProximas,
  perguntas: PassoPerguntas,
}

const botaoLink = 'inline-flex min-h-11 items-center justify-center self-start rounded-full border-2 px-5 font-bold'
const linkSublinhado = 'font-bold underline decoration-2 underline-offset-4'

/** Check-in, desacelerar e hobbies vêm do Bem-estar (aba e ferramenta ligadas); remédios, consultas e dinheiro, das áreas. */
export function opcoesDoRitual(perfil: Perfil, bemEstar: ConfigBemEstar): OpcoesRitual {
  const comBemEstar = perfil.areasAtivas.includes('bemestar')
  return {
    checkin: comBemEstar && bemEstar.ferramentas.includes('checkin'),
    remedios: perfil.areasAtivas.includes('remedios') || perfil.areasAtivas.includes('consultas'),
    desacelerar: comBemEstar && bemEstar.ferramentas.includes('sono'),
    hobbies: comBemEstar && bemEstar.ferramentas.includes('hobbies'),
    dinheiro: perfil.areasAtivas.includes('dinheiro'),
  }
}

function useFrases(): string[] {
  const { t } = useTranslation()
  return [t('rituais.frase1'), t('rituais.frase2'), t('rituais.frase3'), t('rituais.frase4')]
}

/** Folha com a estampa escolhida no alto, como a da tela Hoje. */
function Folha({ children }: { children: ReactNode }) {
  return (
    <header className="relative pt-3">
      <div aria-hidden="true" className="estampa estampa-atual absolute inset-x-0 top-0 h-12 rounded-t-[1.75rem] bg-destaque-claro" />
      <div className="folha-destacavel relative flex flex-col gap-4 rounded-b-[1.75rem] border-x-2 border-b-2 border-linha bg-papel px-5 pb-5 shadow-[3px_3px_0_var(--linha)] sm:px-7">
        {children}
      </div>
    </header>
  )
}

function useHora() {
  const { i18n } = useTranslation()
  return (iso: string) => new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
}

// ---------- tela dos rituais ----------

function CartaoRitual({
  ritual,
  registro,
  passos,
  daHora,
  extra,
}: {
  ritual: IdRitual
  registro?: RegistroRitual
  passos: IdPassoRitual[]
  daHora: boolean
  extra?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const hora = useHora()
  const feito = !!registro?.feitoEm
  const atual = registro ? indiceDoPasso(passos, registro.passo) : -1
  return (
    <section aria-labelledby={`titulo-${ritual}`} className={`cartao flex flex-col gap-4 p-5 ${TOM[ritual]}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Adesivo nome={ADESIVO[ritual]} tamanho={48} />
        <h2 id={`titulo-${ritual}`} className="min-w-0 flex-1 text-2xl font-semibold">
          {t(`rituais.${ritual}`)}
        </h2>
        <span className="rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">
          {ritual === 'revisao' ? t('rituais.vinteMin') : t('rituais.cincoMin')}
        </span>
      </div>
      {daHora && !feito && <p className="rotulo">{t('rituais.daHora')}</p>}
      {extra}
      <ol className="flex flex-col gap-1.5">
        {passos.map((p, i) => (
          <li key={p} className="flex items-center gap-2">
            <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-linha text-sm font-bold ${feito || i < atual ? 'bg-menta' : 'bg-papel'}`}>
              {feito || i < atual ? '✓' : i + 1}
            </span>
            {t(`rituais.passos.${p}`)}
          </li>
        ))}
      </ol>
      {feito ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-semibold">
            ✓{' '}
            {ritual === 'revisao'
              ? t('rituais.feitaEm', {
                  data: new Date(registro!.feitoEm!).toLocaleDateString(i18n.language, { weekday: 'long' }),
                  hora: hora(registro!.feitoEm!),
                })
              : t('rituais.feitoAs', { hora: hora(registro!.feitoEm!) })}
          </p>
          <Link to={`/rituais/${ritual}`} className={linkSublinhado}>
            {t('rituais.abrirDeNovo')}
          </Link>
        </div>
      ) : (
        <Link to={`/rituais/${ritual}`} className={`${botaoLink} border-botao bg-botao text-botao-texto`}>
          {registro ? t('rituais.continuar', { passo: atual + 1, total: passos.length }) : t('rituais.comecar')}
        </Link>
      )}
    </section>
  )
}

function SemanaRitual({ ritual, registros, hoje }: { ritual: IdRitual; registros: RegistroRitual[]; hoje: string }) {
  const { t, i18n } = useTranslation()
  const dias: DiaGrade[] = diasDaSemana(hoje).map((dia) => {
    const data = new Date(`${dia}T12:00:00`)
    const feito = registros.some((r) => r.id === idRitual(ritual, dia) && r.feitoEm)
    return {
      rotulo: data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').toUpperCase(),
      nomeCompleto: data.toLocaleDateString(i18n.language, { weekday: 'long' }),
      numero: data.getDate(),
      estado: feito ? 'feito' : dia > hoje ? 'futuro' : 'vazio',
      hoje: dia === hoje,
    }
  })
  return <GradeSemanal titulo={t(ritual === 'manha' ? 'rituais.semanaManha' : 'rituais.semanaNoite')} adesivo={ADESIVO[ritual]} tom="bg-papel" dias={dias} />
}

function LembretesRituais({ config }: { config: ConfigRituais }) {
  const { t } = useTranslation()
  const [permissao, setPermissao] = useState<PermissaoAvisos>(permissaoAvisos)
  const mudar = (ritual: IdRitual, m: Partial<ConfigRituais['lembretes'][IdRitual]>) =>
    mudarConfigRituais((c) => ({ lembretes: { ...c.lembretes, [ritual]: { ...c.lembretes[ritual], ...m } } }))
  const { i18n } = useTranslation()
  const algumLigado = TODOS_OS_RITUAIS.some((r) => config.lembretes[r].ativo)
  // domingo (0) a sábado (6), no idioma da pessoa (4 de outubro de 2026 foi um domingo)
  const nomeDia = (d: number) => new Date(2026, 9, 4 + d, 12).toLocaleDateString(i18n.language, { weekday: 'long' })
  return (
    <section aria-labelledby="titulo-lembretes-rituais" className="cartao flex flex-col gap-4 bg-papel p-5">
      <h2 id="titulo-lembretes-rituais" className="text-xl font-semibold">
        {t('rituais.lembretes')}
      </h2>
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {TODOS_OS_RITUAIS.map((r) => {
          const l = config.lembretes[r]
          return (
            <fieldset key={r} className="flex flex-wrap items-center gap-3">
              <legend className="mb-1.5 font-bold">{t(`rituais.${r}`)}</legend>
              {l.diaSemana !== undefined && (
                <label className="flex items-center gap-2">
                  <span className="so-leitor">{t('rituais.diaDaRevisao')}</span>
                  <select
                    value={l.diaSemana}
                    onChange={(e) => {
                      const diaSemana = Number(e.target.value)
                      void mudar(r, { diaSemana })
                    }}
                    className="min-h-11 rounded-full border-2 border-linha bg-papel px-4"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>
                        {nomeDia(d)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" checked={l.ativo} onChange={(e) => mudar(r, { ativo: e.target.checked })} className="h-5 w-5 accent-[var(--chocolate)]" />
                {t('rituais.avisarAs')}
              </label>
              <input
                type="time"
                value={l.hora}
                disabled={!l.ativo}
                aria-label={t('rituais.horario', { ritual: t(`rituais.${r}`).toLowerCase() })}
                onChange={(e) => {
                  // lido agora: a gravação é assíncrona e o campo volta ao valor guardado antes dela acabar
                  const hora = e.target.value
                  if (hora) void mudar(r, { hora })
                }}
                className="min-h-11 rounded-full border-2 border-linha bg-papel px-4 tabular-nums"
              />
            </fieldset>
          )
        })}
      </div>
      <p className="text-sm">{t('rituais.lembretesDica')}</p>
      {algumLigado && (
        <div className="flex flex-col gap-1 text-sm">
          {permissao === 'default' && (
            <Botao variante="contorno" className="self-start" onClick={async () => setPermissao(await pedirPermissaoAvisos())}>
              {t('remedios.ativarAvisos')}
            </Botao>
          )}
          {permissao === 'granted' && <p className="font-semibold">✓ {t('remedios.avisosAtivos')}</p>}
          <p className="text-tinta-suave">{t('remedios.avisosAberto')}</p>
        </div>
      )}
    </section>
  )
}

function HistoricoRevisoes() {
  const { t, i18n } = useTranslation()
  const revisoes = useRevisoes()
  if (!revisoes) return null
  const comRespostas = revisoes
    .filter((r) => r.feitoEm && [r.respostas?.funcionou, r.respostas?.travou, r.respostas?.ajusto].some((v) => v?.trim()))
    .sort((a, b) => b.dia.localeCompare(a.dia))
  if (!comRespostas.length) return null
  return (
    <section aria-labelledby="titulo-historico-revisoes" className="cartao flex flex-col gap-3 bg-papel p-5">
      <h2 id="titulo-historico-revisoes" className="text-xl font-semibold">
        {t('rituais.revisoesAnteriores', { count: comRespostas.length })}
      </h2>
      <ul className="flex flex-col gap-2">
        {comRespostas.map((r) => (
          <li key={r.id}>
            <details className="rounded-2xl border-2 border-linha/40 p-3">
              <summary className="cursor-pointer font-bold">
                {t('rituais.revisaoDe', { data: new Date(`${r.dia}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' }) })}
              </summary>
              <div className="mt-2">
                <RespostasAntigas revisao={r} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Rituais() {
  const { t, i18n } = useTranslation()
  const { perfil } = useOutletContext<ContextoMoldura>()
  const agora = useAgora(60_000)
  const hoje = diaLocal(agora)
  const semana = diasDaSemana(hoje)
  const registros = useRituaisDesde(somarDias(semana[0], -1))
  const bemEstar = useBemEstar()
  const config = useConfigRituais()
  const frases = useFrases()
  if (!registros || !bemEstar || !config) return null
  const opcoes = opcoesDoRitual(perfil, bemEstar)
  const daHora = ritualDaHora(agora)
  return (
    <div className="flex flex-col gap-6">
      <Folha>
        <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="lua" tamanho={56} />
          {t('nav.rituais')}
        </h1>
        <p className="max-w-prose text-lg">{t('rituais.intro')}</p>
      </Folha>
      <Letreiro frases={frases} />
      <div className="grid gap-4 lg:grid-cols-2">
        {RITUAIS.map((r) => (
          <CartaoRitual
            key={r}
            ritual={r}
            registro={registros.find((x) => x.id === idRitual(r, diaDoRitual(r, agora)))}
            passos={passosDoRitual(r, opcoes)}
            daHora={r === daHora}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {RITUAIS.map((r) => (
          <SemanaRitual key={r} ritual={r} registros={registros} hoje={hoje} />
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <CartaoRitual
          ritual="revisao"
          registro={registros.find((x) => x.id === idRitual('revisao', diaDoRitual('revisao', agora)))}
          passos={passosDoRitual('revisao', opcoes)}
          daHora={eDiaDaRevisao(config.lembretes.revisao, agora)}
          extra={
            config.lembretes.revisao.ativo && (
              <p className="text-sm font-semibold">
                {t('rituais.proximaRevisao', {
                  dia: new Date(2026, 9, 4 + (config.lembretes.revisao.diaSemana ?? 0), 12).toLocaleDateString(i18n.language, { weekday: 'long' }),
                  hora: config.lembretes.revisao.hora,
                })}
              </p>
            )
          }
        />
        <HistoricoRevisoes />
      </div>
      <LembretesRituais config={config} />
    </div>
  )
}

// ---------- ritual guiado ----------

function TimerRitual({ ritual, registro }: { ritual: IdRitual; registro: RegistroRitual }) {
  const { t } = useTranslation()
  const agora = useAgora(1000)
  const segundos = segundosRestantesRitual(registro, agora)
  return (
    <div className="flex items-center gap-3">
      <TimerVisual
        fracaoRestante={segundos / (duracaoDoRitual(ritual) * 60)}
        rotulo={segundos > 0 ? t('rituais.faltam', { count: Math.ceil(segundos / 60) }) : t('rituais.acabou')}
        cor={COR_TIMER[ritual]}
        tamanho={72}
      />
      {segundos === 0 && (
        <div className="flex max-w-48 flex-col gap-1">
          <p className="text-sm" role="status">
            {t('rituais.acabouDica')}
          </p>
          <button type="button" onClick={() => recomecarTimer(registro.id)} className={`${linkSublinhado} self-start text-sm`}>
            {t('rituais.maisTempo')}
          </button>
        </div>
      )}
    </div>
  )
}

function Fim({ ritual, registro, primeiro, titulo }: { ritual: IdRitual; registro: RegistroRitual; primeiro: IdPassoRitual; titulo: RefObject<HTMLHeadingElement | null> }) {
  const { t } = useTranslation()
  const hora = useHora()
  const frases = useFrases()
  return (
    <>
      <section aria-labelledby="titulo-fim" className={`cartao flex flex-col items-center gap-4 p-6 text-center sm:p-8 ${TOM[ritual]}`}>
        <span className="colando">
          <Adesivo nome={ADESIVO[ritual]} tamanho={96} />
        </span>
        <h2 id="titulo-fim" ref={titulo} tabIndex={-1} className="text-3xl font-semibold outline-none">
          {t(ritual === 'manha' ? 'rituais.prontoManha' : ritual === 'revisao' ? 'rituais.prontoRevisao' : 'rituais.prontoNoite')}
        </h2>
        <p>{t('rituais.feitoAsHora', { hora: hora(registro.feitoEm!) })}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {ritual !== 'noite' && (
            <Link to="/hoje" className={`${botaoLink} border-botao bg-botao text-botao-texto`}>
              {t('rituais.irParaHoje')}
            </Link>
          )}
          <Link to="/rituais" className={`${botaoLink} border-linha bg-papel`}>
            {t('rituais.voltarRituais')}
          </Link>
          <Botao variante="contorno" onClick={() => refazerRitual(registro.id, primeiro)}>
            {t('rituais.fazerDeNovo')}
          </Botao>
        </div>
      </section>
      <Letreiro frases={frases} />
    </>
  )
}

function RitualGuiado({ ritual }: { ritual: IdRitual }) {
  const { t } = useTranslation()
  const { perfil } = useOutletContext<ContextoMoldura>()
  const agora = useAgora(30_000)
  const dia = diaDoRitual(ritual, agora)
  const bemEstar = useBemEstar()
  const registro = useRitual(ritual, dia)
  const titulo = useRef<HTMLHeadingElement>(null)
  const passos = bemEstar ? passosDoRitual(ritual, opcoesDoRitual(perfil, bemEstar)) : undefined
  const primeiro = passos?.[0]

  // abrir o ritual já é começar (ou continuar de onde parou)
  useEffect(() => {
    if (registro === null && primeiro) void comecarRitual(ritual, dia, primeiro)
  }, [registro, primeiro, ritual, dia])

  const i = registro && passos ? indiceDoPasso(passos, registro.passo) : 0
  const tela = registro?.feitoEm ? 'fim' : passos?.[i]
  // ao trocar de passo, o foco vai para o título do passo (na primeira vez, a moldura foca o título da tela)
  const telaAnterior = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!tela) return
    if (telaAnterior.current && telaAnterior.current !== tela) titulo.current?.focus()
    telaAnterior.current = tela
  }, [tela])

  if (!registro || !passos || !tela) return null
  const passo = passos[i]
  const ultimo = i === passos.length - 1
  const Conteudo = PASSOS[passo]

  return (
    <div className="flex flex-col gap-6">
      <Folha>
        <div className="flex flex-wrap items-center gap-4">
          <h1 tabIndex={-1} className="flex min-w-0 flex-1 basis-60 items-center gap-3 text-3xl font-semibold outline-none sm:text-4xl">
            <Adesivo nome={ADESIVO[ritual]} tamanho={52} />
            {t(`rituais.${ritual}`)}
          </h1>
          {tela !== 'fim' && <TimerRitual ritual={ritual} registro={registro} />}
        </div>
        {tela !== 'fim' && (
          <ol aria-label={t('rituais.passo', { n: i + 1, total: passos.length })} className="flex flex-wrap gap-2">
            {passos.map((p, j) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => irParaPasso(registro.id, p)}
                  aria-current={j === i ? 'step' : undefined}
                  aria-label={t('rituais.irParaPasso', { n: j + 1, nome: t(`rituais.passos.${p}`) })}
                  className={`flex min-h-10 items-center gap-2 rounded-full border-2 border-linha px-3 text-sm font-bold ${
                    j === i ? 'bg-botao text-botao-texto' : j < i ? 'bg-menta' : 'bg-papel'
                  }`}
                >
                  <span aria-hidden="true">{j < i ? '✓' : j + 1}</span>
                  <span aria-hidden="true" className={j === i ? '' : 'hidden lg:inline'}>
                    {t(`rituais.passos.${p}`)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Folha>

      {tela === 'fim' ? (
        <Fim ritual={ritual} registro={registro} primeiro={passos[0]} titulo={titulo} />
      ) : (
        <>
          <section aria-labelledby="titulo-passo" className="cartao flex flex-col gap-5 bg-papel p-4 sm:p-6">
            <div>
              <p className="rotulo">{t('rituais.passo', { n: i + 1, total: passos.length })}</p>
              <h2 id="titulo-passo" ref={titulo} tabIndex={-1} className="text-2xl font-semibold outline-none sm:text-3xl">
                {t(`rituais.titulos.${passo}`)}
              </h2>
              <p className="mt-1 max-w-prose">{t(`rituais.dicas.${passo}`)}</p>
            </div>
            <Conteudo dia={dia} agora={agora} perfil={perfil} registro={registro} />
          </section>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/rituais" className={linkSublinhado}>
              {t('rituais.sair')}
            </Link>
            <span className="flex-1" />
            {i > 0 && (
              <Botao variante="contorno" onClick={() => irParaPasso(registro.id, passos[i - 1])}>
                ← {t('rituais.voltar')}
              </Botao>
            )}
            <Botao grande onClick={() => (ultimo ? terminarRitual(registro.id) : irParaPasso(registro.id, passos[i + 1]))}>
              {ultimo ? `✓ ${t('rituais.terminar')}` : `${t('rituais.proximo')} →`}
            </Botao>
          </div>
        </>
      )}
    </div>
  )
}

export function Ritual() {
  const { ritual } = useParams()
  if (ritual !== 'manha' && ritual !== 'noite' && ritual !== 'revisao') return <Navigate to="/rituais" replace />
  return <RitualGuiado key={ritual} ritual={ritual} />
}
