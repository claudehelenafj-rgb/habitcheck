// Aba Bem-estar: opcional, calma, com ferramentas que a pessoa liga uma ou duas de cada vez.
// Cada ferramenta ligada aparece em "Ligadas agora"; as que ainda não estão prontas dizem em que etapa chegam.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { CheckinEmocoes } from '../componentes/CheckinEmocoes'
import { Hobbies } from '../componentes/Hobbies'
import { RegistroSintomas } from '../componentes/RegistroSintomas'
import { Sugestoes } from '../componentes/Sugestoes'
import { alternar, useBemEstar } from '../dados/bemEstar'
import { FERRAMENTAS, type Ferramenta } from '../logica/bemEstar'

function CartaoLigada({ ferramenta }: { ferramenta: Ferramenta }) {
  const { t } = useTranslation()
  return (
    <li className="cartao flex items-center gap-3 bg-papel p-4">
      <Adesivo nome={ferramenta.adesivo} tamanho={44} />
      <span className="flex-1">
        <span className="block text-lg font-bold">{t(`bemEstar.ferramentas.${ferramenta.id}.nome`)}</span>
        {ferramenta.etapa && (
          <span className="block text-sm text-tinta-suave">{t('bemEstar.emBreve', { etapa: ferramenta.etapa })}</span>
        )}
      </span>
    </li>
  )
}

export function BemEstar() {
  const { t } = useTranslation()
  const config = useBemEstar()
  const [muitas, setMuitas] = useState(false)
  if (!config) return null
  const ligadas = FERRAMENTAS.filter((f) => config.ferramentas.includes(f.id))

  return (
    <section className="flex flex-col gap-6">
      <header className="cartao flex flex-col gap-3 bg-lilas p-6">
        <h1 tabIndex={-1} className="flex items-center gap-3 text-3xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="cerebro" tamanho={60} />
          {t('nav.bemestar')}
        </h1>
        <p className="max-w-prose text-lg">{t('bemEstar.intro')}</p>
        <p className="max-w-prose text-sm">
          {t('bemEstar.cuidado')} {t('bemEstar.privacidade')}
        </p>
      </header>

      <section aria-labelledby="titulo-ligadas" className="flex flex-col gap-3">
        <h2 id="titulo-ligadas" className="text-2xl font-semibold">
          {t('bemEstar.ligadasTitulo')}
        </h2>
        {ligadas.some((f) => f.id === 'checkin') && <CheckinEmocoes />}
        {ligadas.some((f) => f.id === 'sintomas') && <RegistroSintomas />}
        {/* logo depois do check-in e dos sintomas, que dão o contexto das ideias */}
        {ligadas.some((f) => f.id === 'sugestoes') && <Sugestoes />}
        {ligadas.some((f) => f.id === 'hobbies') && <Hobbies />}
        {ligadas.some((f) => f.etapa) && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ligadas
              .filter((f) => f.etapa)
              .map((f) => (
                <CartaoLigada key={f.id} ferramenta={f} />
              ))}
          </ul>
        )}
        {ligadas.length === 0 && <p className="cartao bg-papel p-4">{t('bemEstar.nenhumaLigada')}</p>}
      </section>

      <section aria-labelledby="titulo-ferramentas" className="cartao flex flex-col gap-4 bg-papel p-5">
        <div>
          <h2 id="titulo-ferramentas" className="text-2xl font-semibold">
            {t('bemEstar.ferramentasTitulo')}
          </h2>
          <p className="text-sm">{t('bemEstar.ferramentasDica')}</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FERRAMENTAS.map((f) => {
            const ligada = config.ferramentas.includes(f.id)
            return (
              <li key={f.id}>
                <button
                  type="button"
                  aria-pressed={ligada}
                  onClick={async () => setMuitas(await alternar(f.id))}
                  className={`flex h-full w-full flex-wrap items-center gap-3 rounded-2xl border-2 border-linha p-3 text-left ${
                    ligada ? 'bg-lilas' : 'bg-papel'
                  }`}
                >
                  <Adesivo nome={f.adesivo} tamanho={36} />
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block font-bold">{t(`bemEstar.ferramentas.${f.id}.nome`)}</span>
                    <span className="block text-sm">{t(`bemEstar.ferramentas.${f.id}.desc`)}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`ml-auto shrink-0 rounded-full border-2 border-linha px-3 py-0.5 text-sm font-bold ${
                      ligada ? 'bg-botao text-botao-texto' : ''
                    }`}
                  >
                    {ligada ? `✓ ${t('ajustes.ligado')}` : t('ajustes.desligado')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p aria-live="polite" className="text-sm font-semibold">
          {muitas && config.ferramentas.length > 2 ? t('bemEstar.muitas') : ''}
        </p>
      </section>
    </section>
  )
}
