// Hobbies: o que recarrega, com que frequência, e quais ficaram de lado (há quanto tempo e por quê).
// Registro em um toque ("Fiz hoje"); a duração é opcional. O adesivo desbota quando o hobby fica parado,
// mas nada fica vermelho: dá para pausar de propósito ou arquivar sem culpa.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  anotarMotivo,
  apagarHobby,
  apagarVez,
  atualizarHobby,
  criarHobby,
  definirDuracao,
  registrarVez,
  restaurarHobby,
  useHobbies,
} from '../dados/hobbies'
import { novoEvento } from '../dados/eventos'
import { gradeDoMes, mesmoMes } from '../logica/calendario'
import { somarMeses } from '../logica/consultas'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import {
  ADESIVOS_HOBBY,
  DURACOES_RAPIDAS,
  MOTIVOS_INICIAIS,
  ordenar,
  situacao,
  vezesNoPeriodo,
  type Frequencia,
  type Hobby,
  type Situacao,
  type VezHobby,
} from '../logica/hobbies'
import { diasDaSemana } from '../logica/remedios'
import { Adesivo, type NomeAdesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { EditorEvento } from './EditorEvento'
import { Etiquetas } from './Etiquetas'

const DESBOTE: Record<0 | 1 | 2, string> = {
  0: '',
  1: '[filter:saturate(.55)_opacity(.75)]',
  2: '[filter:saturate(.15)_opacity(.5)] -rotate-6',
}
const dataDe = (dia: Dia) => new Date(`${dia}T12:00:00`)
const criadoNoDia = (h: Hobby) => diaLocal(new Date(h.criadoEm))

function EditorHobby({ hobby, fechar }: { hobby?: Hobby; fechar: () => void }) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(hobby?.nome ?? '')
  const [adesivo, setAdesivo] = useState<NomeAdesivo>(hobby?.adesivo ?? 'musica')
  const [frequencia, setFrequencia] = useState<Frequencia>(hobby?.frequencia ?? { vezes: 2, por: 'semana' })
  const [erro, setErro] = useState('')

  async function salvar() {
    if (!nome.trim()) return setErro(t('hobbies.nomeVazio'))
    if (hobby) await atualizarHobby(hobby.id, { nome: nome.trim(), adesivo, frequencia })
    else await criarHobby({ nome, adesivo, frequencia })
    fechar()
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border-2 border-linha p-4"
      onSubmit={(e) => {
        e.preventDefault()
        salvar()
      }}
    >
      <h3 className="text-xl font-semibold">{hobby ? t('hobbies.editar') : t('hobbies.novo')}</h3>
      <label className="flex flex-col gap-1">
        <span className="font-bold">{t('hobbies.nome')}</span>
        <input
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setErro('')
          }}
          maxLength={40}
          placeholder={t('hobbies.nomeExemplo')}
          aria-invalid={!!erro}
          className="min-h-11 rounded-full border-2 border-linha bg-papel px-4"
        />
        {erro && <span className="text-sm font-bold">{erro}</span>}
      </label>
      <fieldset>
        <legend className="mb-2 font-bold">{t('hobbies.adesivo')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {ADESIVOS_HOBBY.map((a) => (
            <label
              key={a}
              className={`grid h-12 w-12 cursor-pointer place-items-center rounded-xl border-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
                adesivo === a ? 'border-linha bg-lilas' : 'border-transparent'
              }`}
            >
              <input type="radio" name="adesivo-hobby" className="so-leitor" checked={adesivo === a} onChange={() => setAdesivo(a)} aria-label={t(`hobbies.adesivos.${a}`)} />
              <Adesivo nome={a} tamanho={36} />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-2 w-full font-bold">{t('hobbies.frequencia')}</legend>
        <label className="flex items-center gap-2">
          <span className="so-leitor">{t('hobbies.quantasVezes')}</span>
          <select
            value={frequencia.vezes}
            onChange={(e) => setFrequencia({ ...frequencia, vezes: Number(e.target.value) })}
            className="min-h-11 rounded-full border-2 border-linha bg-papel px-3"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {t('hobbies.vezes', { count: n })}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="so-leitor">{t('hobbies.porPeriodo')}</span>
          <select
            value={frequencia.por}
            onChange={(e) => setFrequencia({ ...frequencia, por: e.target.value as Frequencia['por'] })}
            className="min-h-11 rounded-full border-2 border-linha bg-papel px-3"
          >
            <option value="semana">{t('hobbies.porSemana')}</option>
            <option value="mes">{t('hobbies.porMes')}</option>
          </select>
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit">{t('hobbies.salvar')}</Botao>
        <Botao variante="contorno" onClick={fechar}>
          {t('hobbies.cancelar')}
        </Botao>
        {hobby && (
          <Botao
            variante="contorno"
            className="ml-auto"
            onClick={async () => {
              const apagado = await apagarHobby(hobby.id)
              fechar()
              mostrarAviso(t('hobbies.apagado', { nome: hobby.nome }), () => restaurarHobby(apagado))
            }}
          >
            {t('hobbies.apagar')}
          </Botao>
        )}
      </div>
    </form>
  )
}

function PorqueParado({ hobby, fechar }: { hobby: Hobby; fechar: () => void }) {
  const { t } = useTranslation()
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-linha/40 p-3">
      <Etiquetas
        legenda={t('hobbies.porqueParado', { nome: hobby.nome })}
        lista="listaMotivosHobby"
        inicial={MOTIVOS_INICIAIS}
        escolhidos={etiquetas}
        mudar={setEtiquetas}
      />
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">{t('hobbies.porqueTexto')}</span>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} className="min-h-10 rounded-full border-2 border-linha bg-papel px-4" />
      </label>
      <p className="text-sm text-tinta-suave">{t('hobbies.porqueDica')}</p>
      <div className="flex gap-2">
        <Botao
          disabled={!etiquetas.length && !texto.trim()}
          onClick={async () => {
            await anotarMotivo(hobby.id, { etiquetas, texto })
            fechar()
          }}
        >
          {t('hobbies.anotar')}
        </Botao>
        <Botao variante="contorno" onClick={fechar}>
          {t('hobbies.cancelar')}
        </Botao>
      </div>
    </div>
  )
}

function TextoSituacao({ s, vezes }: { s: Situacao; vezes: VezHobby[] }) {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const curto = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '')
  if (s.tipo === 'pausado') return <>{t('hobbies.pausadoAte', { data: curto(s.ate) })}</>
  if (s.tipo === 'deLado')
    return (
      <>
        <strong>{t('hobbies.deLadoHa', { count: s.dias })}</strong>
        {s.motivo && ` · ${t('hobbies.porqueCurto')} ${[...s.motivo.etiquetas, s.motivo.texto && `“${s.motivo.texto}”`].filter(Boolean).join(', ')}`}
      </>
    )
  if (s.tipo === 'emDia') {
    if (vezes.some((v) => v.dia === hoje)) return <>{t('hobbies.feitoHoje')}</>
    if (s.dias === null) return <>{t('hobbies.aindaNao')}</>
    return <>{t('hobbies.ultimaHa', { count: s.dias })}</>
  }
  return null
}

