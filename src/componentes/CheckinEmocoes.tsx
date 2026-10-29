// Check-in de emoções: três "termômetros" de 0 a 10, sinais do corpo opcionais e o plano por faixa.
// Feito para levar menos de 10 segundos: três toques e "Registrar".

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mudarBemEstar, useBemEstar } from '../dados/bemEstar'
import { apagarCheckin, restaurarCheckin, salvarCheckin, useCheckinsDoDia } from '../dados/checkins'
import { FAIXAS, faixaDoCheckin, MEDIDAS, SINAIS_INICIAIS, type Checkin, type Faixa, type Medida } from '../logica/checkin'
import { diaLocal } from '../logica/datas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { Etiquetas } from './Etiquetas'
import { irParaSugestoes } from './Sugestoes'

const COR_FAIXA: Record<Faixa, string> = { leve: 'bg-menta', media: 'bg-manteiga', alta: 'bg-pessego' }
const VALORES = Array.from({ length: 11 }, (_, i) => i)

/** Termômetro: 11 barrinhas que crescem; escolher uma pinta todas até ela. */
export function Termometro({
  rotulo,
  pontas,
  valor,
  mudar,
}: {
  rotulo: string
  /** o que 0 e 10 querem dizer */
  pontas: [string, string]
  valor?: number
  mudar: (v: number) => void
}) {
  const nome = useId()
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 flex w-full items-baseline justify-between gap-2">
        <span className="text-lg font-bold">{rotulo}</span>
        <span className="font-titulo text-2xl font-semibold tabular-nums" aria-hidden="true">
          {valor ?? '–'}
        </span>
      </legend>
      {/* 11 colunas sempre numa linha; na tela de 320 px cada uma ainda fica a 24 px da vizinha */}
      <div className="grid grid-cols-11 items-end gap-1">
        {VALORES.map((v) => {
          const pintada = valor !== undefined && v <= valor
          return (
            <label
              key={v}
              className="flex min-w-0 cursor-pointer flex-col items-center gap-0.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2"
            >
              <input
                type="radio"
                name={nome}
                className="so-leitor"
                checked={valor === v}
                onChange={() => mudar(v)}
                aria-label={String(v)}
              />
              <span
                aria-hidden="true"
                className={`block w-full rounded-md border-2 border-linha ${pintada ? 'bg-ameixa' : 'bg-papel'}`}
                style={{ height: `${1.5 + v * 0.17}rem` }}
              />
              <span aria-hidden="true" className={`text-xs tabular-nums ${valor === v ? 'font-bold' : ''}`}>
                {v}
              </span>
            </label>
          )
        })}
      </div>
      <p className="flex justify-between text-xs text-tinta-suave">
        <span>{pontas[0]}</span>
        <span>{pontas[1]}</span>
      </p>
    </fieldset>
  )
}

function SinaisDoCorpo({ escolhidos, mudar }: { escolhidos: string[]; mudar: (s: string[]) => void }) {
  const { t } = useTranslation()
  return (
    <details className="rounded-2xl border-2 border-linha/40 p-3">
      <summary className="cursor-pointer font-bold">{t('checkin.sinais')}</summary>
      <div className="mt-3">
        <Etiquetas
          legenda={t('checkin.sinais')}
          legendaEscondida
          lista="sinais"
          inicial={SINAIS_INICIAIS}
          escolhidos={escolhidos}
          mudar={mudar}
        />
      </div>
    </details>
  )
}

/** O que a pessoa combinou fazer em cada faixa, com as palavras dela. */
export function PlanoPorFaixa({ aoFechar }: { aoFechar: () => void }) {
  const { t } = useTranslation()
  const config = useBemEstar()
  if (!config) return null
  return (
    <section aria-labelledby="titulo-plano-faixas" className="flex flex-col gap-3 rounded-2xl border-2 border-linha p-4">
      <h3 id="titulo-plano-faixas" className="text-xl font-semibold">
        {t('checkin.planoTitulo')}
      </h3>
      <p className="text-sm">{t('checkin.planoTexto')}</p>
      {FAIXAS.map((f) => (
        <label key={f} className="flex flex-col gap-1">
          <span className={`self-start rounded-full border-2 border-linha px-3 py-0.5 text-sm font-bold ${COR_FAIXA[f]}`}>
            {t(`checkin.faixas.${f}`)}
          </span>
          <textarea
            rows={2}
            defaultValue={config.planoFaixas?.[f] ?? ''}
            placeholder={t(`checkin.exemplos.${f}`)}
            onBlur={(e) => {
              const texto = e.target.value.trim()
              mudarBemEstar((c) => ({ planoFaixas: { ...c.planoFaixas, [f]: texto } }))
            }}
            className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
          />
        </label>
      ))}
      <Botao className="self-start" onClick={aoFechar}>
        {t('checkin.salvarPlano')}
      </Botao>
    </section>
  )
}

