// Modo foco em tela cheia: escolher a tarefa, o primeiro passo físico e o "pronto quando"; mexer o corpo
// de 5 a 20 min antes (se quiser; pode contar para um hábito da Academia); bloco de 25 a 45 min com o tempo visível; no fim, a saída do hiperfoco com uma
// atividade-ponte (água, alongar, guardar o material) e a pausa de verdade; por último, "achei × levou".
// Fica fora da moldura (sem menu), com fundo liso e nada se mexendo além do timer.

import type { TFunction } from 'i18next'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Adesivo, type NomeAdesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { TimerVisual } from '../componentes/Enfeites'
import type { Tarefa } from '../dados/banco'
import {
  descartarFoco,
  encerrarFoco,
  guardarEscolhasFoco,
  guardarFoco,
  mudarFoco,
  useEscolhasFoco,
  useEstadoFoco,
  useSessoesFoco,
  type EscolhasFoco,
} from '../dados/foco'
import { marcarHabito, useHabitosAtivos } from '../dados/habitos'
import { useConfigAvisos } from '../dados/remedios'
import { capturar, reabrirTarefa, useTarefas } from '../dados/tarefas'
import { useAgora } from '../dados/timer'
import { AREAS } from '../design/areas'
import { avisarFimDeFase } from '../lembretes'
import { diaLocal } from '../logica/datas'
import {
  acabouFase,
  blocoSugerido,
  comecarBloco,
  compararEstimativa,
  DURACOES_FOCO,
  MOVIMENTOS_MIN,
  estimativaAjustada,
  fatorBate,
  fatorDeEstimativa,
  irParaPausa,
  maisUmPouco,
  MAX_EXTRAS,
  minutosDeFoco,
  novoFoco,
  pausaPara,
  segundosDaFase,
  terminarFoco,
  type EstadoFoco,
  type FaseFoco,
  type SessaoFoco,
} from '../logica/foco'
import { pendenteHoje } from '../logica/habitos'
import { formatarDuracao } from '../logica/hoje'
import { proximoPasso } from '../logica/tarefas'
import { entrarTelaCheia, podeTelaCheia, prepararSom, sairTelaCheia, useTelaAcesa, useTelaCheia } from '../telaFoco'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'
// "levou" listrado, além da cor (no escuro os tons ficam parecidos)
const LISTRADO = 'bg-[repeating-linear-gradient(135deg,var(--claro-lavanda)_0_5px,var(--forte-rosa)_5px_8px)]'

/** Títulos e textos do aviso de fim de fase (também usados pela moldura). */
export function textosFimFoco(t: TFunction) {
  return (fase: FaseFoco): [string, string] => {
    if (fase === 'pausa') return [t('foco.avisoPausaTitulo'), t('foco.avisoPausaCorpo')]
    if (fase === 'movimento') return [t('foco.avisoMovimentoTitulo'), t('foco.avisoMovimentoCorpo')]
    return [t('foco.avisoFocoTitulo'), t('foco.avisoFocoCorpo')]
  }
}