function CartaoHobby({ hobby, s, vezes, aoAgendar, aoEditar }: { hobby: Hobby; s: Situacao; vezes: VezHobby[]; aoAgendar: () => void; aoEditar: () => void }) {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const [porque, setPorque] = useState(false)
  const deHoje = vezes.filter((v) => v.dia === hoje).sort((a, b) => b.quando.localeCompare(a.quando))[0]
  const noPeriodo = vezesNoPeriodo(hobby.frequencia, vezes, hoje, diasDaSemana(hoje)[0])
  const desbote = s.tipo === 'deLado' ? s.desbote : 0
  const curto = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '')

  return (
    <li className="cartao flex flex-col gap-3 bg-papel p-4">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 transition ${DESBOTE[desbote]}`}>
          <Adesivo nome={hobby.adesivo} tamanho={48} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold break-words">{hobby.nome}</h3>
          <p className="text-sm">
            <TextoSituacao s={s} vezes={vezes} />
          </p>
          {s.tipo !== 'pausado' && (
            <p className="text-sm text-tinta-suave">
              {t(hobby.frequencia.por === 'semana' ? 'hobbies.nestaSemana' : 'hobbies.nesteMes', { feitas: noPeriodo, meta: hobby.frequencia.vezes })}
            </p>
          )}
        </div>
      </div>

      {deHoje ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border-2 border-linha bg-lilas px-3 py-1 text-sm font-bold">✓ {t('hobbies.feitoHoje')}</span>
          <span className="text-sm">{t('hobbies.quantoTempo')}</span>
          {DURACOES_RAPIDAS.map((min) => (
            <button
              key={min}
              type="button"
              aria-pressed={deHoje.duracaoMin === min}
              onClick={() => definirDuracao(deHoje.id, min)}
              className={`min-h-9 rounded-full border-2 border-linha px-3 text-sm font-semibold ${deHoje.duracaoMin === min ? 'bg-lilas' : 'bg-papel'}`}
            >
              {min === 60 ? t('hobbies.umaHoraOuMais') : t('hobbies.minutos', { n: min })}
            </button>
          ))}
        </div>
      ) : (
        <Botao
          className="self-start"
          icone={<span aria-hidden="true">✓</span>}
          onClick={async () => {
            const v = await registrarVez(hobby.id)
            mostrarAviso(t('hobbies.registrado', { nome: hobby.nome }), () => apagarVez(v.id))
          }}
        >
          {t('hobbies.fizHoje')}
        </Botao>
      )}

      {porque && <PorqueParado hobby={hobby} fechar={() => setPorque(false)} />}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('hobbies.maisOpcoes')}</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {s.tipo === 'deLado' && !porque && (
            <Botao variante="contorno" onClick={() => setPorque(true)}>
              {t('hobbies.porQueParado')}
            </Botao>
          )}
          {s.tipo === 'pausado' ? (
            <Botao variante="contorno" onClick={() => atualizarHobby(hobby.id, { pausadoAte: undefined })}>
              {t('hobbies.voltarAgora')}
            </Botao>
          ) : (
            [7, 14, 30].map((dias) => (
              <Botao
                key={dias}
                variante="contorno"
                onClick={async () => {
                  await atualizarHobby(hobby.id, { pausadoAte: somarDias(hoje, dias - 1) })
                  mostrarAviso(t('hobbies.pausado', { nome: hobby.nome, data: curto(somarDias(hoje, dias - 1)) }), () =>
                    atualizarHobby(hobby.id, { pausadoAte: hobby.pausadoAte }),
                  )
                }}
              >
                {t(`hobbies.pausar.${dias}`)}
              </Botao>
            ))
          )}
          <Botao variante="contorno" onClick={aoAgendar}>
            {t('hobbies.porNaAgenda')}
          </Botao>
          <Botao variante="contorno" onClick={aoEditar}>
            {t('hobbies.editar')}
          </Botao>
          <Botao
            variante="contorno"
            onClick={async () => {
              await atualizarHobby(hobby.id, { arquivadoEm: new Date().toISOString() })
              mostrarAviso(t('hobbies.arquivado', { nome: hobby.nome }), () => atualizarHobby(hobby.id, { arquivadoEm: undefined }))
            }}
          >
            {t('hobbies.arquivar')}
          </Botao>
        </div>
        <p className="mt-2 text-tinta-suave">{t('hobbies.semCulpa')}</p>
      </details>
    </li>
  )
}

function MesDosHobbies({ hobbies, vezes }: { hobbies: Hobby[]; vezes: VezHobby[] }) {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const [mes, setMes] = useState<Dia>(hoje)
  const porId = new Map(hobbies.map((h) => [h.id, h]))
  const doMes = vezes.filter((v) => mesmoMes(v.dia, mes) && porId.has(v.hobbyId))
  const semanas = gradeDoMes(mes).filter((s) => s.some((d) => mesmoMes(d, mes)))
  const nomeMes = dataDe(mes).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  const totais = hobbies
    .map((h) => {
      const delas = doMes.filter((v) => v.hobbyId === h.id)
      return { h, vezes: delas.length, minutos: delas.reduce((s, v) => s + (v.duracaoMin ?? 0), 0) }
    })
    .filter((x) => x.vezes > 0)
    .sort((a, b) => b.vezes - a.vezes)

  return (
    <section aria-labelledby="titulo-mes-hobbies" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="titulo-mes-hobbies" className="flex-1 text-xl font-semibold first-letter:uppercase">
          {t('hobbies.seuMes', { mes: nomeMes })}
        </h3>
        <Botao variante="contorno" onClick={() => setMes(somarMeses(`${mes.slice(0, 7)}-01`, -1))} aria-label={t('sintomas.mesAnterior')}>
          ‹
        </Botao>
        <Botao
          variante="contorno"
          onClick={() => setMes(somarMeses(`${mes.slice(0, 7)}-01`, 1))}
          aria-label={t('sintomas.mesSeguinte')}
          disabled={mesmoMes(mes, hoje)}
        >
          ›
        </Botao>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <ol className="grid grid-cols-7 gap-1" aria-label={t('hobbies.calendario', { mes: nomeMes })}>
          {semanas[0].map((d) => (
            <li key={`c${d}`} aria-hidden="true" className="text-center text-xs font-bold text-tinta-suave">
              {dataDe(d).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
            </li>
          ))}
          {semanas.flat().map((d) => {
            if (!mesmoMes(d, mes)) return <li key={d} aria-hidden="true" />
            const doDia = doMes.filter((v) => v.dia === d)
            const nomes = [...new Set(doDia.map((v) => porId.get(v.hobbyId)!.nome))]
            const adesivos = [...new Set(doDia.map((v) => porId.get(v.hobbyId)!.adesivo))]
            return (
              <li
                key={d}
                className={`flex aspect-square min-h-10 flex-col items-center gap-0.5 rounded-xl border-2 p-0.5 text-xs ${
                  d > hoje ? 'border-dashed border-linha/20 text-tinta-suave' : 'border-linha/25'
                } ${d === hoje ? 'border-linha font-bold' : ''}`}
              >
                <span className="so-leitor">
                  {dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })}: {nomes.length ? nomes.join(', ') : t('hobbies.diaSem')}
                </span>
                <span aria-hidden="true">{Number(d.slice(8))}</span>
                <span aria-hidden="true" className="flex flex-wrap justify-center">
                  {adesivos.slice(0, 2).map((a) => (
                    <Adesivo key={a} nome={a} tamanho={14} />
                  ))}
                  {adesivos.length > 2 && <span className="text-[0.6rem] font-bold">+{adesivos.length - 2}</span>}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-2">
          {totais.length ? (
            <table className="w-full border-collapse text-sm">
              <caption className="so-leitor">{t('hobbies.totais', { mes: nomeMes })}</caption>
              <thead>
                <tr className="border-b-2 border-linha text-left">
                  <th className="py-1 pr-3">{t('hobbies.colHobby')}</th>
                  <th className="py-1 pr-3">{t('hobbies.colVezes')}</th>
                  <th className="py-1">{t('hobbies.colTempo')}</th>
                </tr>
              </thead>
              <tbody>
                {totais.map(({ h, vezes: n, minutos }) => (
                  <tr key={h.id} className="border-b border-linha/20">
                    <td className="py-1 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Adesivo nome={h.adesivo} tamanho={18} />
                        {h.nome}
                      </span>
                    </td>
                    <td className="py-1 pr-3 tabular-nums">{n}</td>
                    <td className="py-1 tabular-nums">{minutos ? t('hobbies.tempo', { h: Math.floor(minutos / 60), min: minutos % 60 }) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-tinta-suave">{t('hobbies.mesVazio')}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export function Hobbies() {
  const { t } = useTranslation()
  const dados = useHobbies()
  const [editando, setEditando] = useState<Hobby | 'novo' | null>(null)
  const [agendando, setAgendando] = useState<Hobby | null>(null)
  if (!dados) return null
  const hoje = diaLocal()
  const vezesDe = (id: string) => dados.vezes.filter((v) => v.hobbyId === id)
  const ativos = ordenar(
    dados.hobbies.filter((h) => !h.arquivadoEm).map((hobby) => ({ hobby, situacao: situacao(hobby, vezesDe(hobby.id), hoje, criadoNoDia(hobby)) })),
  )
  const arquivados = dados.hobbies.filter((h) => h.arquivadoEm)
  const deLado = ativos.filter((a) => a.situacao.tipo === 'deLado')

  return (
    <section aria-labelledby="titulo-hobbies" className="cartao flex flex-col gap-5 bg-papel p-3 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Adesivo nome="flor" tamanho={44} />
        <h2 id="titulo-hobbies" className="flex-1 text-2xl font-semibold">
          {t('bemEstar.ferramentas.hobbies.nome')}
        </h2>
        {editando === null && (
          <Botao variante="contorno" onClick={() => setEditando('novo')}>
            + {t('hobbies.novo')}
          </Botao>
        )}
      </div>

      {ativos.length > 0 && (
        <p className="rounded-2xl border-2 border-linha/40 p-3" aria-live="polite">
          {deLado.length ? (
            <>
              <strong>{t('hobbies.deLadoAgora')}</strong>{' '}
              {deLado
                .map(({ hobby, situacao: s }) =>
                  s.tipo === 'deLado'
                    ? `${hobby.nome} (${[t('hobbies.ha', { count: s.dias }), ...(s.motivo ? s.motivo.etiquetas : [])].join(', ')})`
                    : '',
                )
                .join(' · ')}
            </>
          ) : (
            t('hobbies.tudoEmDia')
          )}
        </p>
      )}

      {editando !== null && <EditorHobby hobby={editando === 'novo' ? undefined : editando} fechar={() => setEditando(null)} />}

      {ativos.length === 0 && editando === null && (
        <div className="flex flex-col items-start gap-3">
          <p>{t('hobbies.vazio')}</p>
          <Botao onClick={() => setEditando('novo')}>+ {t('hobbies.novo')}</Botao>
        </div>
      )}

      {ativos.length > 0 && (
        <ul className="grid items-start gap-3 md:grid-cols-2">
          {ativos.map(({ hobby, situacao: s }) => (
            <CartaoHobby
              key={hobby.id}
              hobby={hobby}
              s={s}
              vezes={vezesDe(hobby.id)}
              aoAgendar={() => setAgendando(hobby)}
              aoEditar={() => setEditando(hobby)}
            />
          ))}
        </ul>
      )}

      {arquivados.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">
            {t('hobbies.arquivados', { count: arquivados.length })}
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {arquivados.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-linha/40 px-3 py-2">
                <span className="[filter:saturate(.3)_opacity(.7)]">
                  <Adesivo nome={h.adesivo} tamanho={28} />
                </span>
                <span className="flex-1 font-semibold">{h.nome}</span>
                <Botao variante="contorno" onClick={() => atualizarHobby(h.id, { arquivadoEm: undefined, pausadoAte: undefined })}>
                  {t('hobbies.trazerDeVolta')}
                </Botao>
              </li>
            ))}
          </ul>
        </details>
      )}

      {dados.hobbies.length > 0 && (
        <>
          <hr className="border-t-2 border-linha/20" />
          <MesDosHobbies hobbies={dados.hobbies} vezes={dados.vezes} />
        </>
      )}

      {agendando && (
        <EditorEvento
          evento={(() => {
            const amanha = new Date()
            amanha.setDate(amanha.getDate() + 1)
            amanha.setHours(19, 0, 0, 0)
            return novoEvento(amanha, agendando.nome)
          })()}
          novo
          fechar={() => setAgendando(null)}
          aoSalvar={() => mostrarAviso(t('hobbies.agendado', { nome: agendando.nome }))}
        />
      )}
    </section>
  )
}
