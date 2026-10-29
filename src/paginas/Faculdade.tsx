// Faculdade: provas e entregas do semestre (cadastradas de uma vez), quanto falta para cada uma,
// e o planejamento de trás para frente, que transforma o conteúdo da prova em sessões curtas com data.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import type { Tarefa } from '../dados/banco'
import {
  apagarAvaliacao,
  apagarSessoes,
  atualizarAvaliacao,
  concluirAvaliacao,
  criarSessoes,
  mudarConfigFaculdade,
  restaurarAvaliacao,
  salvarAvaliacoes,
  useAvaliacoes,
  useConfigFaculdade,
  type NovaAvaliacao,
} from '../dados/faculdade'
import { useTarefas } from '../dados/tarefas'
import { novoId } from '../dados/banco'
import { diaLocal, type Dia } from '../logica/datas'
import { diasAte, planejarSessoes, proximas, sessoesParaTarefas, type Avaliacao, type TipoAvaliacao } from '../logica/faculdade'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'
const DURACOES = [25, 35, 45]
const dataDe = (dia: Dia) => new Date(`${dia}T12:00:00`)
const linhaVazia = (materia = ''): NovaAvaliacao => ({ materia, tipo: 'prova', titulo: '', data: '' })

function useDatas() {
  const { i18n } = useTranslation()
  return {
    longa: (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'long' }).replace('.', ''),
    curta: (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''),
  }
}

