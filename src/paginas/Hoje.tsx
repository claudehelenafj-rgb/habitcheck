// Tela Hoje (provisória até a etapa 5): saudação, acolhimento de volta e o plano de 2 semanas.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { CartaoPlano } from '../componentes/CartaoPlano'
import type { ContextoMoldura } from '../componentes/Moldura'
import { atualizarPerfil } from '../dados/perfil'
import { diaLocal } from '../logica/datas'
import { deveAcolher, diaDoPlano, DURACAO_PLANO, periodoDoDia, retomarPlano } from '../logica/planoInicio'

export function Hoje() {
  const { t } = useTranslation()
  const { perfil, visitaAnterior } = useOutletContext<ContextoMoldura>()
  const [acolhimentoFechado, setAcolhimentoFechado] = useState(false)
  const hoje = diaLocal()
  const dia = diaDoPlano(perfil.inicioPlano, hoje)
  const saudacao = t(`saudacao.${periodoDoDia(new Date().getHours())}`)

  const acolher = !acolhimentoFechado && deveAcolher(visitaAnterior, hoje)
  const diaAlcancado = visitaAnterior ? diaDoPlano(perfil.inicioPlano, visitaAnterior) : dia
  const podeContinuar = acolher && visitaAnterior && diaAlcancado < DURACAO_PLANO

  return (
    <div className="flex flex-col gap-6">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="sol" tamanho={56} />
        {perfil.nome ? t('saudacao.comNome', { saudacao, nome: perfil.nome }) : t('saudacao.semNome', { saudacao })}
      </h1>

      {acolher && (
        <section role="status" className="cartao flex flex-col gap-3 bg-lavanda p-5">
          <p className="flex items-center gap-2 text-2xl font-semibold">
            <Adesivo nome="coracao" tamanho={40} />
            {perfil.nome ? t('acolher.tituloComNome', { nome: perfil.nome }) : t('acolher.titulo')}
          </p>
          <p className="text-lg">{t('acolher.texto')}</p>
          <div className="flex flex-wrap gap-2">
            {podeContinuar ? (
              <>
                <Botao
                  onClick={async () => {
                    await atualizarPerfil({ inicioPlano: retomarPlano(perfil.inicioPlano, visitaAnterior, hoje) })
                    setAcolhimentoFechado(true)
                  }}
                >
                  {t('acolher.continuar', { dia: Math.min(diaAlcancado + 1, DURACAO_PLANO) })}
                </Botao>
                <Botao variante="contorno" onClick={() => setAcolhimentoFechado(true)}>
                  {t('acolher.seguir')}
                </Botao>
              </>
            ) : (
              <Botao variante="contorno" onClick={() => setAcolhimentoFechado(true)}>
                {t('acolher.fechar')}
              </Botao>
            )}
          </div>
        </section>
      )}

      {!perfil.planoEscondido && <CartaoPlano dia={dia} />}

      <p className="cartao flex items-center gap-3 bg-papel p-4 text-sm">
        <Adesivo nome="balao" tamanho={32} />
        {t('hoje.emBreve')}
      </p>
    </div>
  )
}
