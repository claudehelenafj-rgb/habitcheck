// Passos da revisão semanal: a semana (só o que foi feito), os avisos sem resposta (mudar o horário ou desligar),
// os hobbies, 5 minutos de dinheiro, as próximas 2 semanas e as três perguntas.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { mudarConfigAlimentacao, useConfigAlimentacao, useDiasAlimentacao } from '../dados/alimentacao'
import { useAvisosTocados, useConsultas } from '../dados/consultas'
import { useCofrinhos, useContas, useContasAtivas, useDepositos, useGastos, usePotes } from '../dados/dinheiro'
import { useEventos } from '../dados/eventos'
import { useAvaliacoes } from '../dados/faculdade'
import { salvarHabito, useHabitosAtivos } from '../dados/habitos'
import { salvarRemedio, useRegistrosDesde, useRemedios } from '../dados/remedios'
import { mudarConfigRituais, mudarRespostas, useConfigRituais, useRevisoes, useRituaisDesde } from '../dados/rituais'
import { useTarefas } from '../dados/tarefas'
import { useAgora } from '../dados/timer'
import { ContasAPagar } from '../paginas/Dinheiro'
import { diaLocal, type Dia } from '../logica/datas'
import { diaDoPlano, faseDoDia } from '../logica/planoInicio'
import { diasDaSemana } from '../logica/remedios'
import { ajusteAnterior, avisosSemResposta, proximosDias, resumoDaSemana, ultimos7Dias, type AvisoIgnorado } from '../logica/revisao'
import { agendaDoDia, DURACAO_DINHEIRO_MIN, idRitual, type RegistroRitual, type RespostaObjetivo, type RespostasRevisao } from '../logica/rituais'
import { arquivarObjetivo, useObjetivos } from '../dados/objetivos'
import { objetivosAtivos } from '../logica/objetivos'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { Cofrinhos } from './DesejosECofrinho'
import { TimerVisual } from './Enfeites'
import { Hobbies } from './Hobbies'
import type { PropsPasso } from './PassosRitual'
import { PotesDaSemana } from './Potes'
import { ProtecaoBemEstar } from './ProtecaoBemEstar'
import { nomeRefeicao } from './Refeicoes'

const linha = 'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-linha/40 bg-papel px-3 py-2'
const link = 'self-start font-bold underline decoration-2 underline-offset-4'

function Subtitulo({ children }: { children: string }) {
  return <h3 className="text-lg font-bold">{children}</h3>
}

