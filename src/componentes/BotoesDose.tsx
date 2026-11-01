// Botões grandes de uma dose: Tomei, Adiar 10 min, Pular. Cada resposta tem "Desfazer".

import { useTranslation } from 'react-i18next'
import { desfazerResposta, responderDose } from '../dados/remedios'
import type { DosePrevista, StatusDose } from '../logica/remedios'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

export function BotoesDose({ dose, grande = false }: { dose: DosePrevista; grande?: boolean }) {
  const { t } = useTranslation()
  async function responder(status: StatusDose) {
    await responderDose(dose, status)
    const texto = status === 'tomei' ? t('remedios.respTomei') : status === 'pulei' ? t('remedios.respPulei') : t('remedios.respAdiada')
    mostrarAviso(texto, () => desfazerResposta(dose))
  }
  const tamanho = grande ? '' : 'min-h-10 px-4 text-sm'
  return (
    <div className="flex flex-wrap gap-2">
      <Botao grande={grande} className={tamanho} onClick={() => responder('tomei')} icone={<span aria-hidden="true">✓</span>}>
        {t('remedios.tomei')}
      </Botao>
      <Botao variante="secundario" tom="bg-pessego" className={tamanho} onClick={() => responder('adiada')}>
        {t('remedios.adiar')}
      </Botao>
      <Botao variante="contorno" className={tamanho} onClick={() => responder('pulei')}>
        {t('remedios.pular')}
      </Botao>
    </div>
  )
}
