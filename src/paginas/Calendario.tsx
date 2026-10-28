// Calendário: semana e mês, juntando eventos (criados aqui ou importados), consultas marcadas
// e tarefas A. Importar calendário da Apple (.ics) e do Google (.zip).

import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo, type NomeAdesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { EditorEvento } from '../componentes/EditorEvento'
import { CirculoCaneta } from '../componentes/GradeSemanal'
import type { Tarefa } from '../dados/banco'
import { useConsultas } from '../dados/consultas'
import { importarCalendario, novoEvento, useEventos } from '../dados/eventos'
import { useTarefas } from '../dados/tarefas'
import { doDia, gradeDoMes, mesmoMes, ocorrencias, type Evento, type Ocorrencia } from '../logica/calendario'
import type { Consulta } from '../logica/consultas'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import { diasDaSemana, momento } from '../logica/remedios'

type Item = { chave: string; hora?: string; titulo: string; tom: string; adesivo: NomeAdesivo; legenda: string; abrir?: () => void }

function useItensDoDia(lista: Ocorrencia[], consultas: Consulta[], tarefas: Tarefa[], editar: (e: Evento) => void) {
  const { t, i18n } = useTranslation()
  const hhmm = (d: Date) => d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  return (dia: Dia): Item[] => {
    const eventos: Item[] = doDia(lista, dia).map((o) => ({
      chave: `${o.evento.id}|${o.inicio.toISOString()}`,
      hora: o.evento.diaInteiro ? undefined : hhmm(o.inicio),
      titulo: o.evento.titulo,
      tom: 'bg-manteiga',
      adesivo: 'calendario',
      legenda: [o.evento.diaInteiro ? t('calendario.diaInteiro') : '', o.evento.repeticao ? t('calendario.repete') : '', o.evento.origem !== 'caderninho' ? t('calendario.veioDe', { origem: t(`calendario.origem${o.evento.origem[0].toUpperCase()}${o.evento.origem.slice(1)}`) }) : '']
        .filter(Boolean)
        .join(' · '),
      abrir: () => editar(o.evento),
    }))
    const deConsultas: Item[] = consultas
      .filter((c) => c.status === 'marcada' && c.data === dia)
      .map((c) => ({ chave: c.id, hora: c.hora, titulo: c.titulo, tom: 'bg-azul-nevoa', adesivo: 'prancheta', legenda: t('calendario.consulta') }))
    const deTarefas: Item[] = tarefas
      .filter((x) => x.prioridade === 'A' && x.dia === dia && !x.feitaEm)
      .map((x) => ({ chave: x.id, titulo: x.titulo, tom: 'bg-papel', adesivo: 'lista', legenda: t('calendario.tarefaA') }))
    const comHora = [...eventos, ...deConsultas].sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
    return [...comHora, ...deTarefas]
  }
}

function ItemCalendario({ item, compacto = false }: { item: Item; compacto?: boolean }) {
  const conteudo = (
    <>
      <Adesivo nome={item.adesivo} tamanho={compacto ? 16 : 20} />
      <span className={`min-w-0 flex-1 ${compacto ? 'truncate' : '[overflow-wrap:normal] hyphens-auto'}`}>
        {item.hora && <span className={`font-bold tabular-nums ${compacto ? 'mr-1' : 'block'}`}>{item.hora}</span>}
        {item.titulo}
      </span>
    </>
  )
  const classes = `flex w-full items-start gap-1.5 rounded-xl border-2 border-linha/50 px-2 text-left ${compacto ? 'py-0.5 text-xs' : 'py-1 text-sm'} font-semibold ${item.tom}`
  return item.abrir ? (
    <button type="button" onClick={item.abrir} className={classes} title={`${item.titulo}${item.legenda ? ` · ${item.legenda}` : ''}`}>
      {conteudo}
    </button>
  ) : (
    <div className={classes} title={`${item.titulo} · ${item.legenda}`}>
      {conteudo}
    </div>
  )
}

