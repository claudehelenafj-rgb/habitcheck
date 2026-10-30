// Sono: horário fixo de acordar, rotina para desacelerar, diário de sono e as últimas 2 semanas.
// "Não consigo dormir" abre uma tela escura e parada. Se a maioria das noites for difícil por algumas
// semanas, um cartão gentil sugere conversar com um profissional (e some quando a pessoa fecha).

import type { TFunction } from 'i18next'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { mudarBemEstar, mudarSono, useBemEstar, type ConfigBemEstar } from '../dados/bemEstar'
import { desfazerNoite, salvarNoite, useSonos } from '../dados/sono'
import { useAgora } from '../dados/timer'
import { pedirPermissaoAvisos, permissaoAvisos, type PermissaoAvisos } from '../lembretes'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import {
  DEMORAS,
  minutosDeSono,
  noiteDaRotina,
  noiteDificil,
  resumoSono,
  ROTINA_INICIAL,
  sugerirAvaliacao,
  type ConfigSono,
  type Demora,
  type Despertares,
  type Qualidade,
  type RegistroSono,
} from '../logica/sono'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campoHora = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'
const QUALIDADES: Qualidade[] = [1, 2, 3, 4, 5]
const DESPERTARES: Despertares[] = [0, 1, 2, 3]
const dataDe = (dia: Dia) => new Date(`${dia}T12:00:00`)
// noite difícil: listrado, além da cor (no escuro os dois tons ficam parecidos)
const LISTRADO = 'bg-[repeating-linear-gradient(135deg,var(--claro-lilas)_0_4px,var(--papel)_4px_8px)]'

function Escolha<T extends string | number>({
  legenda,
  opcoes,
  valor,
  mudar,
  rotulo,
}: {
  legenda: string
  opcoes: T[]
  valor?: T
  mudar: (v: T) => void
  rotulo: (v: T) => string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-bold">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={String(o)}
            type="button"
            aria-pressed={valor === o}
            onClick={() => mudar(o)}
            className={`min-h-10 rounded-full border-2 border-linha px-3 text-sm font-semibold ${valor === o ? 'bg-lilas' : 'bg-papel'}`}
          >
            {valor === o && '✓ '}
            {rotulo(o)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function duracao(min: number, t: TFunction) {
  return t('sono.duracao', { h: Math.floor(min / 60), min: String(min % 60).padStart(2, '0') })
}

function FormularioNoite({ sono, inicial, noite, fechar }: { sono: ConfigSono; inicial?: RegistroSono; noite: Dia; fechar?: () => void }) {
  const { t } = useTranslation()
  const [dia, setDia] = useState<Dia>(inicial?.noite ?? noite)
  const [deitou, setDeitou] = useState(inicial?.deitou ?? sono.deitarAs ?? '23:00')
  const [levantou, setLevantou] = useState(inicial?.levantou ?? sono.acordarAs ?? '07:00')
  const [demora, setDemora] = useState<Demora | undefined>(inicial?.demora)
  const [despertares, setDespertares] = useState<Despertares>(inicial?.despertares ?? 0)
  const [qualidade, setQualidade] = useState<Qualidade | undefined>(inicial?.qualidade)
  const [nota, setNota] = useState(inicial?.nota ?? '')
  const ontem = somarDias(diaLocal(), -1)
  const falta = [!demora && t('sono.faltaDemora'), !qualidade && t('sono.faltaQualidade')].filter(Boolean)

  async function salvar() {
    if (!demora || !qualidade) return
    const r = await salvarNoite({ noite: dia, deitou, levantou, demora, despertares, qualidade, nota })
    mostrarAviso(t('sono.anotada'), () => desfazerNoite(r.salvo, r.anterior))
    fechar?.()
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        salvar()
      }}
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('sono.noiteDe')}</span>
          <input type="date" value={dia} max={ontem} onChange={(e) => e.target.value && setDia(e.target.value)} className={campoHora} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('sono.deitei')}</span>
          <input type="time" value={deitou} onChange={(e) => e.target.value && setDeitou(e.target.value)} className={campoHora} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('sono.levantei')}</span>
          <input type="time" value={levantou} onChange={(e) => e.target.value && setLevantou(e.target.value)} className={campoHora} />
        </label>
      </div>
      <Escolha legenda={t('sono.demorei')} opcoes={DEMORAS} valor={demora} mudar={setDemora} rotulo={(d) => t(`sono.demoras.${d}`)} />
      <Escolha
        legenda={t('sono.acordeiNoite')}
        opcoes={DESPERTARES}
        valor={despertares}
        mudar={setDespertares}
        rotulo={(n) => (n === 3 ? t('sono.tresOuMais') : String(n))}
      />
      <Escolha legenda={t('sono.comoFoi')} opcoes={QUALIDADES} valor={qualidade} mudar={setQualidade} rotulo={(q) => t(`sono.qualidades.${q}`)} />
      <label className="flex flex-col gap-1">
        <span className="font-bold">{t('sono.nota')}</span>
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} className="min-h-11 rounded-full border-2 border-linha bg-papel px-4" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" disabled={falta.length > 0}>
          {t('sono.anotar')}
        </Botao>
        {fechar && (
          <Botao variante="contorno" onClick={fechar}>
            {t('hobbies.cancelar')}
          </Botao>
        )}
        {falta.length > 0 && <span className="text-sm">{t('sintomas.falta', { lista: falta.join(', ') })}</span>}
      </div>
    </form>
  )
}

