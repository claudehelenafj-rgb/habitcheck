// Proteção da aba Bem-estar: com PIN e trancada, mostra o pedido de PIN em vez do conteúdo.
// "Esqueci o PIN" explica que não há como recuperar e oferece apagar só os dados do Bem-estar.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { banco } from '../dados/banco'
import { apagarBemEstar } from '../dados/backup'
import { tirarPin, usePinConfigurado } from '../dados/pin'
import { useAgora } from '../dados/timer'
import { desbloquear, segundosParaTentar, tentarPin, useDesbloqueado } from '../trava'
import { Adesivo } from './Adesivo'
import { Botao } from './Botao'

export function FormularioPin({ focar = true }: { focar?: boolean }) {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const campo = useRef<HTMLInputElement>(null)
  const agora = useAgora(1000)
  const espera = segundosParaTentar(agora.getTime())

  useEffect(() => {
    if (focar) campo.current?.focus()
  }, [focar])

  async function abrir() {
    const r = await tentarPin(pin)
    if (r === 'errado') {
      setErro(t('pin.errado'))
      setPin('')
      campo.current?.focus()
    } else if (r === 'esperar') setErro('')
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        abrir()
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-bold">{t('pin.digite')}</span>
        <input
          ref={campo}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''))
            setErro('')
          }}
          aria-invalid={!!erro}
          aria-describedby="pin-erro"
          className="min-h-12 w-40 rounded-full border-2 border-linha bg-papel px-4 text-center text-2xl tracking-[0.4em]"
        />
      </label>
      <p id="pin-erro" aria-live="polite" className="min-h-6 font-semibold">
        {espera > 0 ? t('pin.espere', { segundos: espera }) : erro}
      </p>
      <Botao type="submit" className="self-start" disabled={pin.length < 4 || espera > 0}>
        {t('pin.abrir')}
      </Botao>
    </form>
  )
}

function EsqueciPin() {
  const { t } = useTranslation()
  const [certeza, setCerteza] = useState(false)
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('pin.esqueci')}</summary>
      <div className="mt-2 flex flex-col gap-2">
        <p>{t('pin.esqueciTexto')}</p>
        {certeza ? (
          <div className="flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              tom="bg-morango-claro"
              onClick={async () => {
                await apagarBemEstar(banco)
                await tirarPin()
                desbloquear()
              }}
            >
              {t('pin.apagarSim')}
            </Botao>
            <Botao variante="contorno" onClick={() => setCerteza(false)}>
              {t('ajustes.cancelar')}
            </Botao>
          </div>
        ) : (
          <Botao variante="contorno" className="self-start" onClick={() => setCerteza(true)}>
            {t('pin.apagarEComecar')}
          </Botao>
        )}
      </div>
    </details>
  )
}

/**
 * Envolve o conteúdo do Bem-estar. `compacto`: versão pequena, para trechos dentro de outras telas.
 * `sozinha`: tela fora da moldura do app (ex.: o resumo para imprimir), com margem própria.
 */
export function ProtecaoBemEstar({ children, compacto = false, sozinha = false }: { children: ReactNode; compacto?: boolean; sozinha?: boolean }) {
  const { t } = useTranslation()
  const temPin = usePinConfigurado()
  const desbloqueado = useDesbloqueado()
  const [abrindo, setAbrindo] = useState(false)
  if (temPin === undefined) return null
  if (!temPin || desbloqueado) return <>{children}</>
  if (compacto && !abrindo) {
    return (
      <section className="cartao flex flex-wrap items-center gap-3 bg-papel p-4">
        <Adesivo nome="cerebro" tamanho={32} />
        <p className="min-w-0 flex-1">{t('pin.trechoProtegido')}</p>
        <Botao variante="contorno" onClick={() => setAbrindo(true)}>
          {t('pin.desbloquear')}
        </Botao>
      </section>
    )
  }
  const pedido = (
    <section aria-labelledby="titulo-pin" className="cartao flex flex-col gap-4 bg-lilas p-6">
      <h1 id="titulo-pin" tabIndex={-1} className="flex items-center gap-3 text-3xl font-semibold outline-none">
        <Adesivo nome="cerebro" tamanho={48} />
        {t('pin.titulo')}
      </h1>
      <p className="max-w-prose">{t('pin.texto')}</p>
      <FormularioPin />
      <EsqueciPin />
    </section>
  )
  return sozinha ? <div className="mx-auto max-w-xl px-4 py-10">{pedido}</div> : pedido
}
