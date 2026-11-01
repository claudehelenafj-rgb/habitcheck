// Faixa de lembrete que aparece em qualquer tela quando há dose na hora e sem resposta.
// Na tela Hoje ela não aparece, porque o cartão "Agora" já mostra o remédio.

import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useDosesDoDia } from '../dados/remedios'
import { useAgora } from '../dados/timer'
import { diaLocal } from '../logica/datas'
import { estadoDose, textoDoLembrete } from '../logica/remedios'
import { Adesivo } from './Adesivo'
import { BotoesDose } from './BotoesDose'

export function BannerLembrete() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const agora = useAgora(20_000)
  const dados = useDosesDoDia(diaLocal(agora))
  if (!dados || pathname === '/hoje') return null
  const pendentes = dados.doses.filter((d) => estadoDose(d, dados.registros.find((r) => r.id === d.id), agora) === 'agora')
  if (!pendentes.length) return null
  const dose = pendentes[0]
  return (
    <section role="alert" aria-label={t('remedios.lembrete')} className="flex flex-wrap items-center gap-3 border-b-2 border-linha bg-morango-claro px-4 py-3">
      <Adesivo nome="pilula" tamanho={36} />
      <p className="min-w-0 flex-1 font-semibold">
        <span className="rotulo block">
          {t('remedios.lembrete')} · {dose.horario}
        </span>
        {textoDoLembrete(dose.remedio)}
      </p>
      <BotoesDose dose={dose} />
    </section>
  )
}