function UltimoCheckin({ checkin, abrirPlano }: { checkin: Checkin; abrirPlano: () => void }) {
  const { t, i18n } = useTranslation()
  const config = useBemEstar()
  const f = faixaDoCheckin(checkin)
  const plano = config?.planoFaixas?.[f]
  const hora = new Date(checkin.quando).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border-2 border-linha p-4 ${COR_FAIXA[f]}`} aria-live="polite">
      <p className="rotulo">{t('checkin.ultimo', { hora })}</p>
      <p className="text-lg font-bold">{t(`checkin.faixas.${f}`)}</p>
      {plano ? (
        <p className="text-lg">
          <span className="font-destaque text-xl italic">{t('checkin.seuPlano')}</span> {plano}
        </p>
      ) : (
        <p>
          {t('checkin.semPlano')}{' '}
          <button type="button" onClick={abrirPlano} className="font-bold underline decoration-2 underline-offset-4">
            {t('checkin.combinarAgora')}
          </button>
        </p>
      )}
      {config?.ferramentas.includes('sugestoes') && (
        <button type="button" onClick={irParaSugestoes} className="self-start font-bold underline decoration-2 underline-offset-4">
          {t('sugestoes.irPara')} ↓
        </button>
      )}
    </div>
  )
}

export function CheckinEmocoes() {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const doDia = useCheckinsDoDia(hoje)
  const [valores, setValores] = useState<Partial<Record<Medida, number>>>({})
  const [sinais, setSinais] = useState<string[]>([])
  const [nota, setNota] = useState('')
  const [planoAberto, setPlanoAberto] = useState(false)
  const faltam = MEDIDAS.filter((m) => valores[m] === undefined)
  const hhmm = (c: Checkin) => new Date(c.quando).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  async function registrar() {
    if (faltam.length) return
    const c = await salvarCheckin({
      ansiedade: valores.ansiedade!,
      irritacao: valores.irritacao!,
      energia: valores.energia!,
      sinais,
      nota,
    })
    setValores({})
    setSinais([])
    setNota('')
    mostrarAviso(t('checkin.registrado'), () => apagarCheckin(c.id))
  }

  return (
    <section aria-labelledby="titulo-checkin" className="cartao flex flex-col gap-5 bg-papel p-3 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Adesivo nome="nuvem" tamanho={44} />
        <h2 id="titulo-checkin" className="flex-1 text-2xl font-semibold">
          {t('bemEstar.ferramentas.checkin.nome')}
        </h2>
        <Botao variante="contorno" onClick={() => setPlanoAberto((a) => !a)} aria-expanded={planoAberto}>
          {t('checkin.planoTitulo')}
        </Botao>
      </div>

      {planoAberto && <PlanoPorFaixa aoFechar={() => setPlanoAberto(false)} />}
      {doDia?.[0] && <UltimoCheckin checkin={doDia[0]} abrirPlano={() => setPlanoAberto(true)} />}

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          registrar()
        }}
      >
        <p className="text-sm">{t('checkin.comoEsta')}</p>
        {MEDIDAS.map((m) => (
          <Termometro
            key={m}
            rotulo={t(`checkin.medidas.${m}`)}
            pontas={[t(`checkin.pontas.${m}.0`), t(`checkin.pontas.${m}.10`)]}
            valor={valores[m]}
            mudar={(v) => setValores((x) => ({ ...x, [m]: v }))}
          />
        ))}
        <SinaisDoCorpo escolhidos={sinais} mudar={setSinais} />
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('checkin.nota')}</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={200}
            className="min-h-11 rounded-full border-2 border-linha bg-papel px-4"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" grande disabled={faltam.length > 0}>
            {t('checkin.registrar')}
          </Botao>
          {faltam.length > 0 && (
            <span className="text-sm">
              {t('checkin.falta', { lista: faltam.map((m) => t(`checkin.medidas.${m}`).toLowerCase()).join(', ') })}
            </span>
          )}
        </div>
      </form>

      {doDia && doDia.length > 0 && (
        <section aria-labelledby="titulo-hoje-checkins" className="flex flex-col gap-2">
          <h3 id="titulo-hoje-checkins" className="rotulo">
            {t('checkin.hoje', { count: doDia.length })}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {doDia.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-linha/40 px-3 py-2">
                <span className="font-bold tabular-nums">{hhmm(c)}</span>
                <span className="flex-1 text-sm">
                  {MEDIDAS.map((m) => `${t(`checkin.medidas.${m}`)} ${c[m]}`).join(' · ')}
                  {c.sinais?.length ? ` · ${c.sinais.join(', ')}` : ''}
                  {c.nota ? ` · “${c.nota}”` : ''}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await apagarCheckin(c.id)
                    mostrarAviso(t('checkin.apagado'), () => restaurarCheckin(c))
                  }}
                  aria-label={t('checkin.apagar', { hora: hhmm(c) })}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
