// Consultas: marcadas (com a linha "arrumar → sair → consulta", preparo e .ics),
// "preciso marcar" (prazo e repetição) e as que já foram.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { EditorConsulta } from '../componentes/EditorConsulta'
import { baixarArquivo } from '../baixar'
import { alternarPreparo, desfazerFeita, marcarComoFeita, novaConsulta, useConsultas } from '../dados/consultas'
import { gerarIcs, nomeArquivoIcs, planoReverso, situacaoMarcar, type Consulta } from '../logica/consultas'
import { diaLocal } from '../logica/datas'

function CartaoMarcada({ c, editar }: { c: Consulta; editar: () => void }) {
  const { t, i18n } = useTranslation()
  const plano = planoReverso(c)
  const hhmm = (d: Date) => d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  const data = c.data ? new Date(`${c.data}T12:00:00`) : undefined

  function calendario() {
    const ics = gerarIcs(c, { arrumar: t('consultas.arrumarPara', { titulo: c.titulo }), sair: t('consultas.sairPara', { titulo: c.titulo }) })
    if (ics) baixarArquivo(nomeArquivoIcs(c), ics, 'text/calendar')
  }

  async function jaFui() {
    const proxima = await marcarComoFeita(c)
    const texto = proxima?.marcarAte
      ? `${t('consultas.jaFuiAviso')} ${t('consultas.proxima', { data: new Date(`${proxima.marcarAte}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) })}`
      : t('consultas.jaFuiAviso')
    mostrarAviso(texto, () => desfazerFeita(c, proxima))
  }

  return (
    <article className="cartao flex flex-col gap-4 bg-azul-nevoa p-5">
      <div className="flex flex-wrap items-start gap-4">
        {data && (
          <div className="flex flex-col items-center rounded-2xl border-2 border-linha bg-papel px-3 py-2 text-center">
            <span className="rotulo">{data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '')}</span>
            <span className="font-titulo text-3xl leading-none font-semibold">{data.getDate()}</span>
            <span className="text-xs font-bold">{data.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', '')}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-semibold break-words">{c.titulo}</h3>
          <p className="font-semibold tabular-nums">
            {c.hora}
            {c.profissional && ` · ${c.profissional}`}
          </p>
          {c.local && <p className="text-sm break-words">{c.local}</p>}
          {c.recorrenciaMeses && <p className="text-sm">↻ {t('consultas.repete', { n: c.recorrenciaMeses })}</p>}
        </div>
        <button type="button" onClick={editar} className="text-sm font-bold underline decoration-2 underline-offset-4">
          {t('consultas.editar')}
        </button>
      </div>

      {plano && (
        <ol className="grid gap-2 sm:grid-cols-3" aria-label={t('consultas.consulta')}>
          {[
            [t('consultas.arrumar'), plano.comecarArrumar, 'flor'],
            [t('consultas.sair'), plano.sairDeCasa, 'balao'],
            [t('consultas.consulta'), plano.inicio, 'prancheta'],
          ].map(([rotulo, quando, adesivo], i) => (
            <li key={i} className="flex items-center gap-2 rounded-2xl border-2 border-linha bg-papel p-3">
              <Adesivo nome={adesivo as 'flor'} tamanho={28} />
              <span className="flex flex-col">
                <span className="font-titulo text-2xl leading-none font-semibold tabular-nums">{hhmm(quando as Date)}</span>
                <span className="text-sm font-semibold">{rotulo as string}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {c.preparo.length > 0 && (
        <div>
          <p className="rotulo mb-1">{t('consultas.preparo')}</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {c.preparo.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={p.feito} onChange={() => alternarPreparo(c.id, p.id)} className="h-5 w-5 accent-[var(--chocolate)]" />
                  <span className={p.feito ? 'line-through decoration-2' : ''}>{p.texto}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {c.perguntas && (
        <div>
          <p className="rotulo mb-1">{t('consultas.perguntas')}</p>
          <p className="whitespace-pre-line">{c.perguntas}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Botao onClick={calendario} icone={<Adesivo nome="calendario" tamanho={22} />}>
          {t('consultas.calendario')}
        </Botao>
        <Botao variante="secundario" tom="bg-menta" onClick={jaFui}>
          ✓ {t('consultas.jaFui')}
        </Botao>
      </div>
      <p className="text-xs">{t('consultas.calendarioDica')}</p>
    </article>
  )
}

function CartaoMarcar({ c, hoje, marquei, editar }: { c: Consulta; hoje: string; marquei: () => void; editar: () => void }) {
  const { t, i18n } = useTranslation()
  const situacao = situacaoMarcar(c.marcarAte, hoje)
  const data = c.marcarAte ? new Date(`${c.marcarAte}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const texto =
    situacao === 'hora-de-marcar'
      ? t('consultas.horaDeMarcar')
      : situacao === 'sem-prazo'
        ? t('consultas.semPrazo')
        : t(situacao === 'em-breve' ? 'consultas.emBreve' : 'consultas.tranquilo', { data })
  return (
    <li className={`cartao flex flex-wrap items-center gap-3 p-4 ${situacao === 'hora-de-marcar' ? 'bg-manteiga' : 'bg-papel'}`}>
      <Adesivo nome="prancheta" tamanho={36} />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold break-words">{c.titulo}</p>
        <p className="text-sm">
          {situacao === 'hora-de-marcar' && '! '}
          {texto}
          {c.recorrenciaMeses && ` · ↻ ${t('consultas.repete', { n: c.recorrenciaMeses })}`}
        </p>
      </div>
      <div className="flex gap-2">
        <Botao className="min-h-10 px-4 text-sm" onClick={marquei}>
          {t('consultas.marquei')}
        </Botao>
        <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={editar}>
          {t('consultas.editar')}
        </Botao>
      </div>
    </li>
  )
}

