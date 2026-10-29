// Quarto: reset de 10 minutos numa zona por vez (com sugestão da zona há mais tempo sem), a semana de resets,
// o reset como hábito (plano se-então) e as zonas com a lista do que fazer em cada uma, todas editáveis.

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { CartaoHabito, HabitosArquivados } from '../componentes/CartaoHabito'
import { EditorHabito } from '../componentes/EditorHabito'
import { GradeSemanal, type Dia as DiaGrade } from '../componentes/GradeSemanal'
import { novoHabito, useHabitos, useRegistrosHabito } from '../dados/habitos'
import {
  apagarZona,
  comecarReset,
  garantirZonasIniciais,
  mudarZona,
  novaZona,
  restaurarZona,
  useEstadoReset,
  useResets,
  useZonas,
} from '../dados/quarto'
import { useAgora } from '../dados/timer'
import { diaLocal } from '../logica/datas'
import { MODELO_HABITO_QUARTO, type Habito } from '../logica/habitos'
import { DURACOES_RESET, MODELOS_ZONAS, diasSemReset, estadoDiaReset, zonaSugerida, type ResetQuarto, type Zona } from '../logica/quarto'
import { diasDaSemana } from '../logica/remedios'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'

function QuandoFoi({ dias }: { dias: number | null }) {
  const { t } = useTranslation()
  if (dias === null) return <>{t('quarto.nunca')}</>
  if (dias === 0) return <>{t('quarto.hoje')}</>
  return <>{t('quarto.haDias', { count: dias })}</>
}

function ComecarReset({ zonas, resets, hoje }: { zonas: Zona[]; resets: ResetQuarto[]; hoje: string }) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const sugerida = zonaSugerida(zonas, resets, hoje)
  const [escolhida, setEscolhida] = useState<string | undefined>(undefined)
  const [minutos, setMinutos] = useState(10)
  const zonaId = escolhida && zonas.some((z) => z.id === escolhida) ? escolhida : sugerida?.id

  if (!zonas.length) return <p className="cartao bg-manteiga p-5">{t('quarto.semZonas')}</p>

  return (
    <section aria-labelledby="titulo-reset" className="cartao flex flex-col gap-4 bg-manteiga p-5">
      <h2 id="titulo-reset" className="text-2xl font-semibold">
        {t('quarto.resetTitulo')}
      </h2>
      <p>{t('quarto.resetTexto')}</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">{t('quarto.qualZona')}</legend>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {zonas.map((z) => {
            const marcada = z.id === zonaId
            return (
              <li key={z.id}>
                <button
                  type="button"
                  aria-pressed={marcada}
                  onClick={() => setEscolhida(z.id)}
                  className={`flex h-full w-full items-center gap-3 rounded-2xl border-2 border-linha p-3 text-left ${marcada ? 'bg-papel shadow-[3px_3px_0_var(--linha)]' : 'bg-manteiga'}`}
                >
                  <Adesivo nome={z.adesivo} tamanho={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold break-words">
                      {marcada && '✓ '}
                      {z.nome}
                    </span>
                    <span className="block text-sm">
                      <QuandoFoi dias={diasSemReset(resets, z.id, hoje)} />
                    </span>
                    {z.id === sugerida?.id && <span className="mt-1 inline-block rounded-full border-2 border-linha/50 px-2 text-xs font-bold">{t('quarto.sugestao')}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-bold">{t('quarto.quantoTempo')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {DURACOES_RESET.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={minutos === m}
              onClick={() => setMinutos(m)}
              className={`min-h-11 rounded-full border-2 border-linha px-4 font-semibold ${minutos === m ? 'bg-papel' : 'bg-manteiga'}`}
            >
              {minutos === m && '✓ '}
              {t('faculdade.min', { n: m })}
            </button>
          ))}
        </div>
      </fieldset>
      <Botao
        grande
        className="self-start"
        disabled={!zonaId}
        onClick={async () => {
          if (!zonaId) return
          await comecarReset(zonaId, minutos)
          navegar('/quarto/reset')
        }}
      >
        {t('quarto.comecar')}
      </Botao>
    </section>
  )
}

