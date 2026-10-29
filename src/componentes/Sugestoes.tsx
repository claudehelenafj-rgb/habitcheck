// Sugestões de atividade: 2 ou 3 ideias para agora, pela energia e pela tensão do último check-in ou sintoma.
// "Vou fazer" guarda a escolha; depois o app pergunta "ajudou?" e usa a resposta para ordenar as próximas.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { atualizarBemEstar, mudarBemEstar, useBemEstar } from '../dados/bemEstar'
import { useUltimoCheckin } from '../dados/checkins'
import { useHobbies } from '../dados/hobbies'
import { useSintomasDesde, useUltimoSintoma } from '../dados/sintomas'
import {
  apagarEscolha,
  desfazerResposta,
  dispensarSugestao,
  escolherSugestao,
  responderSugestao,
  useHistoricoSugestoes,
} from '../dados/sugestoes'
import { useAgora } from '../dados/timer'
import { diaLocal, somarDias } from '../logica/datas'
import { intervaloIdeal, situacao } from '../logica/hobbies'
import { maisFrequentes } from '../logica/sintomas'
import {
  ATIVIDADES_INICIAIS,
  contexto,
  juntarCandidatos,
  NIVEIS,
  pendente,
  sugerir,
  type Atividade,
  type Candidato,
  type NivelEnergia,
  type RegistroSugestao,
  type Resposta,
} from '../logica/sugestoes'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const RESPOSTAS: Resposta[] = ['sim', 'maisOuMenos', 'nao']

function PerguntaAjudou({ registro }: { registro: RegistroSugestao }) {
  const { t, i18n } = useTranslation()
  const hora = new Date(registro.quando).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  const hoje = registro.dia === diaLocal()
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-linha bg-lilas p-4" role="group" aria-labelledby={`ajudou-${registro.id}`}>
      <p id={`ajudou-${registro.id}`}>
        {t(hoje ? 'sugestoes.escolheuHoje' : 'sugestoes.escolheuOntem', { texto: registro.texto, hora })} <strong>{t('sugestoes.ajudou')}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {RESPOSTAS.map((r) => (
          <Botao
            key={r}
            variante={r === 'sim' ? 'principal' : 'secundario'}
            tom="bg-papel"
            onClick={async () => {
              const vez = await responderSugestao(registro.id, r)
              mostrarAviso(t(vez ? 'sugestoes.anotadoHobby' : 'sugestoes.anotado'), () => desfazerResposta(registro.id, vez))
            }}
          >
            {t(`sugestoes.respostas.${r}`)}
          </Botao>
        ))}
        <Botao
          variante="contorno"
          onClick={async () => {
            await dispensarSugestao(registro.id)
            mostrarAviso(t('sugestoes.semResposta'), () => desfazerResposta(registro.id))
          }}
        >
          {t('sugestoes.naoFiz')}
        </Botao>
      </div>
    </div>
  )
}

function CartaoIdeia({ c }: { c: Candidato }) {
  const { t } = useTranslation()
  const detalhe =
    c.origem === 'hobby'
      ? c.atraso
        ? t('sugestoes.hobbyParado')
        : t('sugestoes.seuHobby')
      : c.origem === 'ajudou'
        ? t('sugestoes.jaAjudou', { count: c.vezesAjudou ?? 1 })
        : c.acalma
          ? t('sugestoes.acalma')
          : ''
  return (
    <li className="flex flex-col gap-3 rounded-2xl border-2 border-linha bg-papel p-4">
      <div className="flex items-start gap-3">
        {c.adesivo && <Adesivo nome={c.adesivo} tamanho={36} />}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold break-words first-letter:uppercase">{c.texto}</p>
          {detalhe && <p className="text-sm text-tinta-suave">{detalhe}</p>}
        </div>
      </div>
      <Botao
        className="self-start"
        onClick={async () => {
          const r = await escolherSugestao(c)
          mostrarAviso(t('sugestoes.combinado', { texto: c.texto }), () => apagarEscolha(r.id))
        }}
      >
        {t('sugestoes.vouFazer')}
      </Botao>
    </li>
  )
}

