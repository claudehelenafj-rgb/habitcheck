// Reset de 10 minutos numa zona do quarto: tela cheia, sem menu, com o timer grande (para ver de longe
// enquanto arruma) e a lista da zona em botões grandes. Quando o tempo acaba, pode parar: já conta.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { TimerVisual } from '../componentes/Enfeites'
import { useEscolhasFoco } from '../dados/foco'
import { marcarHabito, useHabitosAtivos } from '../dados/habitos'
import { descartarReset, encerrarReset, marcarAvisoReset, mudarReset, useEstadoReset, useZonas } from '../dados/quarto'
import { useConfigAvisos } from '../dados/remedios'
import { useAgora } from '../dados/timer'
import { mostrarAvisoSistema } from '../lembretes'
import { diaLocal } from '../logica/datas'
import { pendenteHoje } from '../logica/habitos'
import { formatarDuracao } from '../logica/hoje'
import {
  alternarItem,
  maisCincoMinutos,
  MAX_EXTRAS_RESET,
  minutosDoReset,
  segundosDoReset,
  terminarReset,
  type EstadoReset,
  type Zona,
} from '../logica/quarto'
import { tocarSino, useTelaAcesa } from '../telaFoco'

function relogio(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

/** Título que recebe o foco quando a fase muda (o leitor de tela anuncia). */
function Titulo({ chave, children }: { chave: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [chave])
  return (
    <h1 ref={ref} tabIndex={-1} className="font-titulo flex items-center justify-center gap-3 text-4xl leading-tight font-semibold break-words outline-none sm:text-5xl">
      {children}
    </h1>
  )
}

function useTamanhoTimer() {
  const medir = () => Math.round(Math.max(160, Math.min(320, window.innerWidth - 64, window.innerHeight * 0.34)))
  const [tamanho, setTamanho] = useState(medir)
  useEffect(() => {
    const mudou = () => setTamanho(medir())
    window.addEventListener('resize', mudou)
    return () => window.removeEventListener('resize', mudou)
  }, [])
  return tamanho
}

function Itens({ zona, e }: { zona: Zona; e: EstadoReset }) {
  if (!zona.itens.length) return null
  return (
    <ul className="grid w-full gap-2 sm:grid-cols-2">
      {zona.itens.map((item) => {
        const feito = e.feitos.includes(item)
        return (
          <li key={item}>
            <button
              type="button"
              aria-pressed={feito}
              onClick={() => mudarReset((x) => alternarItem(x, item))}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-linha px-4 py-2 text-left text-lg font-bold ${feito ? 'bg-menta' : 'bg-papel'}`}
            >
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel">
                {feito ? '✓' : ''}
              </span>
              <span className={`flex-1 ${feito ? 'line-through decoration-2' : ''}`}>{item}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Correndo({ zona, e }: { zona: Zona; e: EstadoReset }) {
  const { t } = useTranslation()
  const agora = useAgora(1000)
  const tamanho = useTamanhoTimer()
  const escolhas = useEscolhasFoco()
  const { discretos = false } = useConfigAvisos()
  const restante = segundosDoReset(e, agora)
  const acabou = restante === 0
  useTelaAcesa(true)

  useEffect(() => {
    if (!acabou || !escolhas) return
    const chave = `${e.inicio}|${e.minutos}`
    if (e.avisadoEm === chave) return
    void marcarAvisoReset(chave).then((primeiro) => {
      if (!primeiro) return
      if (escolhas.som) tocarSino()
      if (document.visibilityState !== 'visible') {
        const [titulo, corpo] = discretos ? [t('avisos.discretoTitulo'), t('avisos.discretoCorpo')] : [t('quarto.avisoFimTitulo'), t('quarto.avisoFimCorpo')]
        void mostrarAvisoSistema(titulo, corpo, `reset|${chave}`, '#/quarto/reset')
      }
    })
  }, [acabou, e, escolhas, discretos, t])

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5">
      <p className="rotulo">{t('quarto.resetDe', { n: e.minutos })}</p>
      <Titulo chave={`correndo-${acabou}`}>
        <Adesivo nome={zona.adesivo} tamanho={48} />
        {acabou ? t('quarto.acabouTitulo') : zona.nome}
      </Titulo>
      <p className="text-lg">{acabou ? t('quarto.acabouTexto') : t('quarto.umaCoisa')}</p>
      <TimerVisual fracaoRestante={restante / (e.minutos * 60)} rotulo={relogio(restante)} cor="var(--forte-piscina)" tamanho={tamanho} />
      <span className="so-leitor" aria-live="polite">
        {acabou ? '' : t('foco.restam', { tempo: formatarDuracao(Math.ceil(restante / 60)) })}
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        <Botao grande={acabou} onClick={() => mudarReset((x) => terminarReset(x, new Date()))} icone={<span aria-hidden="true">✓</span>}>
          {acabou ? t('quarto.terminar') : t('quarto.terminei')}
        </Botao>
        {acabou && e.extras < MAX_EXTRAS_RESET && (
          <Botao variante="secundario" tom="bg-manteiga" onClick={() => mudarReset((x) => maisCincoMinutos(x, new Date()))}>
            {t('foco.mais5')}
          </Botao>
        )}
      </div>
      <Itens zona={zona} e={e} />
    </div>
  )
}

function Fim({ zona, e }: { zona: Zona; e: EstadoReset }) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const habitos = useHabitosAtivos()
  const minutos = minutosDoReset(e, new Date())

  async function guardar() {
    const reset = await encerrarReset()
    // o reset conta para os hábitos do quarto que ainda faltam hoje
    const hoje = diaLocal()
    const contou = (habitos?.habitos ?? []).filter(
      (h) => h.area === 'quarto' && pendenteHoje(h, (habitos?.registros ?? []).filter((r) => r.habitoId === h.id), hoje),
    )
    for (const h of contou) await marcarHabito(h.id, hoje, 'completo')
    navegar('/quarto')
    if (reset) {
      mostrarAviso(contou.length ? t('quarto.guardadoHabito', { titulo: contou.map((h) => h.titulo).join(', ') }) : t('quarto.guardado'))
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <Titulo chave="fim">{t('quarto.feitoTitulo')}</Titulo>
      <Adesivo nome={zona.adesivo} tamanho={96} />
      <p className="text-xl font-semibold">
        {zona.nome} · {formatarDuracao(Math.max(1, minutos))}
      </p>
      {zona.itens.length > 0 && <p className="text-lg">{t('quarto.itensFeitos', { feitos: e.feitos.length, total: zona.itens.length })}</p>}
      <p>{t('quarto.feitoTexto')}</p>
      <Botao grande onClick={guardar}>
        {t('quarto.guardar')}
      </Botao>
      <button
        type="button"
        onClick={async () => {
          await descartarReset()
          navegar('/quarto')
        }}
        className="text-sm font-bold underline decoration-2 underline-offset-4"
      >
        {t('foco.naoGuardar')}
      </button>
    </div>
  )
}

export function ResetQuarto() {
  const { t } = useTranslation()
  const estado = useEstadoReset()
  const zonas = useZonas()
  if (estado === undefined || !zonas) return null
  if (!estado) return <Navigate to="/quarto" replace />
  // zona apagada no meio do reset: segue com o nome guardado em branco e sem lista
  const zona = zonas.find((z) => z.id === estado.zonaId) ?? { id: estado.zonaId, nome: t('quarto.zona'), adesivo: 'vassoura' as const, itens: [], ordem: 0 }

  return (
    <div className="flex min-h-screen flex-col bg-fundo text-tinta">
      <header className="flex items-center gap-2 px-4 py-3">
        <Link to="/quarto" className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold underline decoration-2 underline-offset-4">
          ← {estado.fase === 'correndo' ? t('foco.voltarApp') : t('foco.voltar')}
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12 text-center">
        {estado.fase === 'correndo' ? <Correndo zona={zona} e={estado} /> : <Fim zona={zona} e={estado} />}
      </main>
    </div>
  )
}
