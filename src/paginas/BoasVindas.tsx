// Primeiro uso, em 3 passos curtos: oi (nome opcional e tema), escolher 1 ou 2 áreas, ver o plano de 2 semanas.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { Micangas } from '../componentes/Papelaria'
import { salvarPerfil, usePerfil } from '../dados/perfil'
import { AREAS_PRINCIPAIS, type IdArea } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { alternarArea, FASES, LIMITE_AREAS_INICIO } from '../logica/planoInicio'
import { CORES_FASE } from '../componentes/CartaoPlano'
import { usePreferencias } from '../preferencias'

const TOTAL = 3

export function BoasVindas() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const perfil = usePerfil()
  const [prefs, mudarPrefs] = usePreferencias()
  const [passo, setPasso] = useState(1)
  const [nome, setNome] = useState('')
  const [areas, setAreas] = useState<IdArea[]>([])
  const [avisoLimite, setAvisoLimite] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)

  // a cada passo, o foco vai para o título (leitor de tela anuncia a mudança)
  useEffect(() => {
    if (passo > 1) titulo.current?.focus()
  }, [passo])

  if (perfil) return <Navigate to="/hoje" replace />
  if (perfil === undefined) return null

  function escolher(area: IdArea) {
    const r = alternarArea(areas, area)
    setAreas(r.selecionadas)
    setAvisoLimite(r.passouDoLimite)
  }

  async function comecar() {
    const hoje = diaLocal()
    await salvarPerfil({ nome: nome.trim() || undefined, areasAtivas: areas, inicioPlano: hoje, ultimaVisita: hoje })
    navegar('/hoje', { replace: true })
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10">
      <div aria-hidden="true" className="decor estampa estampa-atual mx-auto mb-6 h-10 max-w-3xl rounded-full border-2 border-linha bg-papel" />
      <main className="cartao mx-auto flex max-w-3xl flex-col gap-6 bg-papel p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <p className="rotulo">{t('boasVindas.passo', { atual: passo, total: TOTAL })}</p>
          <ol className="ml-auto flex gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL }, (_, i) => (
              <li key={i} className={`h-3 w-8 rounded-full border-2 border-linha ${i < passo ? 'bg-tinta' : ''}`} />
            ))}
          </ol>
        </div>

        {passo === 1 && (
          <>
            <Micangas texto={t('boasVindas.oi')} tamanho={52} />
            <h1 ref={titulo} tabIndex={-1} className="text-4xl font-semibold outline-none sm:text-5xl">
              {t('boasVindas.titulo1')}
            </h1>
            <p className="max-w-prose text-lg">{t('boasVindas.texto1')}</p>
            <label className="flex max-w-md flex-col gap-1.5">
              <span className="font-bold">{t('boasVindas.nomePergunta')}</span>
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="given-name"
                maxLength={40}
                className="min-h-12 rounded-2xl border-2 border-linha bg-papel px-4 text-lg"
              />
              <span className="text-sm text-tinta-suave">{t('boasVindas.nomeDica')}</span>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-bold">{t('boasVindas.temaPergunta')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['creme', t('boasVindas.temaClassico'), t('boasVindas.temaClassicoDesc'), ['#FBF6EE', '#422F0E', '#F9D4F8', '#FFD094']],
                    ['indigo', t('boasVindas.temaIndigo'), t('boasVindas.temaIndigoDesc'), ['#F3F2EE', '#1E2350', '#3949A3', '#E3A73B']],
                  ] as const
                ).map(([tema, nomeTema, descricao, cores]) => {
                  const ativo = tema === 'indigo' ? prefs.tema === 'indigo' : prefs.tema !== 'indigo'
                  return (
                    <label
                      key={tema}
                      className={`cartao flex cursor-pointer items-center gap-3 bg-papel p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
                        ativo ? 'ring-4 ring-linha ring-offset-2 ring-offset-papel' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="tema"
                        className="so-leitor"
                        checked={ativo}
                        onChange={() => mudarPrefs({ tema })}
                      />
                      <span className="flex shrink-0" aria-hidden="true">
                        {cores.map((cor) => (
                          <span key={cor} className="-mr-2 h-8 w-8 rounded-full border-2 border-linha" style={{ background: cor }} />
                        ))}
                      </span>
                      <span className="ml-2 flex-1">
                        <span className="block text-lg font-bold">{nomeTema}</span>
                        <span className="block text-sm">{descricao}</span>
                      </span>
                      <span aria-hidden="true" className="font-bold">
                        {ativo ? '✓' : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
              <span className="text-sm text-tinta-suave">{t('boasVindas.temaDica')}</span>
            </fieldset>
            <Botao grande className="self-start" onClick={() => setPasso(2)}>
              {t('boasVindas.continuar')} →
            </Botao>
          </>
        )}

        {passo === 2 && (
          <>
            <h1 ref={titulo} tabIndex={-1} className="text-4xl font-semibold outline-none">
              {t('boasVindas.titulo2')}
            </h1>
            <p className="max-w-prose text-lg">{t('boasVindas.texto2')}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {AREAS_PRINCIPAIS.map((area) => {
                const ativa = areas.includes(area.id)
                return (
                  <li key={area.id}>
                    <button
                      type="button"
                      aria-pressed={ativa}
                      onClick={() => escolher(area.id)}
                      className={`cartao flex w-full items-center gap-3 p-4 text-left transition-transform ${area.claro} ${
                        ativa ? 'ring-4 ring-linha ring-offset-2 ring-offset-papel' : 'hover:-translate-y-0.5'
                      }`}
                    >
                      <Adesivo nome={area.adesivo} tamanho={48} />
                      <span className="flex-1">
                        <span className="block text-lg font-bold">{t(`nav.${area.id}`)}</span>
                        <span className="block text-sm">{t(`areasDesc.${area.id}`)}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-linha font-bold ${
                          ativa ? 'bg-botao text-botao-texto' : 'bg-papel'
                        }`}
                      >
                        {ativa ? '✓' : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p aria-live="polite" className="font-semibold">
              {t('boasVindas.contador', { n: areas.length })}
              {avisoLimite && areas.length >= LIMITE_AREAS_INICIO && <span className="block font-normal">{t('boasVindas.limite')}</span>}
            </p>
            <p className="text-sm">{t('boasVindas.sempreLigados')}</p>
            <div className="flex flex-wrap gap-2">
              <Botao variante="contorno" onClick={() => setPasso(1)}>
                ← {t('boasVindas.voltar')}
              </Botao>
              <Botao grande onClick={() => setPasso(3)}>
                {areas.length ? t('boasVindas.continuar') : t('boasVindas.escolherDepois')} →
              </Botao>
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <h1 ref={titulo} tabIndex={-1} className="text-4xl font-semibold outline-none">
              {t('boasVindas.titulo3')}
            </h1>
            <p className="max-w-prose text-lg">{t('boasVindas.texto3')}</p>
            <ol className="flex flex-col gap-2">
              {FASES.map((fase) => (
                <li key={fase.id} className={`flex flex-col gap-0.5 rounded-2xl border-2 border-linha p-4 ${CORES_FASE[fase.id]}`}>
                  <span className="rotulo">{t(`plano.fases.${fase.id}.quando`)}</span>
                  <span className="text-lg font-bold">{t(`plano.fases.${fase.id}.titulo`)}</span>
                  <span>{t(`plano.fases.${fase.id}.texto`)}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Botao variante="contorno" onClick={() => setPasso(2)}>
                ← {t('boasVindas.voltar')}
              </Botao>
              <Botao grande onClick={comecar} icone={<Adesivo nome="estrela" tamanho={28} />}>
                {t('boasVindas.comecar')}
              </Botao>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