function useDataCurta() {
  const { i18n } = useTranslation()
  return (dia: Dia) =>
    new Date(`${dia}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}

// ---------- a semana ----------

export function PassoSemana({ agora }: PropsPasso) {
  const { t } = useTranslation()
  const dias = ultimos7Dias(diaLocal(agora))
  const tarefas = useTarefas()
  const habitos = useHabitosAtivos()
  const rituais = useRituaisDesde(dias[0])
  if (!tarefas || !habitos || !rituais) return null
  const r = resumoDaSemana({ tarefas, habitos: habitos.habitos, registrosHabito: habitos.registros, rituais }, dias)
  const quieta = !r.tarefasFeitas.length && !r.habitos.some((h) => h.vezes) && !r.rituais.manha && !r.rituais.noite
  return (
    <div className="flex flex-col gap-5">
      {quieta && <p className="text-lg">{t('rituais.semanaQuieta')}</p>}
      <div className="flex flex-col gap-2">
        <Subtitulo>{t('rituais.tarefasFeitas', { count: r.tarefasFeitas.length })}</Subtitulo>
        {r.tarefasFeitas.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {r.tarefasFeitas.map((x) => (
              <li key={x.id} className="flex items-center gap-1.5 rounded-full border-2 border-linha/50 bg-menta py-1 pr-3 pl-1.5 text-sm font-semibold">
                <span aria-hidden="true">✓</span>
                {x.titulo}
              </li>
            ))}
          </ul>
        )}
      </div>
      {r.habitos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {r.habitos.map(({ habito, vezes }) => (
            <li key={habito.id} className={linha}>
              <span className="flex shrink-0 gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.max(vezes, 1) }, (_, i) => (
                  <span key={i} className={vezes ? '' : 'opacity-30'}>
                    <Adesivo nome={habito.adesivo} tamanho={22} />
                  </span>
                ))}
              </span>
              <span className="font-semibold">{t('rituais.habitosSemana', { titulo: habito.titulo, vezes, meta: habito.meta })}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="font-semibold">
        <Adesivo nome="sol" tamanho={22} /> {t('rituais.rituaisSemana', { manhas: r.rituais.manha, noites: r.rituais.noite })}
      </p>
    </div>
  )
}

// ---------- avisos sem resposta ----------

/** Um aviso sem resposta, com o que dá para fazer: mudar o horário, desligar (ou tirar o horário do remédio). */
type Ajuste = {
  nome: string
  hora?: string
  mudarHora: (hora: string) => Promise<unknown>
  /** desligar o aviso (ou tirar o horário do remédio) */
  desligar?: () => Promise<unknown>
  desligarRotulo: 'desligarAviso' | 'tirarHorario'
  desfazer: () => Promise<unknown>
}

function LinhaAviso({ aviso, ajuste, aoResolver }: { aviso: AvisoIgnorado; ajuste: Ajuste; aoResolver: () => void }) {
  const { t } = useTranslation()
  const [mudando, setMudando] = useState(false)
  const [hora, setHora] = useState(ajuste.hora ?? '')
  return (
    <li className={`${linha} flex-col items-stretch`}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-bold">{ajuste.nome}</span>
        <span className="text-sm">{t('rituais.semResposta', { count: aviso.vezes })}</span>
      </p>
      {mudando ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!hora) return
            await ajuste.mudarHora(hora)
            mostrarAviso(t('rituais.horarioMudado', { nome: ajuste.nome }), ajuste.desfazer)
            aoResolver()
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">{t('rituais.novoHorario', { nome: ajuste.nome })}</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="min-h-11 rounded-full border-2 border-linha bg-papel px-4 tabular-nums" />
          </label>
          <Botao type="submit" disabled={!hora}>
            {t('rituais.salvarHorario')}
          </Botao>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" tom="bg-manteiga" className="min-h-10 px-4 text-sm" onClick={() => setMudando(true)} aria-label={t('rituais.mudarHorarioNome', { nome: ajuste.nome })}>
            {t('rituais.mudarHorario')}
          </Botao>
          {ajuste.desligar && (
            <Botao
              variante="contorno"
              className="min-h-10 px-4 text-sm"
              aria-label={t(`rituais.${ajuste.desligarRotulo}Nome`, { nome: ajuste.nome })}
              onClick={async () => {
                await ajuste.desligar!()
                mostrarAviso(t(ajuste.desligarRotulo === 'tirarHorario' ? 'rituais.horarioTirado' : 'rituais.avisoDesligado', { nome: ajuste.nome }), ajuste.desfazer)
                aoResolver()
              }}
            >
              {t(`rituais.${ajuste.desligarRotulo}`)}
            </Botao>
          )}
          <button type="button" onClick={aoResolver} aria-label={t('rituais.deixarNome', { nome: ajuste.nome })} className="text-sm font-bold underline decoration-2 underline-offset-4">
            {t('rituais.deixar')}
          </button>
        </div>
      )}
    </li>
  )
}

export function PassoAlarmes({ agora, perfil }: PropsPasso) {
  const { t } = useTranslation()
  const dias = ultimos7Dias(diaLocal(agora))
  const doses = useRegistrosDesde(dias[0])
  const remedios = useRemedios()
  const habitos = useHabitosAtivos()
  const comida = useConfigAlimentacao()
  const diasComida = useDiasAlimentacao(dias)
  const rituais = useRituaisDesde(dias[0])
  const configRituais = useConfigRituais()
  const avisados = useAvisosTocados()
  const [resolvidos, setResolvidos] = useState<string[]>([])
  if (!doses || !remedios || !habitos || !comida || !diasComida || !rituais || !configRituais || !avisados) return null

  const lista = avisosSemResposta(perfil.areasAtivas.includes('remedios') ? doses : [], avisados, dias, {
    habito: (id, dia) => habitos.registros.some((r) => r.habitoId === id && r.dia === dia),
    refeicao: (id, dia) => !!diasComida.find((d) => d.dia === dia)?.refeicoes[id],
    ritual: (ritual, dia) => rituais.some((r) => r.id === idRitual(ritual, dia) && r.feitoEm),
  }).filter((a) => !resolvidos.includes(a.chave))

  const ajusteDe = (a: AvisoIgnorado): Ajuste | undefined => {
    if (a.tipo === 'remedio') {
      const r = remedios.find((x) => x.id === a.remedioId)
      if (!r || !r.horarios.includes(a.horario)) return undefined
      return {
        nome: t('rituais.remedioHora', { nome: r.nome, hora: a.horario }),
        hora: a.horario,
        mudarHora: (hora) => salvarRemedio({ ...r, horarios: [...new Set(r.horarios.map((h) => (h === a.horario ? hora : h)))].sort() }),
        // tirar o único horário deixaria o remédio sem dose: aí só dá para mudar
        desligar: r.horarios.length > 1 ? () => salvarRemedio({ ...r, horarios: r.horarios.filter((h) => h !== a.horario) }) : undefined,
        desligarRotulo: 'tirarHorario',
        desfazer: () => salvarRemedio(r),
      }
    }
    if (a.tipo === 'habito') {
      const h = habitos.habitos.find((x) => x.id === a.habitoId)
      if (!h?.lembrete) return undefined
      return {
        nome: h.titulo,
        hora: h.lembrete,
        mudarHora: (hora) => salvarHabito({ ...h, lembrete: hora }),
        desligar: () => salvarHabito({ ...h, lembrete: undefined }),
        desligarRotulo: 'desligarAviso',
        desfazer: () => salvarHabito(h),
      }
    }
    if (a.tipo === 'refeicao') {
      const r = comida.refeicoes.find((x) => x.id === a.refeicao)
      if (!r?.lembrar) return undefined
      const mudar = (m: Partial<typeof r>) => mudarConfigAlimentacao((c) => ({ refeicoes: c.refeicoes.map((x) => (x.id === r.id ? { ...x, ...m } : x)) }))
      return {
        nome: nomeRefeicao(t, r),
        hora: r.hora,
        mudarHora: (hora) => mudar({ hora }),
        desligar: () => mudar({ lembrar: false }),
        desligarRotulo: 'desligarAviso',
        desfazer: () => mudar({ hora: r.hora, lembrar: r.lembrar }),
      }
    }
    const l = configRituais.lembretes[a.ritual]
    if (!l.ativo) return undefined
    const mudar = (m: Partial<typeof l>) => mudarConfigRituais((c) => ({ lembretes: { ...c.lembretes, [a.ritual]: { ...c.lembretes[a.ritual], ...m } } }))
    return {
      nome: t(`rituais.${a.ritual}`),
      hora: l.hora,
      mudarHora: (hora) => mudar({ hora }),
      desligar: () => mudar({ ativo: false }),
      desligarRotulo: 'desligarAviso',
      desfazer: () => mudar(l),
    }
  }
  const comAjuste = lista.map((a) => ({ a, ajuste: ajusteDe(a) })).filter((x): x is { a: AvisoIgnorado; ajuste: Ajuste } => !!x.ajuste)

  if (!comAjuste.length) return <p className="text-lg font-semibold">✓ {t('rituais.semAlarmes')}</p>
  return (
    <ul className="flex flex-col gap-2">
      {comAjuste.map(({ a, ajuste }) => (
        <LinhaAviso key={a.chave} aviso={a} ajuste={ajuste} aoResolver={() => setResolvidos((r) => [...r, a.chave])} />
      ))}
    </ul>
  )
}

// ---------- hobbies ----------

export function PassoHobbies() {
  return (
    <ProtecaoBemEstar compacto>
      <Hobbies compacto />
    </ProtecaoBemEstar>
  )
}

// ---------- 5 minutos de dinheiro ----------

function TimerDinheiro({ desde }: { desde?: string }) {
  const { t } = useTranslation()
  const agora = useAgora(1000)
  if (!desde) return null
  const segundos = Math.max(0, Math.ceil(DURACAO_DINHEIRO_MIN * 60 - (agora.getTime() - new Date(desde).getTime()) / 1000))
  return (
    <TimerVisual
      fracaoRestante={segundos / (DURACAO_DINHEIRO_MIN * 60)}
      rotulo={segundos > 0 ? t('rituais.faltam', { count: Math.ceil(segundos / 60) }) : t('rituais.acabou')}
      cor="var(--forte-piscina)"
      tamanho={56}
    />
  )
}

export function PassoDinheiro({ agora, registro }: PropsPasso) {
  const hoje = diaLocal(agora)
  const contas = useContas()
  const potes = usePotes()
  const gastos = useGastos()
  const cofrinhos = useCofrinhos()
  const depositos = useDepositos()
  if (!contas || !potes || !gastos || !cofrinhos || !depositos) return null
  return (
    <div className="flex flex-col gap-5">
      <div className="self-start">
        <TimerDinheiro desde={registro?.passoDesde} />
      </div>
      <ContasAPagar contas={contas} hoje={hoje} />
      <PotesDaSemana potes={potes} gastos={gastos} semana={diasDaSemana(hoje)} />
      <Cofrinhos cofrinhos={cofrinhos} depositos={depositos} hoje={hoje} />
    </div>
  )
}

// ---------- as próximas 2 semanas ----------

export function PassoProximas({ agora }: PropsPasso) {
  const { t } = useTranslation()
  const dataCurta = useDataCurta()
  const dias = proximosDias(diaLocal(agora))
  const consultas = useConsultas()
  const eventos = useEventos()
  const avaliacoes = useAvaliacoes()
  const contas = useContasAtivas()
  const tarefas = useTarefas()
  if (!consultas || !eventos || !avaliacoes || contas === undefined || !tarefas) return null
  const porDia = dias
    .map((dia) => ({
      dia,
      agenda: agendaDoDia({ consultas, eventos, avaliacoes, contas: contas ?? [] }, dia).filter((x) => x.tipo !== 'conta' || x.estado === 'hoje'),
      tarefas: tarefas.filter((x) => x.prioridade === 'A' && x.dia === dia && !x.feitaEm),
    }))
    .filter((d) => d.agenda.length || d.tarefas.length)
  return (
    <div className="flex flex-col gap-4">
      {porDia.length ? (
        <ol className="flex flex-col gap-3">
          {porDia.map(({ dia, agenda, tarefas: doDia }) => (
            <li key={dia} className="flex flex-col gap-1.5">
              <p className="rotulo">{dataCurta(dia)}</p>
              <ul className="flex flex-col gap-1.5">
                {agenda.map((item) => (
                  <li key={`${item.tipo}|${item.id}`} className={linha}>
                    <span className="w-12 shrink-0 font-bold tabular-nums">{item.hora ?? ''}</span>
                    <Adesivo nome={item.tipo === 'consulta' ? 'prancheta' : item.tipo === 'avaliacao' ? 'livro' : item.tipo === 'conta' ? 'cofrinho' : 'calendario'} tamanho={22} />
                    <span className="min-w-0 flex-1 font-semibold break-words">{item.titulo}</span>
                  </li>
                ))}
                {doDia.map((x) => (
                  <li key={x.id} className={linha}>
                    <span className="w-12 shrink-0 text-xs font-bold">{t('rituais.tarefaA')}</span>
                    <Adesivo nome="lista" tamanho={22} />
                    <span className="min-w-0 flex-1 font-semibold break-words">{x.titulo}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p>{t('rituais.semProximas')}</p>
      )}
      <Link to="/calendario" className={link}>
        {t('rituais.abrirCalendario')}
      </Link>
    </div>
  )
}

// ---------- as três perguntas ----------

const PERGUNTAS: Array<'funcionou' | 'travou' | 'ajusto'> = ['funcionou', 'travou', 'ajusto']

/** Para cada objetivo: "isso ainda é importante pra mim?" (sim, quero mudar, deixar de lado). */
function AindaImportante({ registro }: { registro: RegistroRitual }) {
  const { t } = useTranslation()
  const objetivos = useObjetivos()
  if (!objetivos) return null
  const respostas = registro.respostas?.objetivos ?? {}
  // os deixados de lado nesta revisão continuam aqui, com a resposta, até ela acabar
  const lista = objetivosAtivos(objetivos.filter((o) => !o.arquivadoEm || respostas[o.id] === 'deLado').map((o) => ({ ...o, arquivadoEm: undefined })))
  if (!lista.length) return null
  const responder = (id: string, r: RespostaObjetivo) => mudarRespostas(registro.id, { objetivos: { ...respostas, [id]: r } })
  const chip = (marcado: boolean) => `min-h-10 rounded-full border-2 border-linha px-4 text-sm font-bold ${marcado ? 'bg-botao text-botao-texto' : 'bg-papel'}`
  return (
    <section aria-labelledby="titulo-ainda-importante" className="flex flex-col gap-3">
      <h3 id="titulo-ainda-importante" className="font-destaque text-2xl italic">
        {t('objetivos.aindaImportante')}
      </h3>
      <ul className="flex flex-col gap-2">
        {lista.map((o) => {
          const r = respostas[o.id]
          return (
            <li key={o.id} className={`${linha} flex-col items-stretch`}>
              <p>
                <span className="font-bold">{o.titulo}</span>
                {o.porque && <span className="block text-sm italic">{o.porque}</span>}
              </p>
              <div role="group" aria-label={`${t('objetivos.aindaImportante')} ${o.titulo}`} className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={r === 'sim'} onClick={() => responder(o.id, 'sim')} className={chip(r === 'sim')}>
                  {t('objetivos.sim')}
                </button>
                <button type="button" aria-pressed={r === 'mudar'} onClick={() => responder(o.id, 'mudar')} className={chip(r === 'mudar')}>
                  {t('objetivos.queroMudar')}
                </button>
                <button
                  type="button"
                  aria-pressed={r === 'deLado'}
                  onClick={async () => {
                    await responder(o.id, 'deLado')
                    await arquivarObjetivo(o.id, true)
                    mostrarAviso(t('objetivos.deixado', { titulo: o.titulo }), async () => {
                      await arquivarObjetivo(o.id, false)
                      await mudarRespostas(registro.id, { objetivos: { ...respostas, [o.id]: 'sim' } })
                    })
                  }}
                  className={chip(r === 'deLado')}
                >
                  {t('objetivos.deixarDeLado')}
                </button>
              </div>
              {r && (
                <p className="text-sm" role="status">
                  {r === 'sim' ? t('objetivos.respostaSim') : r === 'deLado' ? t('objetivos.respostaDeLado') : t('objetivos.respostaMudar')}
                  {r === 'mudar' && (
                    <>
                      {' '}
                      <Link to={`/objetivos#objetivo-${o.id}`} className="font-bold underline decoration-2 underline-offset-4">
                        {t('objetivos.abrir')}
                      </Link>
                    </>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function PassoPerguntas({ agora, perfil, registro }: PropsPasso) {
  const { t, i18n } = useTranslation()
  const revisoes = useRevisoes()
  const [respostas, setRespostas] = useState<RespostasRevisao>(() => registro?.respostas ?? {})
  if (!registro || !revisoes) return null
  const anterior = ajusteAnterior(revisoes, registro.id)
  const dia14 = faseDoDia(diaDoPlano(perfil.inicioPlano, diaLocal(agora))) === 'revisao2'
  const data = (dia: Dia) => new Date(`${dia}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })
  return (
    <div className="flex flex-col gap-4">
      {anterior && (
        <p className="rounded-2xl border-2 border-linha/50 bg-azul-nevoa/60 px-4 py-3">{t('rituais.combinouAntes', { data: data(anterior.dia), texto: anterior.ajusto })}</p>
      )}
      {PERGUNTAS.map((p) => (
        <label key={p} className="flex flex-col gap-1">
          <span className="font-destaque text-2xl italic">{t(`rituais.${p}`)}</span>
          <textarea
            value={respostas[p] ?? ''}
            rows={3}
            maxLength={600}
            onChange={(e) => {
              // guarda já: sair no meio não perde o que foi escrito
              const texto = e.target.value
              setRespostas((r) => ({ ...r, [p]: texto }))
              void mudarRespostas(registro.id, { [p]: texto })
            }}
            className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
          />
        </label>
      ))}
      <p className="text-sm">{t('rituais.salvaSozinha')}</p>
      <AindaImportante registro={registro} />
      {dia14 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
          {t('rituais.dia14')}
          <Link to="/ajustes#areas" className={link}>
            {t('plano.ativarArea')}
          </Link>
        </p>
      )}
    </div>
  )
}

/** Uma revisão antiga, para o histórico (o que a pessoa respondeu). */
export function RespostasAntigas({ revisao }: { revisao: RegistroRitual }) {
  const { t } = useTranslation()
  return (
    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
      {PERGUNTAS.filter((p) => revisao.respostas?.[p]?.trim()).map((p) => (
        <div key={p} className="contents">
          <dt className="font-bold">{t(`rituais.${p}`)}</dt>
          <dd className="break-words">{revisao.respostas![p]}</dd>
        </div>
      ))}
    </dl>
  )
}
