// Faixa do modo foco em andamento, em qualquer tela do app: quanto falta e o caminho de volta.
// Sair da tela de foco não para o tempo; esta faixa lembra disso.

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useEstadoFoco } from '../dados/foco'
import { useAgora } from '../dados/timer'
import { acabouFase, segundosDaFase } from '../logica/foco'
import { formatarDuracao } from '../logica/hoje'
import { Adesivo } from './Adesivo'

export function BannerFoco() {
  const { t } = useTranslation()
  const agora = useAgora(15_000)
  const foco = useEstadoFoco()
  if (!foco) return null
  const acabou = foco.fase === 'fim' || acabouFase(foco, agora)
  return (
    <section role="status" className={`flex flex-wrap items-center gap-3 border-b-2 border-linha px-4 py-2.5 ${acabou ? 'bg-lavanda' : 'bg-papel'}`}>
      <Adesivo nome="estrela" tamanho={30} />
      <p className="min-w-0 flex-1 font-semibold">
        {acabou ? t('foco.acabouBanner') : t('foco.emAndamento', { tempo: formatarDuracao(Math.ceil(segundosDaFase(foco, agora) / 60)) })}
        <span className="block text-sm font-normal break-words">{foco.titulo}</span>
      </p>
      <Link to="/foco" className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto">
        {t('foco.voltarFoco')}
      </Link>
    </section>
  )
}
