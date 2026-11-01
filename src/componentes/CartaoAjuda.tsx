// "Vale conversar com um profissional": aparece no topo do Bem-estar quando as anotações das últimas
// 2 semanas estão pesadas. Gentil, com atalho para o resumo da consulta, e some por 30 dias ao fechar.

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { mudarBemEstar, useBemEstar } from '../dados/bemEstar'
import { useCheckinsDesde } from '../dados/checkins'
import { useHobbies } from '../dados/hobbies'
import { useSintomasDesde } from '../dados/sintomas'
import { motivoParaAjuda, JANELA_AJUDA } from '../logica/ajuda'
import { diaLocal, somarDias } from '../logica/datas'
import { Botao } from './Botao'

export function CartaoAjuda() {
  const { t } = useTranslation()
  const hoje = diaLocal()
  const inicio = somarDias(hoje, -(JANELA_AJUDA - 1))
  const config = useBemEstar()
  const checkins = useCheckinsDesde(inicio)
  const sintomas = useSintomasDesde(inicio)
  const hobbies = useHobbies()
  if (!config || !checkins || !sintomas || !hobbies) return null
  const motivo = motivoParaAjuda(checkins, sintomas, hobbies.hobbies, hoje, config.ajudaDispensadaEm)
  if (!motivo) return null
  return (
    <section aria-labelledby="titulo-ajuda" className="cartao flex flex-col gap-3 bg-lilas p-5">
      <h2 id="titulo-ajuda" className="text-xl font-semibold">
        {t('ajuda.titulo')}
      </h2>
      <p>{t(motivo === 'diasPesados' ? 'ajuda.diasPesados' : 'ajuda.hobbiesSemEnergia')}</p>
      <p>{t('ajuda.onde')}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/resumo-consulta"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto"
        >
          {t('ajuda.verResumo')}
        </Link>
        <Botao variante="contorno" onClick={() => mudarBemEstar(() => ({ ajudaDispensadaEm: hoje }))}>
          {t('ajuda.agoraNao')}
        </Botao>
      </div>
    </section>
  )
}