function ResumoDaNoite({ r }: { r: RegistroSono }) {
  const { t } = useTranslation()
  return (
    <p>
      {t('sono.resumoNoite', {
        deitou: r.deitou,
        levantou: r.levantou,
        sono: duracao(minutosDeSono(r), t),
        demora: t(`sono.demoras.${r.demora}`),
        qualidade: t(`sono.qualidades.${r.qualidade}`).toLowerCase(),
      })}{' '}
      {t('sono.acordou', { count: r.despertares })}
      {r.nota && ` · “${r.nota}”`}
    </p>
  )
}

function DuasSemanas({ registros }: { registros: RegistroSono[] }) {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const noites = Array.from({ length: 14 }, (_, i) => somarDias(hoje, -14 + i))
  const porNoite = new Map(registros.map((r) => [r.noite, r]))
  const resumo = resumoSono(registros, somarDias(hoje, -7))
  const MAX = 10 * 60
  const curto = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '')
  return (
    <section aria-labelledby="titulo-duas-semanas" className="flex flex-col gap-3">
      <h3 id="titulo-duas-semanas" className="text-xl font-semibold">
        {t('sono.duasSemanas')}
      </h3>
      {resumo ? (
        <p>
          {t('sono.resumoSemana', {
            noites: t('sono.nNoites', { count: resumo.noites }),
            sono: duracao(resumo.sonoMedioMin, t),
            qualidade: resumo.qualidadeMedia.toLocaleString(i18n.language),
          })}
          {resumo.demoraramMais30 > 0 && ` ${t('sono.demoraram', { count: resumo.demoraramMais30 })}`}
        </p>
      ) : (
        <p className="text-sm text-tinta-suave">{t('sono.semNoites')}</p>
      )}
      <figure>
        <div className="relative grid h-36 grid-cols-14 items-end gap-1 border-b-2 border-linha" aria-hidden="true">
          {/* linha de referência de 7 horas */}
          <span className="absolute inset-x-0 border-t-2 border-dashed border-linha/30" style={{ bottom: `${(7 * 60 * 100) / MAX}%` }} />
          {noites.map((n) => {
            const r = porNoite.get(n)
            const alt = r ? Math.min(100, (minutosDeSono(r) * 100) / MAX) : 0
            return r ? (
              <span
                key={n}
                className={`relative rounded-t-md border-2 border-b-0 border-linha ${noiteDificil(r) ? LISTRADO : 'bg-ameixa'}`}
                style={{ height: `${Math.max(alt, 4)}%` }}
              />
            ) : (
              <span key={n} className="h-1.5 rounded-t-md border-2 border-b-0 border-dashed border-linha/30" />
            )
          })}
        </div>
        <div className="mt-1 grid grid-cols-14 gap-1 text-center text-[0.65rem] tabular-nums" aria-hidden="true">
          {noites.map((n) => (
            <span key={n}>{Number(n.slice(8))}</span>
          ))}
        </div>
        <figcaption className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-linha bg-ameixa" /> {t('sono.legendaBoa')}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm border-2 border-linha ${LISTRADO}`} /> {t('sono.legendaDificil')}
          </span>
          <span>{t('sono.legenda7h')}</span>
        </figcaption>
      </figure>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('sintomas.verTabela')}</summary>
        <table className="mt-2 w-full border-collapse">
          <caption className="so-leitor">{t('sono.duasSemanas')}</caption>
          <thead>
            <tr className="border-b-2 border-linha text-left">
              <th className="py-1 pr-3">{t('sono.colNoite')}</th>
              <th className="py-1 pr-3">{t('sono.colSono')}</th>
              <th className="py-1 pr-3">{t('sono.colDemora')}</th>
              <th className="py-1">{t('sono.colQualidade')}</th>
            </tr>
          </thead>
          <tbody>
            {noites.map((n) => {
              const r = porNoite.get(n)
              return (
                <tr key={n} className="border-b border-linha/20">
                  <td className="py-1 pr-3">{curto(n)}</td>
                  <td className="py-1 pr-3 tabular-nums">{r ? duracao(minutosDeSono(r), t) : t('sono.semAnotacao')}</td>
                  <td className="py-1 pr-3">{r ? t(`sono.demoras.${r.demora}`) : '–'}</td>
                  <td className="py-1">{r ? t(`sono.qualidades.${r.qualidade}`) : '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </details>
    </section>
  )
}

/** Rotina de desacelerar da noite (também usada no ritual da noite). */
export function RotinaDesacelerar({ config, noite }: { config: ConfigBemEstar; noite: Dia }) {
  const { t } = useTranslation()
  const [editando, setEditando] = useState(false)
  const [novo, setNovo] = useState('')
  const passos = config.sono?.rotina ?? ROTINA_INICIAL
  const feitos = config.rotinaFeita?.noite === noite ? config.rotinaFeita.ids : []
  return (
    <section aria-labelledby="titulo-rotina" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 id="titulo-rotina" className="flex-1 text-xl font-semibold">
          {t('sono.rotinaTitulo')}
        </h3>
        <span className="font-bold tabular-nums" aria-live="polite">
          {t('sono.rotinaFeitos', { feitos: feitos.filter((id) => passos.some((p) => p.id === id)).length, total: passos.length })}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {passos.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-2xl border-2 border-linha/40 px-3 py-1.5">
              <input
                type="checkbox"
                checked={feitos.includes(p.id)}
                onChange={() =>
                  mudarBemEstar((c) => {
                    const ja = c.rotinaFeita?.noite === noite ? c.rotinaFeita.ids : []
                    return { rotinaFeita: { noite, ids: ja.includes(p.id) ? ja.filter((x) => x !== p.id) : [...ja, p.id] } }
                  })
                }
                className="h-5 w-5 shrink-0 accent-[var(--forte-ameixa)]"
              />
              <span className={feitos.includes(p.id) ? 'line-through decoration-2' : ''}>{p.texto}</span>
            </label>
            {editando && (
              <button
                type="button"
                onClick={() => mudarBemEstar((c) => ({ sono: { ...c.sono, rotina: (c.sono?.rotina ?? ROTINA_INICIAL).filter((x) => x.id !== p.id) } }))}
                aria-label={t('etiquetas.tirar', { nome: p.texto })}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        {editando && (
          <form
            className="flex min-w-0 flex-1 basis-60 gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!novo.trim()) return
              const passo = { id: crypto.randomUUID(), texto: novo.trim() }
              mudarBemEstar((c) => ({ sono: { ...c.sono, rotina: [...(c.sono?.rotina ?? ROTINA_INICIAL), passo] } }))
              setNovo('')
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="so-leitor">{t('sono.novoPasso')}</span>
              <input
                value={novo}
                onChange={(e) => setNovo(e.target.value)}
                maxLength={60}
                placeholder={t('sono.novoPasso')}
                className="min-h-10 w-full rounded-full border-2 border-linha bg-papel px-4"
              />
            </label>
            <Botao type="submit" variante="contorno">
              + {t('etiquetas.acrescentar')}
            </Botao>
          </form>
        )}
        <Botao variante="contorno" onClick={() => setEditando((e) => !e)} aria-pressed={editando}>
          {editando ? t('etiquetas.pronto') : t('sono.editarRotina')}
        </Botao>
      </div>
    </section>
  )
}

function Horarios({ config }: { config: ConfigBemEstar }) {
  const { t } = useTranslation()
  const sono = config.sono ?? {}
  const [permissao, setPermissao] = useState<PermissaoAvisos>(permissaoAvisos)
  // começa aberto só se ainda não há horário; depois fica como a pessoa deixar (não fecha enquanto ela digita)
  const [abertoNoComeco] = useState(!sono.acordarAs)
  const mudar = mudarSono
  return (
    <details open={abertoNoComeco} className="rounded-2xl border-2 border-linha/40 p-3">
      <summary className="cursor-pointer text-lg font-bold">
        {sono.acordarAs ? t('sono.horariosResumo', { hora: sono.acordarAs }) : t('sono.horariosTitulo')}
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <p className="text-sm">{t('sono.horarioDica')}</p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('sono.acordarAs')}</span>
            <input type="time" value={sono.acordarAs ?? ''} onChange={(e) => mudar({ acordarAs: e.target.value || undefined })} className={campoHora} />
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={!!sono.lembreteAcordar}
              disabled={!sono.acordarAs}
              onChange={(e) => mudar({ lembreteAcordar: e.target.checked })}
              className="h-5 w-5 accent-[var(--forte-ameixa)]"
            />
            {t('sono.avisarAcordar')}
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('sono.deitarAs')}</span>
            <input type="time" value={sono.deitarAs ?? ''} onChange={(e) => mudar({ deitarAs: e.target.value || undefined })} className={campoHora} />
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={!!sono.lembreteRotina}
              disabled={!sono.deitarAs}
              onChange={(e) => mudar({ lembreteRotina: e.target.checked })}
              className="h-5 w-5 accent-[var(--forte-ameixa)]"
            />
            {t('sono.avisarDesacelerar')}
          </label>
        </div>
        {(sono.lembreteAcordar || sono.lembreteRotina) && (
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
      </div>
    </details>
  )
}

export function Sono() {
  const { t, i18n } = useTranslation()
  const agora = useAgora(60_000)
  const hoje = diaLocal(agora)
  const config = useBemEstar()
  const registros = useSonos()
  const [editando, setEditando] = useState(false)
  if (!config || !registros) return null
  const sono = config.sono ?? {}
  const ontem = somarDias(hoje, -1)
  const daNoite = registros.find((r) => r.noite === ontem)
  const avaliar = sugerirAvaliacao(registros, hoje, sono.avaliacaoDispensadaEm)
  const nomeNoite = (d: Dia) =>
    t('sono.noiteDeA', {
      de: dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric' }),
      a: dataDe(somarDias(d, 1)).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' }),
    })

  return (
    <section aria-labelledby="titulo-sono" className="cartao flex flex-col gap-6 bg-papel p-3 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Adesivo nome="lua" tamanho={44} />
        <h2 id="titulo-sono" className="flex-1 text-2xl font-semibold">
          {t('bemEstar.ferramentas.sono.nome')}
        </h2>
        <Link
          to="/nao-consigo-dormir"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto"
        >
          {t('sono.naoConsigo')}
        </Link>
      </div>

      {avaliar && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-linha bg-lilas p-4" role="note">
          <p className="font-bold">{t('sono.avaliacaoTitulo')}</p>
          <p>{t('sono.avaliacaoTexto')}</p>
          <Botao
            variante="contorno"
            className="self-start"
            onClick={() => mudarSono({ avaliacaoDispensadaEm: hoje })}
          >
            {t('sono.avaliacaoFechar')}
          </Botao>
        </div>
      )}

      <section aria-labelledby="titulo-noite" className="flex flex-col gap-3">
        <h3 id="titulo-noite" className="text-xl font-semibold">
          {daNoite && !editando ? nomeNoite(ontem) : t('sono.comoFoiNoite')}
        </h3>
        {daNoite && !editando ? (
          <>
            <ResumoDaNoite r={daNoite} />
            <div className="flex flex-wrap gap-2">
              <Botao variante="contorno" onClick={() => setEditando(true)}>
                {t('sono.editarNoite')}
              </Botao>
            </div>
          </>
        ) : (
          <FormularioNoite
            // horários novos entram como sugestão no formulário
            key={`${daNoite?.id ?? 'nova'}|${sono.deitarAs}|${sono.acordarAs}`}
            sono={sono}
            inicial={editando ? daNoite : undefined}
            noite={ontem}
            fechar={editando ? () => setEditando(false) : undefined}
          />
        )}
        {daNoite && !editando && (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('sono.outraNoite')}</summary>
            <div className="mt-3">
              <FormularioNoite sono={sono} noite={somarDias(ontem, -1)} />
            </div>
          </details>
        )}
      </section>

      <hr className="border-t-2 border-linha/20" />
      <RotinaDesacelerar config={config} noite={noiteDaRotina(agora, hoje)} />
      <hr className="border-t-2 border-linha/20" />
      <DuasSemanas registros={registros} />
      <Horarios config={config} />
    </section>
  )
}