function SemanaDeResets({ resets, hoje }: { resets: ResetQuarto[]; hoje: string }) {
  const { t, i18n } = useTranslation()
  const dias: DiaGrade[] = diasDaSemana(hoje).map((dia) => {
    const data = new Date(`${dia}T12:00:00`)
    return {
      rotulo: data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').toUpperCase(),
      nomeCompleto: data.toLocaleDateString(i18n.language, { weekday: 'long' }),
      numero: data.getDate(),
      estado: estadoDiaReset(resets, dia, hoje),
      hoje: dia === hoje,
    }
  })
  return <GradeSemanal titulo={t('quarto.semana')} adesivo="vassoura" tom="bg-papel" dias={dias} />
}

function ItemZona({ zona }: { zona: Zona }) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(zona.nome)
  const [item, setItem] = useState('')
  const salvarNome = () => {
    const novo = nome.trim()
    if (novo && novo !== zona.nome) void mudarZona(zona.id, () => ({ nome: novo }))
    else setNome(zona.nome)
  }
  const acrescentar = () => {
    const novo = item.trim()
    if (novo) void mudarZona(zona.id, (z) => ({ itens: z.itens.includes(novo) ? z.itens : [...z.itens, novo] }))
    setItem('')
  }
  return (
    <li className="flex flex-col gap-3 rounded-2xl border-2 border-linha/40 bg-papel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Adesivo nome={zona.adesivo} tamanho={32} />
        <label className="min-w-0 flex-1 basis-40">
          <span className="so-leitor">{t('quarto.nomeZona')}</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={salvarNome}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            maxLength={40}
            className={`${campo} w-full font-bold`}
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            const apagada = await apagarZona(zona.id)
            if (apagada) mostrarAviso(t('quarto.zonaApagada', { nome: zona.nome }), () => restaurarZona(apagada))
          }}
          className="text-sm font-bold underline decoration-2 underline-offset-4"
        >
          {t('quarto.apagarZona')}
        </button>
      </div>
      {zona.itens.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {zona.itens.map((x) => (
            <li key={x} className="flex items-center gap-1 rounded-full border-2 border-linha bg-manteiga py-1 pr-1 pl-3 text-sm font-semibold">
              {x}
              <button
                type="button"
                onClick={() => mudarZona(zona.id, (z) => ({ itens: z.itens.filter((y) => y !== x) }))}
                aria-label={t('editorHabito.tirarItem', { item: x })}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="min-w-0 flex-1 basis-40">
          <span className="so-leitor">{t('quarto.novoItemDe', { zona: zona.nome })}</span>
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                acrescentar()
              }
            }}
            maxLength={60}
            placeholder={t('quarto.novoItemExemplo')}
            className={`${campo} w-full`}
          />
        </label>
        <Botao variante="contorno" onClick={acrescentar}>
          + {t('editorHabito.acrescentar')}
        </Botao>
      </div>
    </li>
  )
}

function Zonas({ zonas }: { zonas: Zona[] }) {
  const { t } = useTranslation()
  const [nova, setNova] = useState('')
  return (
    <details className="cartao bg-papel p-4">
      <summary className="cursor-pointer text-xl font-semibold">{t('quarto.zonasTitulo')}</summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="max-w-prose text-sm">{t('quarto.zonasDica')}</p>
        <ul className="grid gap-3 lg:grid-cols-2">
          {zonas.map((z) => (
            <ItemZona key={z.id} zona={z} />
          ))}
        </ul>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!nova.trim()) return
            await novaZona({ nome: nova.trim(), adesivo: 'estrela', itens: [] })
            setNova('')
          }}
        >
          <label className="min-w-0 flex-1 basis-48">
            <span className="so-leitor">{t('quarto.novaZona')}</span>
            <input value={nova} onChange={(e) => setNova(e.target.value)} maxLength={40} placeholder={t('quarto.novaZonaExemplo')} className={`${campo} w-full`} />
          </label>
          <Botao type="submit" variante="contorno">
            + {t('quarto.novaZona')}
          </Botao>
        </form>
      </div>
    </details>
  )
}

