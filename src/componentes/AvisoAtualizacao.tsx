// Registra o service worker (app offline) e avisa quando há uma versão nova.
// Nunca atualiza sozinho no meio do uso: a pessoa escolhe quando.

import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function AvisoAtualizacao() {
  const { t } = useTranslation()
  const {
    needRefresh: [temVersaoNova, setTemVersaoNova],
    updateServiceWorker,
  } = useRegisterSW({
    // em prévias sem suporte a service worker o app segue funcionando, só não fica offline
    onRegisterError: () => {},
  })

  if (!temVersaoNova) return null
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-3 border-b-2 border-linha bg-lavanda px-4 py-2 text-sm font-semibold">
      {t('app.atualizacao')}
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="min-h-9 rounded-full border-2 border-botao bg-botao px-4 font-bold text-botao-texto"
      >
        {t('app.atualizar')}
      </button>
      <button type="button" onClick={() => setTemVersaoNova(false)} className="min-h-9 rounded-full border-2 border-linha px-4 font-bold">
        {t('app.depois')}
      </button>
    </div>
  )
}