function relogio(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

/** Timer grande, que cabe na tela do celular ao iPad deitado. */
function useTamanhoTimer() {
  const medir = () => Math.round(Math.max(160, Math.min(340, window.innerWidth - 64, window.innerHeight * 0.36)))
  const [tamanho, setTamanho] = useState(medir)
  useEffect(() => {
    const mudou = () => setTamanho(medir())
    window.addEventListener('resize', mudou)
    return () => window.removeEventListener('resize', mudou)
  }, [])
  return tamanho
}

/** Título da fase: recebe o foco quando a fase muda (o leitor de tela anuncia). */
function Titulo({ chave, children, className = '' }: { chave: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [chave])
  return (
    <h1 ref={ref} tabIndex={-1} className={`font-titulo leading-tight font-semibold break-words outline-none ${className}`}>
      {children}
    </h1>
  )
}

// ---------- Preparar ----------

function ordenarParaFoco(tarefas: Tarefa[], hoje: string, primeiro?: string) {
  const peso = (x: Tarefa) => (x.id === primeiro ? 0 : x.dia && x.dia <= hoje ? 1 : x.prioridade === 'A' ? 2 : 3)
  return tarefas
    .filter((x) => !x.feitaEm)
    .sort((a, b) => peso(a) - peso(b) || (a.dia ?? '9').localeCompare(b.dia ?? '9'))
    .slice(0, 25)
}

function DicaEstimativa({ estimativa, sessoes }: { estimativa?: number; sessoes: SessaoFoco[] }) {
  const { t, i18n } = useTranslation()
  const fator = fatorDeEstimativa(sessoes)
  if (!fator) return null
  if (fatorBate(fator)) return <p className="text-sm">{t('foco.fatorBate')}</p>
  const fatorTexto = fator.toLocaleString(i18n.language)
  return (
    <p className="text-sm">
      {t('foco.fator', { fator: fatorTexto })}
      {estimativa ? ` ${t(fator > 1 ? 'foco.fatorReservar' : 'foco.fatorBastam', { min: estimativaAjustada(estimativa, fator) })}` : ''}
    </p>
  )
}

function Preparar({ tarefas, escolhas, inicial, volta }: { tarefas: Tarefa[]; escolhas: EscolhasFoco; inicial?: string; volta: string }) {
  const { t } = useTranslation()
  const sessoes = useSessoesFoco()
  const hoje = diaLocal()
  const opcoes = useMemo(() => ordenarParaFoco(tarefas, hoje, inicial ?? undefined), [tarefas, hoje, inicial])
  const daTarefa = (id: string) => {
    const x = tarefas.find((y) => y.id === id)
    const passo = x && proximoPasso(x)
    return { passo: passo?.texto ?? '', pronto: passo?.pronto ?? '', estimativa: x?.estimativaMin }
  }
  const primeira = opcoes.find((x) => x.id === inicial)?.id ?? ''
  const [tarefaId, setTarefaId] = useState(primeira)
  const [outra, setOutra] = useState('')
  const [passo, setPasso] = useState(() => daTarefa(primeira).passo)
  const [pronto, setPronto] = useState(() => daTarefa(primeira).pronto)
  const [estimativa, setEstimativa] = useState<number | undefined>(() => daTarefa(primeira).estimativa)
  const [bloco, setBloco] = useState(() => blocoSugerido(daTarefa(primeira).estimativa))
  const [mexer, setMexer] = useState(escolhas.mexer)
  const [mexerMin, setMexerMin] = useState(escolhas.mexerMin)
  const [telaCheia, setTelaCheia] = useState(escolhas.telaCheia)
  const [som, setSom] = useState(escolhas.som)
  const tarefa = tarefas.find((x) => x.id === tarefaId)
  const titulo = tarefa ? tarefa.titulo : outra.trim()
  const comTelaCheia = podeTelaCheia()

  function escolher(id: string) {
    setTarefaId(id)
    const d = daTarefa(id)
    setPasso(d.passo)
    setPronto(d.pronto)
    setEstimativa(d.estimativa)
    setBloco(blocoSugerido(d.estimativa))
  }

  async function comecar() {
    // tela cheia e som precisam do clique: vêm antes de qualquer espera
    if (telaCheia && comTelaCheia) void entrarTelaCheia()
    if (som) prepararSom()
    await guardarEscolhasFoco({ mexer, mexerMin, telaCheia, som })
    await guardarFoco(
      novoFoco(
        {
          titulo,
          passo: passo.trim(),
          blocoMin: bloco,
          volta,
          som,
          ...(tarefa ? { tarefaId: tarefa.id } : {}),
          ...(pronto.trim() ? { pronto: pronto.trim() } : {}),
          ...(estimativa ? { estimativaMin: estimativa } : {}),
        },
        new Date(),
        mexer ? mexerMin : 0,
      ),
    )
  }

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (titulo && passo.trim()) void comecar()
      }}
    >
      <Titulo chave="preparar" className="flex items-center gap-3 text-4xl sm:text-5xl">
        <Adesivo nome="estrela" tamanho={52} />
        {t('foco.titulo')}
      </Titulo>

      <div className="cartao flex flex-col gap-5 bg-papel p-5">
        {opcoes.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('foco.oQue')}</span>
            <select value={tarefaId} onChange={(e) => escolher(e.target.value)} className={campo}>
              {opcoes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.titulo}
                </option>
              ))}
              <option value="">{t('foco.outraCoisa')}</option>
            </select>
          </label>
        )}
        {!tarefa && (
          <label className="flex flex-col gap-1">
            <span className="font-bold">{opcoes.length ? t('foco.outraCoisaCampo') : t('foco.oQue')}</span>
            <input value={outra} onChange={(e) => setOutra(e.target.value)} maxLength={80} placeholder={t('foco.outraCoisaExemplo')} className={campo} />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('foco.passo')}</span>
          <input value={passo} onChange={(e) => setPasso(e.target.value)} maxLength={100} required className={campo} />
          <span className="text-sm text-tinta-suave">{t('foco.passoDica')}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('foco.pronto')}</span>
          <input value={pronto} onChange={(e) => setPronto(e.target.value)} maxLength={100} placeholder={t('foco.prontoExemplo')} className={campo} />
        </label>
        <div className="flex flex-col gap-1">
          <label className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{t('foco.estimativa')}</span>
            <span className="inline-flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={600}
                inputMode="numeric"
                value={estimativa ?? ''}
                onChange={(e) => setEstimativa(e.target.value ? Math.max(1, Number(e.target.value)) : undefined)}
                className={`${campo} w-24 tabular-nums`}
              />
              {t('foco.minutos')}
            </span>
          </label>
          {sessoes && <DicaEstimativa estimativa={estimativa} sessoes={sessoes} />}
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-bold">{t('foco.bloco')}</legend>
          <div className="flex flex-wrap items-center gap-1.5">
            {DURACOES_FOCO.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={bloco === d}
                onClick={() => setBloco(d)}
                className={`min-h-11 rounded-full border-2 border-linha px-4 font-semibold ${bloco === d ? 'bg-lavanda' : 'bg-papel'}`}
              >
                {bloco === d && '✓ '}
                {t('faculdade.min', { n: d })}
              </button>
            ))}
            <span className="text-sm">{t('foco.pausaDepois', { n: pausaPara(bloco) })}</span>
          </div>
        </fieldset>
      </div>

      <div className="cartao flex flex-col gap-3 bg-menta p-5">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={mexer} onChange={(e) => setMexer(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--chocolate)]" />
          <span>
            <span className="font-bold">{t('foco.mexer')}</span>
            <span className="block text-sm">{t('foco.mexerDica')}</span>
          </span>
        </label>
        {mexer && (
          <fieldset className="ml-8 flex flex-wrap items-center gap-1.5">
            <legend className="so-leitor">{t('foco.mexerTempo')}</legend>
            {MOVIMENTOS_MIN.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mexerMin === m}
                onClick={() => setMexerMin(m)}
                className={`min-h-11 rounded-full border-2 border-linha px-4 font-semibold ${mexerMin === m ? 'bg-papel' : 'bg-menta'}`}
              >
                {mexerMin === m && '✓ '}
                {t('faculdade.min', { n: m })}
              </button>
            ))}
          </fieldset>
        )}
        {comTelaCheia && (
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={telaCheia} onChange={(e) => setTelaCheia(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--chocolate)]" />
            <span className="font-bold">{t('foco.usarTelaCheia')}</span>
          </label>
        )}
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={som} onChange={(e) => setSom(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--chocolate)]" />
          <span className="font-bold">{t('foco.som')}</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" grande disabled={!titulo || !passo.trim()}>
          {t('foco.comecar')}
        </Botao>
        {(!titulo || !passo.trim()) && <p className="text-sm">{t('foco.faltaPasso')}</p>}
      </div>
    </form>
  )
}