export function Quarto() {
  const { t } = useTranslation()
  const zonas = useZonas()
  const resets = useResets()
  const reset = useEstadoReset()
  const habitos = useHabitos('quarto')
  const registros = useRegistrosHabito()
  const hoje = diaLocal(useAgora(60_000))
  const [editando, setEditando] = useState<{ habito: Habito; novo: boolean } | null>(null)

  useEffect(() => {
    void garantirZonasIniciais(
      MODELOS_ZONAS.map((m) => ({
        nome: t(`quarto.zonas.${m.chave}.nome`),
        adesivo: m.adesivo,
        itens: t(`quarto.zonas.${m.chave}.itens`).split('|'),
      })),
    )
  }, [t])

  if (!zonas || !resets || reset === undefined || !habitos || !registros) return null
  const ativos = habitos.filter((h) => !h.arquivadoEm)
  const zonaDoReset = reset && zonas.find((z) => z.id === reset.zonaId)
  const habitoModelo = () =>
    novoHabito({
      area: 'quarto',
      adesivo: MODELO_HABITO_QUARTO.adesivo,
      meta: MODELO_HABITO_QUARTO.meta,
      bloco: MODELO_HABITO_QUARTO.bloco,
      titulo: t('quarto.modeloHabito.titulo'),
      se: t('quarto.modeloHabito.se'),
      entao: t('quarto.modeloHabito.entao'),
      minima: t('quarto.modeloHabito.minima'),
    })

  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="vassoura" tamanho={56} />
        {t('nav.quarto')}
      </h1>

      {reset ? (
        <section role="status" className="cartao flex flex-wrap items-center gap-3 bg-manteiga p-5">
          <Adesivo nome={zonaDoReset?.adesivo ?? 'vassoura'} tamanho={40} />
          <p className="min-w-0 flex-1 text-lg font-semibold">{t('quarto.emAndamento', { zona: zonaDoReset?.nome ?? t('quarto.zona') })}</p>
          <Link to="/quarto/reset" className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto">
            {t('quarto.voltarReset')}
          </Link>
        </section>
      ) : (
        <ComecarReset zonas={zonas} resets={resets} hoje={hoje} />
      )}

      <SemanaDeResets resets={resets} hoje={hoje} />

      <section aria-labelledby="titulo-habito-quarto" className="flex flex-col gap-3">
        <h2 id="titulo-habito-quarto" className="text-2xl font-semibold">
          {t('quarto.habitoTitulo')}
        </h2>
        {ativos.length ? (
          <ul className="grid items-start gap-8 lg:grid-cols-2">
            {ativos.map((h) => (
              <li key={h.id}>
                <CartaoHabito habito={h} registros={registros} hoje={hoje} editar={() => setEditando({ habito: h, novo: false })} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="cartao flex flex-col gap-3 bg-papel p-5">
            <p>{t('quarto.habitoTexto')}</p>
            <p className="font-semibold">{t('academia.seEntao', { se: t('quarto.modeloHabito.se'), entao: t('quarto.modeloHabito.entao') })}</p>
            <Botao variante="secundario" tom="bg-manteiga" className="self-start" onClick={() => setEditando({ habito: habitoModelo(), novo: true })}>
              {t('quarto.habitoCriar')}
            </Botao>
          </div>
        )}
        <HabitosArquivados habitos={habitos.filter((h) => h.arquivadoEm)} />
      </section>

      <Zonas zonas={zonas} />

      {editando && <EditorHabito habito={editando.habito} novo={editando.novo} fechar={() => setEditando(null)} />}
    </div>
  )
}