function Planejador({ a, fechar }: { a: Avaliacao; fechar: () => void }) {
  const { t } = useTranslation()
  const tarefas = useTarefas()
  const datas = useDatas()
  const hoje = diaLocal()
  const [conteudos, setConteudos] = useState((a.conteudos ?? []).join('\n'))
  const [inicio, setInicio] = useState<Dia>(hoje)
  const [duracao, setDuracao] = useState(25)
  const [porDia, setPorDia] = useState<1 | 2>(1)
  const [revisao, setRevisao] = useState(true)
  const lista = conteudos.split('\n').map((c) => c.trim()).filter(Boolean)
  const plano = planejarSessoes(lista, a.data, { inicio, porDia, revisao })

  async function criar() {
    if (!tarefas || !plano.length) return
    const novas: Tarefa[] = sessoesParaTarefas(
      a,
      plano,
      duracao,
      tarefas,
      {
        estudo: (materia, c) => t('faculdade.sessaoTitulo', { materia, conteudos: c }),
        revisao: (materia, titulo) => t('faculdade.revisaoTitulo', { materia, titulo }),
        passo: (c) => t('faculdade.sessaoPasso', { conteudos: c }),
        pronto: t('faculdade.sessaoPronto'),
      },
      novoId,
      new Date().toISOString(),
    )
    await atualizarAvaliacao(a.id, { conteudos: lista })
    await criarSessoes(novas)
    fechar()
    mostrarAviso(t('faculdade.sessoesCriadas', { count: novas.length }), () => apagarSessoes(novas.map((x) => x.id)))
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-linha bg-papel p-4">
      <h4 className="text-lg font-bold">{t('faculdade.planejarTitulo')}</h4>
      <label className="flex flex-col gap-1">
        <span className="font-bold">{t('faculdade.conteudos')}</span>
        <textarea
          rows={4}
          value={conteudos}
          onChange={(e) => setConteudos(e.target.value)}
          placeholder={t('faculdade.conteudosExemplo')}
          className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
        />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('faculdade.comecarEm')}</span>
          <input type="date" value={inicio} min={hoje} onChange={(e) => e.target.value && setInicio(e.target.value)} className={campo} />
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-bold">{t('faculdade.duracao')}</legend>
          <div className="flex gap-1.5">
            {DURACOES.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={duracao === d}
                onClick={() => setDuracao(d)}
                className={`min-h-10 rounded-full border-2 border-linha px-3 text-sm font-semibold ${duracao === d ? 'bg-lavanda' : 'bg-papel'}`}
              >
                {duracao === d && '✓ '}
                {t('faculdade.min', { n: d })}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('faculdade.porDia')}</span>
          <select value={porDia} onChange={(e) => setPorDia(Number(e.target.value) as 1 | 2)} className={campo}>
            <option value={1}>{t('faculdade.umaPorDia')}</option>
            <option value={2}>{t('faculdade.duasPorDia')}</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={revisao} onChange={(e) => setRevisao(e.target.checked)} className="h-5 w-5 accent-[var(--forte-rosa)]" />
          {t('faculdade.revisaoVespera')}
        </label>
      </div>

      <div>
        <p className="rotulo mb-1">{t('faculdade.previa')}</p>
        {plano.length ? (
          <ol className="flex flex-col gap-1">
            {plano.map((s, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 rounded-xl border-2 border-linha/30 px-3 py-1.5 text-sm">
                <span className="font-bold whitespace-nowrap">{datas.curta(s.dia)}</span>
                <span>{s.revisao ? t('faculdade.revisaoGeral') : s.conteudos.join(', ')}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm">{t('faculdade.semDias')}</p>
        )}
        <p className="mt-2 text-sm text-tinta-suave">{t('faculdade.previaDica')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao onClick={criar} disabled={!plano.length}>
          {t('faculdade.criarSessoes', { count: plano.length })}
        </Botao>
        <Botao variante="contorno" onClick={fechar}>
          {t('ajustes.cancelar')}
        </Botao>
      </div>
    </div>
  )
}

function CartaoAvaliacao({ a, sessoes }: { a: Avaliacao; sessoes: Tarefa[] }) {
  const { t } = useTranslation()
  const datas = useDatas()
  const hoje = diaLocal()
  const [planejando, setPlanejando] = useState(false)
  const faltam = diasAte(a, hoje)
  const feitas = sessoes.filter((s) => s.feitaEm).length
  const perto = faltam <= 3

  return (
    <li className={`cartao flex flex-col gap-3 p-4 ${perto ? 'bg-lavanda' : 'bg-papel'}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col items-center rounded-2xl border-2 border-linha bg-papel px-3 py-1.5 text-center">
          {faltam <= 0 ? (
            <span className="font-titulo py-1.5 text-lg leading-none font-semibold">{t('faculdade.hojeCaixa')}</span>
          ) : (
            <>
              <span className="font-titulo text-3xl leading-none font-semibold tabular-nums">{faltam}</span>
              <span className="text-xs font-bold">{t('faculdade.dias', { count: faltam })}</span>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="rotulo">
            {t(`faculdade.tipos.${a.tipo}`)} · {a.materia}
          </p>
          <h3 className="text-xl font-semibold break-words">{a.titulo}</h3>
          <p className="text-sm">
            {datas.longa(a.data)}
            {a.hora && ` · ${a.hora}`}
            {faltam === 0 ? ` · ${t('faculdade.hoje')}` : faltam === 1 ? ` · ${t('faculdade.amanha')}` : ''}
          </p>
          {sessoes.length > 0 && <p className="text-sm font-semibold">{t('faculdade.sessoesFeitas', { feitas, total: sessoes.length })}</p>}
        </div>
      </div>

      {sessoes.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('faculdade.verSessoes')}</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {sessoes.map((s) => (
              <li key={s.id} className="flex gap-2">
                <span aria-hidden="true">{s.feitaEm ? '✓' : '○'}</span>
                <span className="font-bold whitespace-nowrap">{s.dia ? datas.curta(s.dia) : ''}</span>
                <span className={s.feitaEm ? 'line-through' : ''}>
                  {s.titulo}
                  <span className="so-leitor">{s.feitaEm ? ` (${t('faculdade.feita')})` : ''}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {planejando && <Planejador a={a} fechar={() => setPlanejando(false)} />}

      <div className="flex flex-wrap gap-2">
        {a.tipo === 'prova' && !planejando && faltam > 0 && (
          <Botao variante="secundario" tom="bg-lavanda" onClick={() => setPlanejando(true)}>
            {sessoes.length ? t('faculdade.planejarMais') : t('faculdade.planejar')}
          </Botao>
        )}
        <Botao
          variante="contorno"
          onClick={async () => {
            await concluirAvaliacao(a.id, true)
            mostrarAviso(t('faculdade.concluida', { titulo: a.titulo }), () => concluirAvaliacao(a.id, false))
          }}
        >
          ✓ {t(a.tipo === 'prova' ? 'faculdade.jaFiz' : 'faculdade.entreguei')}
        </Botao>
        <Botao
          variante="contorno"
          onClick={async () => {
            const apagada = await apagarAvaliacao(a.id)
            mostrarAviso(t('faculdade.apagada', { titulo: a.titulo }), () => restaurarAvaliacao(apagada))
          }}
        >
          {t('faculdade.apagar')}
        </Botao>
      </div>
    </li>
  )
}

function ConfigurarSemestre({ materias, aberto }: { materias: string[]; aberto: boolean }) {
  const { t } = useTranslation()
  const [linhas, setLinhas] = useState<NovaAvaliacao[]>([linhaVazia(materias[0]), linhaVazia(materias[0])])
  const [novaMateria, setNovaMateria] = useState('')
  const mudar = (i: number, m: Partial<NovaAvaliacao>) => setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...m } : l)))
  const prontas = linhas.filter((l) => l.materia.trim() && l.data)

  async function salvar() {
    const salvas = await salvarAvaliacoes(prontas)
    setLinhas([linhaVazia(materias[0]), linhaVazia(materias[0])])
    mostrarAviso(t('faculdade.salvas', { count: salvas.length }))
  }

  return (
    <details open={aberto} className="cartao bg-papel p-4">
      <summary className="cursor-pointer text-xl font-semibold">{t('faculdade.semestreTitulo')}</summary>
      <div className="mt-4 flex flex-col gap-5">
        <p className="max-w-prose text-sm">{t('faculdade.semestreDica')}</p>
        <div className="flex flex-col gap-2">
          <p className="font-bold">{t('faculdade.materias')}</p>
          <ul className="flex flex-wrap gap-2">
            {materias.map((m) => (
              <li key={m} className="flex items-center gap-1 rounded-full border-2 border-linha bg-lavanda py-1 pr-1 pl-3 text-sm font-semibold">
                {m}
                <button
                  type="button"
                  onClick={() => mudarConfigFaculdade((c) => ({ materias: c.materias.filter((x) => x !== m) }))}
                  aria-label={t('faculdade.tirarMateria', { materia: m })}
                  className="grid h-7 w-7 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const m = novaMateria.trim()
              if (!m) return
              mudarConfigFaculdade((c) => ({ materias: c.materias.includes(m) ? c.materias : [...c.materias, m] }))
              setLinhas((ls) => ls.map((l) => (l.materia ? l : { ...l, materia: m })))
              setNovaMateria('')
            }}
          >
            <label className="min-w-0 flex-1 basis-48">
              <span className="so-leitor">{t('faculdade.novaMateria')}</span>
              <input value={novaMateria} onChange={(e) => setNovaMateria(e.target.value)} maxLength={40} placeholder={t('faculdade.novaMateria')} className={`${campo} w-full`} />
            </label>
            <Botao type="submit" variante="contorno">
              + {t('etiquetas.acrescentar')}
            </Botao>
          </form>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-bold">{t('faculdade.provasEntregas')}</legend>
          {linhas.map((l, i) => (
            <div key={i} className="grid gap-2 rounded-2xl border-2 border-linha/30 p-3 sm:grid-cols-[1fr_auto_1.4fr_auto_auto]">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{t('faculdade.materia')}</span>
                <select value={l.materia} onChange={(e) => mudar(i, { materia: e.target.value })} className={campo}>
                  <option value="">{t('faculdade.escolha')}</option>
                  {materias.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{t('faculdade.tipo')}</span>
                <select value={l.tipo} onChange={(e) => mudar(i, { tipo: e.target.value as TipoAvaliacao })} className={campo}>
                  <option value="prova">{t('faculdade.tipos.prova')}</option>
                  <option value="entrega">{t('faculdade.tipos.entrega')}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{t('faculdade.nome')}</span>
                <input value={l.titulo} onChange={(e) => mudar(i, { titulo: e.target.value })} maxLength={60} placeholder={t('faculdade.nomeExemplo')} className={campo} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{t('faculdade.data')}</span>
                <input type="date" value={l.data} onChange={(e) => mudar(i, { data: e.target.value })} className={campo} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{t('faculdade.hora')}</span>
                <input type="time" value={l.hora ?? ''} onChange={(e) => mudar(i, { hora: e.target.value || undefined })} className={campo} />
              </label>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Botao variante="contorno" onClick={() => setLinhas((ls) => [...ls, linhaVazia(ls.at(-1)?.materia ?? materias[0])])}>
              + {t('faculdade.outraLinha')}
            </Botao>
            <Botao onClick={salvar} disabled={!prontas.length}>
              {t('faculdade.salvarTodas', { count: prontas.length })}
            </Botao>
          </div>
          {!materias.length && <p className="text-sm">{t('faculdade.primeiroMateria')}</p>}
        </fieldset>
      </div>
    </details>
  )
}

export function Faculdade() {
  const { t } = useTranslation()
  const datas = useDatas()
  const avaliacoes = useAvaliacoes()
  const tarefas = useTarefas()
  const config = useConfigFaculdade()
  if (!avaliacoes || !tarefas || !config) return null
  const hoje = diaLocal()
  const lista = proximas(avaliacoes, hoje)
  const passadas = avaliacoes.filter((a) => a.feitaEm || a.data < hoje).sort((a, b) => b.data.localeCompare(a.data))
  const sessoesDe = (id: string) => tarefas.filter((x) => x.avaliacaoId === id).sort((x, y) => (x.dia ?? '').localeCompare(y.dia ?? ''))

  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="livro" tamanho={56} />
        {t('nav.faculdade')}
      </h1>

      <section aria-labelledby="titulo-proximas" className="flex flex-col gap-3">
        <h2 id="titulo-proximas" className="text-2xl font-semibold">
          {t('faculdade.proximas')}
        </h2>
        {lista.length ? (
          <ul className="grid items-start gap-3 lg:grid-cols-2">
            {lista.map((a) => (
              <CartaoAvaliacao key={a.id} a={a} sessoes={sessoesDe(a.id)} />
            ))}
          </ul>
        ) : (
          <p className="cartao bg-lavanda p-5">{t('faculdade.vazio')}</p>
        )}
      </section>

      <ConfigurarSemestre materias={config.materias} aberto={!avaliacoes.length} />

      {passadas.length > 0 && (
        <details className="rounded-[1.5rem] border-2 border-linha/40 p-4">
          <summary className="cursor-pointer font-bold">{t('faculdade.passadas', { count: passadas.length })}</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {passadas.map((a) => (
              <li key={a.id}>
                {a.feitaEm ? '✓' : '·'} {a.materia}: {a.titulo} · {datas.curta(a.data)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