// ---------- Durante ----------

function TirarDaCabeca() {
  const { t } = useTranslation()
  const [texto, setTexto] = useState('')
  const [guardado, setGuardado] = useState(false)
  return (
    <form
      className="flex w-full max-w-md flex-col gap-2 text-left"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!texto.trim()) return
        await capturar([texto.trim()])
        setTexto('')
        setGuardado(true)
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">{t('foco.anotar')}</span>
        <span className="flex gap-2">
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setGuardado(false)
            }}
            maxLength={200}
            className={`${campo} min-w-0 flex-1`}
          />
          <Botao type="submit" variante="contorno">
            {t('foco.anotarBotao')}
          </Botao>
        </span>
      </label>
      <p role="status" className="min-h-5 text-sm">
        {guardado ? t('foco.anotado') : t('foco.anotarDica')}
      </p>
    </form>
  )
}

function Ponte({ adesivo, texto }: { adesivo: NomeAdesivo; texto: string }) {
  const [feito, setFeito] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={feito}
      onClick={() => setFeito((f) => !f)}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 border-linha px-4 py-2 text-left text-lg font-bold ${feito ? 'bg-menta' : 'bg-papel'}`}
    >
      <Adesivo nome={adesivo} tamanho={36} />
      <span className="flex-1">{texto}</span>
      <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full border-2 border-linha bg-papel">
        {feito ? '✓' : ''}
      </span>
    </button>
  )
}

/** O movimento antes do foco pode contar para um hábito da Academia que ainda falta hoje. */
function ContarParaAcademia() {
  const { t } = useTranslation()
  const dados = useHabitosAtivos()
  const [contou, setContou] = useState<string[]>([])
  if (!dados) return null
  const hoje = diaLocal()
  const daAcademia = dados.habitos.filter(
    (h) => h.area === 'academia' && (contou.includes(h.id) || pendenteHoje(h, dados.registros.filter((r) => r.habitoId === h.id), hoje)),
  )
  if (!daAcademia.length) return null
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-linha/60 p-4">
      <p className="font-bold">{t('foco.contarPara')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {daAcademia.map((h) =>
          contou.includes(h.id) ? (
            <p key={h.id} role="status" className="flex items-center gap-2 font-semibold">
              <Adesivo nome={h.adesivo} tamanho={28} />
              {t('foco.contou', { titulo: h.titulo })}
            </p>
          ) : (
            <Botao
              key={h.id}
              variante="secundario"
              tom="bg-pessego"
              icone={<Adesivo nome={h.adesivo} tamanho={24} />}
              onClick={async () => {
                await marcarHabito(h.id, hoje, 'completo')
                setContou((c) => [...c, h.id])
              }}
            >
              {t('foco.contarComo', { titulo: h.titulo })}
            </Botao>
          ),
        )}
      </div>
    </div>
  )
}

function SaidaDoHiperfoco({ e }: { e: EstadoFoco }) {
  const { t } = useTranslation()
  const [ondeParei, setOndeParei] = useState(e.ondeParei ?? '')
  const agir = (mudar: (x: EstadoFoco, agora: Date) => EstadoFoco) => mudarFoco((x) => mudar({ ...x, ondeParei: ondeParei.trim() || undefined }, new Date()))
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Titulo chave={`saida-${e.faseInicio}`} className="text-4xl sm:text-5xl">
        {t('foco.saidaTitulo')}
      </Titulo>
      <p className="text-lg">{t('foco.saidaTexto')}</p>
      <div className="flex flex-col gap-2">
        <Ponte adesivo="copo" texto={t('foco.ponteAgua')} />
        <Ponte adesivo="onda" texto={t('foco.ponteAlongar')} />
        <Ponte adesivo="livro" texto={t('foco.ponteGuardar')} />
      </div>
      {e.tarefaId && (
        <label className="flex flex-col gap-1 text-left">
          <span className="font-bold">{t('foco.ondeParei')}</span>
          <input value={ondeParei} onChange={(x) => setOndeParei(x.target.value)} maxLength={100} placeholder={t('foco.ondePareiExemplo')} className={campo} />
        </label>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Botao grande onClick={() => agir(irParaPausa)}>
          {t('foco.pausa', { n: pausaPara(e.blocoMin) })}
        </Botao>
        {e.extras < MAX_EXTRAS && (
          <Botao variante="secundario" tom="bg-lavanda" onClick={() => agir(maisUmPouco)}>
            {t('foco.mais5')}
          </Botao>
        )}
        <Botao variante="contorno" onClick={() => agir(terminarFoco)}>
          {t('foco.terminarPorAgora')}
        </Botao>
      </div>
      {e.extras > 0 && <p className="text-sm">{e.extras < MAX_EXTRAS ? t('foco.extraUmaVez') : t('foco.extraAcabou')}</p>}
    </div>
  )
}

function Correndo({ e, agora }: { e: EstadoFoco; agora: Date }) {
  const { t } = useTranslation()
  const tamanho = useTamanhoTimer()
  const restante = segundosDaFase(e, agora)
  const acabou = restante === 0
  const minutoRestante = Math.ceil(restante / 60)
  const area = AREAS.faculdade
  const cor = e.fase === 'pausa' ? 'var(--forte-piscina)' : e.fase === 'movimento' ? 'var(--forte-agua)' : area.forteCss

  if (e.fase === 'foco' && acabou) return <SaidaDoHiperfoco e={e} />

  const timer = (
    <>
      <TimerVisual fracaoRestante={restante / (e.faseMin * 60)} rotulo={relogio(restante)} cor={cor} tamanho={tamanho} />
      <span className="so-leitor" aria-live="polite">
        {acabou ? '' : t('foco.restam', { tempo: formatarDuracao(minutoRestante) })}
      </span>
    </>
  )

  if (e.fase === 'movimento') {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-5">
        <Titulo chave={`movimento-${acabou}`} className="text-4xl sm:text-5xl">
          {acabou ? t('foco.movimentoAcabou') : t('foco.movimentoTitulo')}
        </Titulo>
        <p className="text-lg">{t('foco.movimentoTexto')}</p>
        {timer}
        <Botao grande onClick={() => mudarFoco((x) => comecarBloco(x, new Date()))}>
          {t('foco.jaMexi', { n: e.blocoMin })}
        </Botao>
        <ContarParaAcademia />
      </div>
    )
  }

  if (e.fase === 'pausa') {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-5">
        <Titulo chave={`pausa-${acabou}`} className="text-4xl sm:text-5xl">
          {acabou ? t('foco.pausaAcabou') : t('foco.pausaTitulo')}
        </Titulo>
        <p className="text-lg">{acabou ? t('foco.pausaAcabouTexto') : t('foco.pausaTexto')}</p>
        {timer}
        <div className="flex flex-wrap justify-center gap-2">
          <Botao grande={acabou} variante={acabou ? 'principal' : 'secundario'} tom="bg-lavanda" onClick={() => mudarFoco((x) => comecarBloco(x, new Date()))}>
            {acabou ? t('foco.outroBloco', { n: e.blocoMin }) : t('foco.voltarAntes')}
          </Botao>
          <Botao variante="contorno" onClick={() => mudarFoco((x) => terminarFoco(x, new Date()))}>
            {t('foco.terminarPorAgora')}
          </Botao>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5">
      <p className="rotulo">
        {t('foco.focando')} · {e.titulo}
      </p>
      <Titulo chave={`foco-${e.faseInicio}`} className="text-4xl sm:text-5xl">
        {e.passo}
      </Titulo>
      {e.pronto && (
        <p className="text-xl">
          <span className="font-destaque text-2xl italic">{t('foco.prontoQuando')}</span> {e.pronto}
        </p>
      )}
      {timer}
      <div className="flex flex-wrap justify-center gap-2">
        <Botao onClick={() => mudarFoco((x) => terminarFoco(x, new Date()))}>✓ {t('foco.terminei')}</Botao>
        <Botao variante="contorno" onClick={() => mudarFoco((x) => irParaPausa(x, new Date()))}>
          {t('foco.pausaAgora')}
        </Botao>
      </div>
      <TirarDaCabeca />
    </div>
  )
}

// ---------- Fim: achei × levou ----------

function Barras({ achei, levou }: { achei: number; levou: number }) {
  const { t } = useTranslation()
  const maior = Math.max(achei, levou, 1)
  const linha = (rotulo: string, min: number, classe: string) => (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
      <span className="text-sm font-bold">{rotulo}</span>
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1">
          <span className={`block h-6 rounded-full border-2 border-linha ${classe}`} style={{ width: `${Math.max(6, (min / maior) * 100)}%` }} />
        </span>
        <span className="w-16 font-bold whitespace-nowrap tabular-nums">{formatarDuracao(min)}</span>
      </span>
    </div>
  )
  return (
    <div className="flex w-full flex-col gap-2 text-left" role="group" aria-label={t('foco.comparacao')}>
      {linha(t('foco.achei'), achei, 'bg-papel')}
      {linha(t('foco.levou'), levou, LISTRADO)}
    </div>
  )
}

function Fim({ e, tarefa, sessoes }: { e: EstadoFoco; tarefa?: Tarefa; sessoes: SessaoFoco[] }) {
  const { t, i18n } = useTranslation()
  const navegar = useNavigate()
  const [ondeParei, setOndeParei] = useState(e.ondeParei ?? '')
  const minutos = minutosDeFoco(e, new Date())
  const comparacao = e.estimativaMin && minutos ? compararEstimativa(e.estimativaMin, minutos) : undefined
  const daqui = { id: 'agora', dia: '', inicio: e.comecouEm, fim: new Date().toISOString(), minutos, estimativaMin: e.estimativaMin }
  const fator = fatorDeEstimativa([...sessoes, daqui])
  const aberta = tarefa && !tarefa.feitaEm

  async function guardar(concluir: boolean) {
    const passoOndeParei = ondeParei.trim() ? t('foco.continuarDe', { texto: ondeParei.trim() }) : undefined
    const sessao = await encerrarFoco({ concluir, passoOndeParei })
    navegar(e.volta)
    if (concluir && tarefa) mostrarAviso(t('tarefas.concluida'), () => reabrirTarefa(tarefa.id))
    else if (sessao) mostrarAviso(t('foco.guardado', { tempo: formatarDuracao(sessao.minutos) }))
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Titulo chave="fim" className="text-4xl sm:text-5xl">
        {t('foco.fimTitulo')}
      </Titulo>
      {minutos < 1 ? (
        <p className="text-lg">{t('foco.quaseNada')}</p>
      ) : (
        <>
          {comparacao ? (
            <>
              <Barras achei={comparacao.achei} levou={comparacao.levou} />
              <p className="text-lg">
                {comparacao.jeito === 'parecido'
                  ? t('foco.jeitoParecido')
                  : comparacao.jeito === 'mais'
                    ? t('foco.jeitoMais', { n: comparacao.levou - comparacao.achei })
                    : t('foco.jeitoMenos', { n: comparacao.achei - comparacao.levou })}
              </p>
            </>
          ) : (
            <p className="text-lg">{t('foco.foram', { tempo: formatarDuracao(minutos) })}</p>
          )}
          {fator && !fatorBate(fator) && <p className="text-sm">{t('foco.fator', { fator: fator.toLocaleString(i18n.language) })}</p>}
        </>
      )}

      {aberta && minutos >= 1 && (
        <label className="flex flex-col gap-1 text-left">
          <span className="font-bold">{t('foco.ondePareiFim')}</span>
          <input value={ondeParei} onChange={(x) => setOndeParei(x.target.value)} maxLength={100} placeholder={t('foco.ondePareiExemplo')} className={campo} />
        </label>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {aberta && (
          <Botao grande onClick={() => guardar(true)} icone={<Adesivo nome={AREAS[tarefa.area ?? 'base'].adesivo} tamanho={28} />}>
            {t('foco.concluir')}
          </Botao>
        )}
        {minutos >= 1 ? (
          <Botao grande={!aberta} variante={aberta ? 'secundario' : 'principal'} tom="bg-lavanda" onClick={() => guardar(false)}>
            {aberta ? t('foco.guardarSemConcluir') : t('foco.guardar')}
          </Botao>
        ) : (
          <Botao
            onClick={async () => {
              await descartarFoco()
              navegar(e.volta)
            }}
          >
            {t('foco.voltar')}
          </Botao>
        )}
      </div>
      {minutos >= 1 && (
        <button
          type="button"
          onClick={async () => {
            await descartarFoco()
            navegar(e.volta)
          }}
          className="self-center text-sm font-bold underline decoration-2 underline-offset-4"
        >
          {t('foco.naoGuardar')}
        </button>
      )}
    </div>
  )
}

// ---------- Tela ----------

function EmFoco({ e, tarefas }: { e: EstadoFoco; tarefas: Tarefa[] }) {
  const { t } = useTranslation()
  const agora = useAgora(1000)
  const sessoes = useSessoesFoco()
  const { discretos = false } = useConfigAvisos()
  const textos = useMemo(
    () => ({ fimFoco: textosFimFoco(t), discretoTitulo: t('avisos.discretoTitulo'), discretoCorpo: t('avisos.discretoCorpo') }),
    [t],
  )
  const acabou = acabouFase(e, agora)
  useTelaAcesa(e.fase !== 'fim')

  useEffect(() => {
    if (acabou && e.avisadoEm !== e.faseInicio) void avisarFimDeFase(e, textos, discretos)
  }, [acabou, e, textos, discretos])

  useEffect(() => {
    if (e.fase === 'fim') sairTelaCheia()
  }, [e.fase])

  if (e.fase === 'fim') {
    if (!sessoes) return null
    return <Fim e={e} tarefa={tarefas.find((x) => x.id === e.tarefaId)} sessoes={sessoes} />
  }
  return <Correndo e={e} agora={agora} />
}

export function Foco() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const estado = useEstadoFoco()
  const tarefas = useTarefas()
  const escolhas = useEscolhasFoco()
  const telaCheia = useTelaCheia()
  const volta = params.get('volta')?.startsWith('/') ? params.get('volta')! : '/hoje'

  // ao sair da tela, sai da tela cheia
  useEffect(() => () => sairTelaCheia(), [])

  if (estado === undefined || !tarefas || !escolhas) return null
  const destino = estado?.volta ?? volta

  return (
    <div className="flex min-h-screen flex-col bg-fundo text-tinta">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Link to={destino} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold underline decoration-2 underline-offset-4">
          ← {estado && estado.fase !== 'fim' ? t('foco.voltarApp') : t('foco.voltar')}
        </Link>
        {estado && estado.fase !== 'fim' && podeTelaCheia() && (
          <button
            type="button"
            onClick={() => (telaCheia ? sairTelaCheia() : void entrarTelaCheia())}
            className="ml-auto min-h-11 rounded-full border-2 border-linha bg-papel px-4 text-sm font-bold"
          >
            {telaCheia ? t('foco.sairTelaCheia') : t('foco.telaCheia')}
          </button>
        )}
      </header>
      <main className={`flex flex-1 flex-col items-center px-4 pb-12 ${estado ? 'justify-center text-center' : 'pt-2'}`}>
        {estado ? (
          <EmFoco e={estado} tarefas={tarefas} />
        ) : (
          <Preparar tarefas={tarefas} escolhas={escolhas} inicial={params.get('tarefa') ?? undefined} volta={volta} />
        )}
      </main>
    </div>
  )
}