export function Consultas() {
  const { t, i18n } = useTranslation()
  const consultas = useConsultas()
  const [editando, setEditando] = useState<{ consulta: Consulta; nova: boolean } | null>(null)
  if (!consultas) return null
  const hoje = diaLocal()
  const marcadas = consultas
    .filter((c) => c.status === 'marcada')
    .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))
  const marcar = consultas
    .filter((c) => c.status === 'marcar')
    .sort((a, b) => (a.marcarAte ?? '9999').localeCompare(b.marcarAte ?? '9999'))
  const feitas = consultas.filter((c) => c.status === 'feita').sort((a, b) => (b.feitaEm ?? '').localeCompare(a.feitaEm ?? ''))
  const nova = () => novaConsulta(t('consultas.itensPreparo').split('|'))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="prancheta" tamanho={56} />
          {t('consultas.titulo')}
        </h1>
        <Botao onClick={() => setEditando({ consulta: nova(), nova: true })} icone={<span aria-hidden="true">+</span>}>
          {t('consultas.nova')}
        </Botao>
      </div>

      {consultas.length === 0 ? (
        <div className="cartao flex flex-col items-center gap-3 bg-azul-nevoa p-8 text-center">
          <Adesivo nome="prancheta" tamanho={72} />
          <p className="text-2xl font-semibold">{t('consultas.vazio')}</p>
          <p className="max-w-prose">{t('consultas.vazioDica')}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="titulo-marcadas" className="flex flex-col gap-3">
            <h2 id="titulo-marcadas" className="text-2xl font-semibold">
              {t('consultas.marcadas')}
            </h2>
            {marcadas.length ? (
              marcadas.map((c) => <CartaoMarcada key={c.id} c={c} editar={() => setEditando({ consulta: c, nova: false })} />)
            ) : (
              <p>{t('consultas.vazioMarcadas')}</p>
            )}
          </section>

          <section aria-labelledby="titulo-marcar" className="flex flex-col gap-3">
            <h2 id="titulo-marcar" className="text-2xl font-semibold">
              {t('consultas.precisoMarcar')}
            </h2>
            {marcar.length ? (
              <ul className="flex flex-col gap-3">
                {marcar.map((c) => (
                  <CartaoMarcar
                    key={c.id}
                    c={c}
                    hoje={hoje}
                    marquei={() => setEditando({ consulta: { ...c, status: 'marcada' }, nova: false })}
                    editar={() => setEditando({ consulta: c, nova: false })}
                  />
                ))}
              </ul>
            ) : (
              <p>{t('consultas.vazioMarcar')}</p>
            )}
          </section>

          {feitas.length > 0 && (
            <details className="rounded-[1.5rem] border-2 border-linha/40 p-4">
              <summary className="cursor-pointer font-bold">
                {t('consultas.feitas')} ({feitas.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {feitas.map((c) => (
                  <li key={c.id}>
                    ✓ {c.titulo}
                    {c.feitaEm && ` · ${new Date(c.feitaEm).toLocaleDateString(i18n.language)}`}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {editando && <EditorConsulta consulta={editando.consulta} nova={editando.nova} fechar={() => setEditando(null)} />}
    </div>
  )
}
