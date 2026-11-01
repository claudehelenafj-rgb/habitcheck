// "Avisos discretos": o aviso do sistema só diz "Caderninho · lembrete", sem nome de remédio nem assunto.
// Aparece nos Ajustes e na Privacidade do Bem-estar: é a mesma escolha.

import { useTranslation } from 'react-i18next'
import { mudarConfigAvisos, useConfigAvisos } from '../dados/remedios'

export function AvisosDiscretos() {
  const { t } = useTranslation()
  const config = useConfigAvisos()
  return (
    <label className="flex items-start gap-2">
      <input
        id="avisos-discretos"
        type="checkbox"
        checked={!!config.discretos}
        onChange={(e) => {
          const discretos = e.target.checked
          mudarConfigAvisos(() => ({ discretos }))
        }}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--chocolate)]"
      />
      <span>
        <span className="block font-bold">{t('ajustes.discretos')}</span>
        <span className="block text-sm">{t('ajustes.discretosDica')}</span>
      </span>
    </label>
  )
}