function Importar() {
  const { t } = useTranslation()
  const seletor = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState('')
  async function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      const r = await importarCalendario(arquivo)
      const texto = t('calendario.importado', r)
      setMensagem(`✓ ${texto}`)
      mostrarAviso(texto)
    } catch {
      setMensagem(`! ${t('calendario.importarErro')}`)
    } finally {
      if (seletor.current) seletor.current.value = ''
    }
  }
  return (
    <details className="cartao bg-papel p-5">
      <summary className="cursor-pointer text-lg font-bold">{t('calendario.importar')}</summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="font-semibold">{t('calendario.importarTitulo')}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{t('calendario.importarApple')}</li>
          <li>{t('calendario.importarGoogle')}</li>
        </ul>
        <p className="text-sm text-tinta-suave">{t('calendario.importarDica')}</p>
        <label className="self-start">
          <span className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2">
            {t('calendario.escolherArquivo')}
            <input
              ref={seletor}
              id="arquivo-calendario"
              type="file"
              accept=".ics,.zip,text/calendar,application/zip"
              className="so-leitor"
              onChange={(e) => aoEscolher(e.target.files?.[0])}
            />
          </span>
        </label>
        <p aria-live="polite" className="min-h-6 font-semibold">
          {mensagem}
        </p>
      </div>
    </details>
  )
}

