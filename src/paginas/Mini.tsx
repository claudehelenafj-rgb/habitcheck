// Janelinha flutuante: relógio, quanto falta no bloco e o cartão "Agora" com o timer.
// Usada dentro da janela "por cima" (Chrome/Edge) e em #/mini (Safari, janela pequena).

import { useTranslation } from 'react-i18next'
import { DefinicoesAdesivo } from '../componentes/Adesivo'
import { Avisos } from '../componentes/Avisos'
import { CartaoAgora } from '../componentes/CartaoAgora'
import { useTarefas } from '../dados/tarefas'
import { useAgora } from '../dados/timer'
import { diaLocal } from '../logica/datas'
import { blocoDoHorario, candidatosDeTarefas, escolherAgora, fimDoBloco, formatarDuracao, minutosAte } from '../logica/hoje'

export function Mini({ janelaPorCima = false }: { janelaPorCima?: boolean }) {
  const { t, i18n } = useTranslation()
  const agora = useAgora(15_000)
  const tarefas = useTarefas() ?? []
  const candidato = escolherAgora(candidatosDeTarefas(tarefas, diaLocal(agora)), agora)
  const bloco = blocoDoHorario(agora)
  const hora = agora.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-fundo p-3 text-tinta">
      {janelaPorCima && <DefinicoesAdesivo />}
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="so-leitor">{t('mini.titulo')}</h1>
        <p className="font-titulo text-3xl font-semibold tabular-nums">{hora}</p>
        <p className="text-sm font-semibold">
          {t('hoje.blocoAcaba', { bloco: t(`hoje.blocos.${bloco}`), tempo: formatarDuracao(minutosAte(agora, fimDoBloco(agora))) })}
        </p>
      </header>
      <CartaoAgora candidato={candidato} compacto />
      {!janelaPorCima && (
        <a href="#/hoje" target="caderninho" className="text-center text-sm font-bold underline underline-offset-4">
          {t('mini.abrirApp')}
        </a>
      )}
      <Avisos />
    </div>
  )
}