function MinhasIdeias({ atividades }: { atividades: Atividade[] }) {
  const { t } = useTranslation()
  const [texto, setTexto] = useState('')
  const [energia, setEnergia] = useState<NivelEnergia>('baixa')
  const [acalma, setAcalma] = useState(true)
  async function acrescentar() {
    const limpo = texto.trim()
    if (!limpo) return
    await mudarBemEstar((c) => ({ atividades: [...(c.atividades ?? ATIVIDADES_INICIAIS), { id: crypto.randomUUID(), texto: limpo, energia, acalma }] }))
    setTexto('')
  }
  return (
    <details>
      <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('sugestoes.minhasIdeias', { count: atividades.length })}</summary>
      <div className="mt-3 flex flex-col gap-3">
        <ul className="flex flex-col gap-1.5">
          {atividades.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-linha/40 px-3 py-1.5">
              <span className="min-w-0 flex-1 basis-48">{a.texto}</span>
              <span className="rounded-full border-2 border-linha px-2 text-xs font-bold">{t(`sugestoes.energias.${a.energia}`)}</span>
              {a.acalma && <span className="rounded-full border-2 border-linha px-2 text-xs font-bold">{t('sugestoes.acalmaCurto')}</span>}
              <button
                type="button"
                onClick={async () => {
                  await mudarBemEstar((c) => ({ atividades: (c.atividades ?? ATIVIDADES_INICIAIS).filter((x) => x.id !== a.id) }))
                  mostrarAviso(t('sugestoes.ideiaTirada'), () => atualizarBemEstar({ atividades }))
                }}
                aria-label={t('etiquetas.tirar', { nome: a.texto })}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-col gap-2 rounded-2xl border-2 border-linha/40 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            acrescentar()
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('sugestoes.novaIdeia')}</span>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={80} className="min-h-11 rounded-full border-2 border-linha bg-papel px-4" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-sm font-bold">{t('sugestoes.pedeEnergia')}</span>
              <select value={energia} onChange={(e) => setEnergia(e.target.value as NivelEnergia)} className="min-h-10 rounded-full border-2 border-linha bg-papel px-3">
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>
                    {t(`sugestoes.energias.${n}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={acalma} onChange={(e) => setAcalma(e.target.checked)} className="h-5 w-5 accent-[var(--forte-ameixa)]" />
              {t('sugestoes.ajudaAcalmar')}
            </label>
            <Botao type="submit" variante="contorno" disabled={!texto.trim()}>
              + {t('etiquetas.acrescentar')}
            </Botao>
          </div>
        </form>
      </div>
    </details>
  )
}

export function Sugestoes() {
  const { t, i18n } = useTranslation()
  const agora = useAgora(60_000)
  const hoje = diaLocal(agora)
  const config = useBemEstar()
  const ultimoCheckin = useUltimoCheckin()
  const ultimoSintoma = useUltimoSintoma()
  const hobbies = useHobbies()
  const sintomas = useSintomasDesde(somarDias(hoje, -60))
  const historico = useHistoricoSugestoes()
  // energia escolhida à mão: vale só para o check-in ou sintoma em que foi escolhida (um registro novo manda de novo)
  const [escolha, setEscolha] = useState<{ para?: string; nivel: NivelEnergia }>()
  const [pagina, setPagina] = useState(0)
  if (!config || ultimoCheckin === undefined || ultimoSintoma === undefined || !hobbies || !sintomas || !historico) return null

  const atividades = config.atividades ?? ATIVIDADES_INICIAIS
  const ctxBase = contexto(ultimoCheckin ?? undefined, ultimoSintoma ?? undefined, agora)
  const ctx = { ...ctxBase, energia: escolha && escolha.para === ctxBase.quando ? escolha.nivel : ctxBase.energia }
  const hobbiesAtivos = hobbies.hobbies
    .map((h) => {
      const s = situacao(h, hobbies.vezes.filter((v) => v.hobbyId === h.id), hoje, diaLocal(new Date(h.criadoEm)))
      return { h, s }
    })
    .filter(({ s }) => s.tipo === 'emDia' || s.tipo === 'deLado')
    .map(({ h, s }) => ({ id: h.id, nome: h.nome, adesivo: h.adesivo, atraso: s.tipo === 'deLado' ? s.dias / intervaloIdeal(h.frequencia) : 0 }))
  const ajudou = maisFrequentes(sintomas.flatMap((r) => r.ajudou), 10)
  const candidatos = juntarCandidatos(atividades, hobbiesAtivos, ajudou)
  const ideias = sugerir(candidatos, ctx, historico, hoje, 3, pagina)
  const esperando = pendente(historico, hoje, somarDias(hoje, -1))
  const hora = ctxBase.quando && new Date(ctxBase.quando).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  return (
    <section aria-labelledby="titulo-sugestoes" className="cartao flex flex-col gap-5 bg-papel p-3 sm:p-6">
      <div className="flex items-center gap-3">
        <Adesivo nome="xicara" tamanho={44} />
        <h2 id="titulo-sugestoes" tabIndex={-1} className="flex-1 text-2xl font-semibold outline-none">
          {t('sugestoes.titulo')}
        </h2>
      </div>

      {esperando && <PerguntaAjudou registro={esperando} />}

      <p>
        {ctxBase.origem === 'checkin' && t('sugestoes.peloCheckin', { hora })}
        {ctxBase.origem === 'sintoma' && t('sugestoes.peloSintoma', { hora })}
        {ctxBase.origem === 'nenhum' && t('sugestoes.semContexto')}
        {ctx.tensaoAlta && ` ${t('sugestoes.tensaoAlta')}`}
      </p>

      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-1.5 w-full font-bold">{t('sugestoes.suaEnergia')}</legend>
        {NIVEIS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={ctx.energia === n}
            onClick={() => {
              setEscolha({ para: ctxBase.quando, nivel: n })
              setPagina(0)
            }}
            className={`min-h-10 rounded-full border-2 border-linha px-4 font-semibold ${ctx.energia === n ? 'bg-lilas' : 'bg-papel'}`}
          >
            {ctx.energia === n && '✓ '}
            {t(`sugestoes.energias.${n}`)}
          </button>
        ))}
        {!ctx.energia && <span className="text-sm text-tinta-suave">{t('sugestoes.assumindoBaixa')}</span>}
      </fieldset>

      {ideias.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] items-start gap-3" aria-live="polite">
          {ideias.map((c) => (
            <CartaoIdeia key={c.chave} c={c} />
          ))}
        </ul>
      ) : (
        <p>{t('sugestoes.nenhuma')}</p>
      )}
      {ideias.length > 0 && (
        <Botao variante="contorno" className="self-start" onClick={() => setPagina((p) => p + 1)}>
          {t('sugestoes.outras')}
        </Botao>
      )}

      <MinhasIdeias atividades={atividades} />
    </section>
  )
}

/** Leva até as sugestões (usado depois de um check-in ou de um sintoma). */
export function irParaSugestoes() {
  const titulo = document.getElementById('titulo-sugestoes')
  titulo?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  titulo?.focus({ preventScroll: true })
}