export function Calendario() {
  const { t, i18n } = useTranslation()
  const eventos = useEventos()
  const consultas = useConsultas()
  const tarefas = useTarefas()
  const hoje = diaLocal()
  const [visao, setVisao] = useState<'semana' | 'mes'>('semana')
  const [referencia, setReferencia] = useState<Dia>(hoje)
  const [selecionado, setSelecionado] = useState<Dia>(hoje)
  const [editando, setEditando] = useState<{ evento: Evento; novo: boolean } | null>(null)

  const semana = diasDaSemana(referencia)
  const grade = gradeDoMes(referencia)
  const de = visao === 'semana' ? semana[0] : grade[0][0]
  const ate = visao === 'semana' ? semana[6] : grade[5][6]
  const lista = useMemo(() => (eventos ? ocorrencias(eventos, de, ate) : []), [eventos, de, ate])
  const itensDoDia = useItensDoDia(lista, consultas ?? [], tarefas ?? [], (e) => setEditando({ evento: e, novo: false }))
  if (!eventos || !consultas || !tarefas) return null

  const mover = (n: number) => {
    if (visao === 'semana') setReferencia(somarDias(referencia, 7 * n))
    else {
      const d = new Date(`${referencia.slice(0, 7)}-01T12:00:00`)
      d.setMonth(d.getMonth() + n)
      setReferencia(diaLocal(d))
    }
  }
  const data = (dia: Dia, opcoes: Intl.DateTimeFormatOptions) => new Date(`${dia}T12:00:00`).toLocaleDateString(i18n.language, opcoes)
  const rotuloPeriodo =
    visao === 'semana'
      ? `${data(semana[0], { day: 'numeric', month: 'short' })} – ${data(semana[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
      : data(referencia, { month: 'long', year: 'numeric' })
  const novoNoDia = (dia: Dia) => setEditando({ evento: novoEvento(momento(dia, '09:00')), novo: true })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="calendario" tamanho={56} />
          {t('calendario.titulo')}
        </h1>
        <Botao onClick={() => novoNoDia(selecionado)} icone={<span aria-hidden="true">+</span>}>
          {t('calendario.novo')}
        </Botao>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t('calendario.titulo')} className="flex rounded-full border-2 border-linha bg-papel p-0.5">
          {(['semana', 'mes'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={visao === v}
              onClick={() => setVisao(v)}
              className={`min-h-10 rounded-full px-4 font-bold ${visao === v ? 'bg-botao text-botao-texto' : ''}`}
            >
              {t(`calendario.${v}`)}
            </button>
          ))}
        </div>
        <Botao variante="contorno" className="min-h-10 px-3" onClick={() => mover(-1)} aria-label={t('calendario.anterior')}>
          ←
        </Botao>
        <Botao variante="contorno" className="min-h-10 px-4" onClick={() => { setReferencia(hoje); setSelecionado(hoje) }}>
          {t('calendario.hoje')}
        </Botao>
        <Botao variante="contorno" className="min-h-10 px-3" onClick={() => mover(1)} aria-label={t('calendario.proximo')}>
          →
        </Botao>
        <p className="ml-1 text-xl font-semibold first-letter:uppercase" aria-live="polite">
          {rotuloPeriodo}
        </p>
      </div>

      {visao === 'semana' ? (
        <ol className="grid gap-2 md:grid-cols-7">
          {semana.map((dia) => {
            const itens = itensDoDia(dia)
            const eHoje = dia === hoje
            return (
              <li key={dia} className={`relative flex min-h-36 flex-col gap-1.5 rounded-[1.25rem] border-2 p-2 ${eHoje ? 'border-linha bg-papel shadow-[3px_3px_0_var(--linha)]' : 'border-linha/40 bg-papel'}`}>
                <button type="button" onClick={() => novoNoDia(dia)} className="relative flex items-baseline gap-1.5 self-start rounded-lg px-1" aria-label={`${t('calendario.novo')}: ${data(dia, { weekday: 'long', day: 'numeric', month: 'long' })}`}>
                  <span className="rotulo">{data(dia, { weekday: 'short' }).replace('.', '')}</span>
                  <span className="relative font-titulo text-xl font-semibold">
                    {eHoje && <CirculoCaneta />}
                    {Number(dia.slice(8))}
                  </span>
                </button>
                {itens.length ? itens.map((item) => <ItemCalendario key={item.chave} item={item} />) : <p className="px-1 text-xs text-tinta-suave">{t('calendario.vazioDia')}</p>}
              </li>
            )
          })}
        </ol>
      ) : (
        <>
          <div aria-label={rotuloPeriodo} className="grid grid-cols-7 gap-1">
            {semana.map((dia) => (
              <span key={dia} aria-hidden="true" className="rotulo text-center">
                {data(dia, { weekday: 'short' }).replace('.', '')}
              </span>
            ))}
            {grade.flat().map((dia) => {
              const itens = itensDoDia(dia)
              const doMes = mesmoMes(dia, referencia)
              return (
                <button
                  key={dia}
                  type="button"
                  aria-pressed={dia === selecionado}
                  aria-label={`${data(dia, { weekday: 'long', day: 'numeric', month: 'long' })}: ${itens.length}`}
                  onClick={() => setSelecionado(dia)}
                  className={`relative flex min-h-16 flex-col gap-0.5 overflow-hidden rounded-xl border-2 p-1 text-left sm:min-h-24 ${
                    dia === selecionado ? 'border-linha bg-destaque-claro' : doMes ? 'border-linha/30 bg-papel' : 'border-transparent'
                  }`}
                >
                  <span className={`relative self-start px-1 text-sm font-bold ${doMes ? '' : 'text-tinta-suave'}`}>
                    {dia === hoje && <CirculoCaneta />}
                    {Number(dia.slice(8))}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {itens.slice(0, 2).map((item) => (
                      <span key={item.chave} className={`truncate rounded-md px-1 text-[0.7rem] font-semibold ${item.tom}`}>
                        {item.hora && <span className="tabular-nums">{item.hora} </span>}
                        {item.titulo}
                      </span>
                    ))}
                    {itens.length > 2 && <span className="px-1 text-[0.7rem] font-bold">{t('calendario.mais', { count: itens.length - 2 })}</span>}
                  </span>
                  {itens.length > 0 && (
                    <span className="flex gap-0.5 px-1 sm:hidden" aria-hidden="true">
                      {itens.slice(0, 3).map((item) => (
                        <span key={item.chave} className={`h-2 w-2 rounded-full border border-linha ${item.tom}`} />
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <section aria-labelledby="titulo-dia-sel" className="cartao flex flex-col gap-2 bg-papel p-4">
            <h2 id="titulo-dia-sel" className="text-xl font-semibold first-letter:uppercase">
              {data(selecionado, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {itensDoDia(selecionado).length ? (
              itensDoDia(selecionado).map((item) => <ItemCalendario key={item.chave} item={item} />)
            ) : (
              <p className="text-sm">{t('calendario.vazioDia')}</p>
            )}
            <Botao variante="secundario" tom="bg-manteiga" className="self-start" onClick={() => novoNoDia(selecionado)}>
              + {t('calendario.novo')}
            </Botao>
          </section>
        </>
      )}

      <Importar />

      {editando && <EditorEvento evento={editando.evento} novo={editando.novo} fechar={() => setEditando(null)} />}
    </div>
  )
}
