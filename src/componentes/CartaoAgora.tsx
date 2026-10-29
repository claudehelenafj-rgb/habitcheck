// Cartão "Agora": uma única coisa em destaque, sem decoração.
// Mostra o próximo passo físico, o "pronto quando", um botão para concluir e o timer que encolhe.

import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { marcarRefeicao } from '../dados/alimentacao'
import { alternarPasso, concluirTarefa, reabrirTarefa } from '../dados/tarefas'
import { iniciarTimer, pararTimer, segundosRestantes, useAgora, useTimer } from '../dados/timer'
import { AREAS } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { formatarDuracao, type Candidato } from '../logica/hoje'
import { proximoPasso } from '../logica/tarefas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { BotoesDose } from './BotoesDose'
import { BotoesHabito, PlanoSeEntao } from './CartaoHabito'
import { TimerVisual } from './Enfeites'

const TIMER_PADRAO_MIN = 25

function semAnimacao() {
  const raiz = document.documentElement
  return raiz.dataset.animacoes === 'nao' || raiz.dataset.calmo === 'sim' || matchMedia('(prefers-reduced-motion: reduce)').matches
}

function relogio(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function Timer({ tarefaId, sugestaoMin, compacto }: { tarefaId?: string; sugestaoMin?: number; compacto?: boolean }) {
  const { t } = useTranslation()
  const timer = useTimer()
  const agora = useAgora(1000)
  const minutos = sugestaoMin ?? TIMER_PADRAO_MIN

  if (!timer) {
    return (
      <Botao variante="secundario" tom="bg-azul-nevoa" onClick={() => iniciarTimer(minutos, tarefaId)} icone={<span aria-hidden="true">◔</span>}>
        {t('hoje.timer', { n: minutos })}
      </Botao>
    )
  }

  const restante = segundosRestantes(timer, agora)
  const total = timer.duracaoMin * 60
  return (
    <div className="flex flex-col items-center gap-3">
      <TimerVisual
        fracaoRestante={restante / total}
        rotulo={restante > 0 ? relogio(restante) : '0:00'}
        cor={AREAS.consultas.forteCss}
        tamanho={compacto ? 132 : 168}
      />
      <span className="so-leitor" aria-live="polite">
        {restante === 0 ? t('hoje.acabouTempo') : t('hoje.timerRestante', { tempo: formatarDuracao(Math.ceil(restante / 60)) })}
      </span>
      {restante === 0 && <p className="max-w-60 text-center text-sm font-semibold">{t('hoje.acabouTempo')}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {restante === 0 && (
          <Botao variante="secundario" tom="bg-azul-nevoa" className="min-h-10 px-4 text-sm" onClick={() => iniciarTimer(5, timer.tarefaId)}>
            {t('hoje.mais5')}
          </Botao>
        )}
        <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={pararTimer}>
          {t('hoje.pararTimer')}
        </Botao>
      </div>
    </div>
  )
}

type Props = {
  candidato: Candidato | undefined
  /** versão menor, para a janelinha flutuante */
  compacto?: boolean
  semNada?: ReactNode
}

export function CartaoAgora({ candidato, compacto = false, semNada }: Props) {
  const { t } = useTranslation()
  const [colando, setColando] = useState(false)

  if (!candidato) {
    return (
      <section aria-labelledby="titulo-agora" className={`cartao flex flex-col gap-3 bg-papel ${compacto ? 'p-4' : 'p-6'}`}>
        <p id="titulo-agora" className="rotulo">
          {t('hoje.agora')}
        </p>
        <p className={`font-titulo font-semibold ${compacto ? 'text-2xl' : 'text-3xl'}`}>{t('hoje.tudoCerto')}</p>
        <p>{t('hoje.tudoCertoTexto')}</p>
        {semNada}
        <div>
          <Timer compacto={compacto} />
        </div>
      </section>
    )
  }

  if (candidato.tipo === 'remedio' && candidato.dose) {
    return (
      <section aria-labelledby="titulo-agora" className={`cartao flex flex-col gap-4 bg-morango-claro ${compacto ? 'p-4' : 'p-6'}`}>
        <p className="rotulo flex items-center gap-2">
          <span id="titulo-agora">{t('hoje.agora')}</span>
          <span aria-hidden="true">·</span>
          <Adesivo nome="pilula" tamanho={20} />
          {t('nav.remedios')} · {candidato.dose.horario}
        </p>
        <p className={`font-titulo leading-tight font-semibold break-words ${compacto ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{candidato.titulo}</p>
        {candidato.dose.remedio.observacao && <p>{candidato.dose.remedio.observacao}</p>}
        <BotoesDose dose={candidato.dose} grande={!compacto} />
      </section>
    )
  }

  if (candidato.tipo === 'transicao' || candidato.tipo === 'compromisso') {
    const doCalendario = candidato.tipo === 'compromisso' && candidato.origem === 'evento'
    return (
      <section aria-labelledby="titulo-agora" className={`cartao flex flex-col gap-3 ${doCalendario ? 'bg-manteiga' : 'bg-azul-nevoa'} ${compacto ? 'p-4' : 'p-6'}`}>
        <p className="rotulo flex items-center gap-2">
          <span id="titulo-agora">{t('hoje.agora')}</span>
          <span aria-hidden="true">·</span>
          <Adesivo nome={doCalendario ? 'calendario' : 'prancheta'} tamanho={20} />
          {doCalendario ? t('nav.calendario') : t('nav.consultas')}
        </p>
        <p className={`font-titulo leading-tight font-semibold break-words ${compacto ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{candidato.titulo}</p>
        {candidato.detalhe && <p className="text-lg font-semibold tabular-nums">{candidato.detalhe}</p>}
        <a href={doCalendario ? '#/calendario' : '#/consultas'} className="self-start font-bold underline decoration-2 underline-offset-4">
          {doCalendario ? t('calendario.titulo') : t('consultas.titulo')} →
        </a>
      </section>
    )
  }

  if (candidato.tipo === 'refeicao') {
    return (
      <section aria-labelledby="titulo-agora" className={`cartao flex flex-col gap-3 bg-menta ${compacto ? 'p-4' : 'p-6'}`}>
        <p className="rotulo flex items-center gap-2">
          <span id="titulo-agora">{t('hoje.agora')}</span>
          <span aria-hidden="true">·</span>
          <Adesivo nome="prato" tamanho={20} />
          {t('nav.alimentacao')} · {candidato.horario.toTimeString().slice(0, 5)}
        </p>
        <p className={`font-titulo leading-tight font-semibold break-words ${compacto ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{candidato.titulo}</p>
        <p className="text-lg">{t('alimentacao.mesmoSemFome')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Botao grande={!compacto} onClick={() => marcarRefeicao(diaLocal(), candidato.refeicao)} icone={<span aria-hidden="true">✓</span>}>
            {t('alimentacao.comi')}
          </Botao>
          {!compacto && (
            <Link to="/alimentacao" className="font-bold underline decoration-2 underline-offset-4">
              {t('alimentacao.naoSeiOQue')} →
            </Link>
          )}
        </div>
      </section>
    )
  }

  if (candidato.tipo === 'habito') {
    const habito = candidato.habito
    const area = AREAS[habito?.area ?? 'academia']
    return (
      <section aria-labelledby="titulo-agora" className={`cartao flex flex-col gap-3 ${area.claro} ${compacto ? 'p-4' : 'p-6'}`}>
        <p className="rotulo flex items-center gap-2">
          <span id="titulo-agora">{t('hoje.agora')}</span>
          <span aria-hidden="true">·</span>
          <Adesivo nome={habito?.adesivo ?? area.adesivo} tamanho={20} />
          {t(`nav.${area.id}`)}
        </p>
        <p className={`font-titulo leading-tight font-semibold break-words ${compacto ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{candidato.titulo}</p>
        {habito && (
          <>
            <PlanoSeEntao habito={habito} className="text-lg" />
            <BotoesHabito habito={habito} hoje={diaLocal()} grande={!compacto} />
            {habito.area === 'quarto' && !compacto && (
              <Link to="/quarto" className="self-start font-bold underline decoration-2 underline-offset-4">
                {t('quarto.fazerReset')} →
              </Link>
            )}
          </>
        )}
      </section>
    )
  }

  if (candidato.tipo !== 'tarefa') {
    return (
      <section className="cartao bg-papel p-6">
        <p className="rotulo">{t('hoje.agora')}</p>
        <p className="font-titulo text-3xl font-semibold">{candidato.titulo}</p>
      </section>
    )
  }

  const tarefa = candidato.tarefa
  const passo = proximoPasso(tarefa)
  const area = tarefa.area ? AREAS[tarefa.area] : undefined

  async function feito() {
    if (passo) {
      await alternarPasso(tarefa.id, passo.id)
      return
    }
    setColando(true)
    await new Promise((r) => setTimeout(r, semAnimacao() ? 0 : 520))
    await concluirTarefa(tarefa.id)
    await pararTimer()
    setColando(false)
    mostrarAviso(t('tarefas.concluida'), () => reabrirTarefa(tarefa.id))
  }

  return (
    <section
      aria-labelledby="titulo-agora"
      className={`cartao flex flex-col gap-5 bg-papel ${compacto ? 'p-4' : 'p-6 sm:flex-row sm:items-center sm:gap-8'}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="rotulo flex items-center gap-2">
          <span id="titulo-agora">{t('hoje.agora')}</span>
          {area && (
            <>
              <span aria-hidden="true">·</span>
              <Adesivo nome={area.adesivo} tamanho={20} />
              {t(`nav.${area.id}`)}
            </>
          )}
        </p>
        <p className={`font-titulo leading-tight font-semibold break-words ${compacto ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
          {passo ? passo.texto : tarefa.titulo}
        </p>
        {passo?.pronto && (
          <p className="text-lg">
            <span className="font-destaque text-2xl italic">{t('hoje.prontoQuando')}</span> {passo.pronto}
          </p>
        )}
        {passo && <p className="text-sm">{t('hoje.passoDe', { tarefa: tarefa.titulo })}</p>}
        {!passo && tarefa.recompensa && <p className="text-sm">{t('tarefas.depois', { recompensa: tarefa.recompensa })}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Botao grande onClick={feito} icone={colando ? <span className="colando"><Adesivo nome={area?.adesivo ?? 'estrela'} tamanho={30} /></span> : <span aria-hidden="true">✓</span>}>
            {passo ? t('hoje.feitoPasso') : t('hoje.concluir')}
          </Botao>
          {!compacto && (
            <Link
              to={`/foco?tarefa=${tarefa.id}&volta=/hoje`}
              aria-label={t('foco.abrirTarefa', { titulo: tarefa.titulo })}
              className="inline-flex min-h-14 items-center gap-2 rounded-full border-2 border-linha bg-lavanda px-6 text-lg font-bold transition-transform hover:-translate-y-0.5"
            >
              <Adesivo nome="estrela" tamanho={26} />
              {t('foco.abrir')}
            </Link>
          )}
        </div>
      </div>
      <div className="flex shrink-0 justify-center">
        <Timer tarefaId={tarefa.id} sugestaoMin={tarefa.estimativaMin} compacto={compacto} />
      </div>
    </section>
  )
}
