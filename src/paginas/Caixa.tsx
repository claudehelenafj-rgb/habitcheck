// Caixa de entrada: tudo o que foi despejado na captura rápida, esperando uma decisão.

import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { abrirCaptura, ATALHO_CAPTURA } from '../componentes/Captura'
import { ListaCaixa } from '../componentes/ListaCaixa'
import type { ContextoMoldura } from '../componentes/Moldura'
import { AREAS_COM_HABITOS } from '../logica/habitos'
import { useCaixaAberta } from '../dados/tarefas'

export function Caixa() {
  const { t } = useTranslation()
  const itens = useCaixaAberta()
  const { perfil } = useOutletContext<ContextoMoldura>()
  // "Virar hábito" vale para as áreas com hábitos que estão ligadas
  const areasHabito = AREAS_COM_HABITOS.filter((a) => perfil.areasAtivas.includes(a))
  if (!itens) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="envelope" tamanho={56} />
          {t('caixa.titulo')}
        </h1>
        <Botao onClick={abrirCaptura} atalho={ATALHO_CAPTURA} icone={<span aria-hidden="true">+</span>}>
          {t('captura.botao')}
        </Botao>
      </div>
      <p className="max-w-prose">{t('caixa.texto')}</p>

      {itens.length === 0 ? (
        <div className="cartao flex flex-col items-center gap-3 bg-papel p-8 text-center">
          <div aria-hidden="true" className="decor estampa estampa-atual h-6 w-full rounded-full border-2 border-linha bg-papel" />
          <Adesivo nome="sapinho" tamanho={72} />
          <p className="text-2xl font-semibold">{t('caixa.vazia')}</p>
          <p className="max-w-prose text-sm">{t('caixa.vaziaDica')}</p>
        </div>
      ) : (
        <>
          <p className="rotulo" aria-live="polite">
            {t('caixa.contagem', { count: itens.length })}
          </p>
          <ListaCaixa itens={itens} areasHabito={areasHabito} />
        </>
      )}
    </div>
  )
}
