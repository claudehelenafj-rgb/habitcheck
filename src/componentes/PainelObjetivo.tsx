// Painel de um objetivo: números do mês, dias com ação por semana (colunas) e minutos de foco por dia (mapa de calor).
// Só o que foi feito; cada gráfico tem "Ver como tabela".

import { useTranslation } from 'react-i18next'
import type { Objetivo } from '../dados/banco'
import { diaLocal } from '../logica/datas'
import { formatarValor, mesDe } from '../logica/dinheiro'
import {
  diasAteHojeNaSemana,
  diasComAcao,
  diasComAcaoPorSemana,
  diasDoMes,
  focoPorDia,
  temAlgoLigado,
  totaisDoMes,
  type DadosDoPainel,
} from '../logica/painelObjetivo'
import { diasDaSemana } from '../logica/remedios'
import { CartaoNumero, ColunasSemanais, MapaDeCalor } from './Graficos'

export function PainelObjetivo({ objetivo, dados, agora }: { objetivo: Objetivo; dados: DadosDoPainel; agora: Date }) {
  const { t, i18n } = useTranslation()
  if (!temAlgoLigado(objetivo.id, dados)) {
    return <p className="rounded-2xl border-2 border-dashed border-linha/50 p-4">{t('objetivos.painelVazio')}</p>
  }
  const hoje = diaLocal(agora)
  const mes = mesDe(hoje)
  const nomeMes = agora.toLocaleDateString(i18n.language, { month: 'long' })
  const dias = diasComAcao(objetivo.id, dados)
  const semana = diasDaSemana(hoje).filter((d) => d <= hoje && dias.has(d)).length
  const totais = totaisDoMes(objetivo.id, dados, mes)
  const ligados = {
    habitos: dados.habitos.some((h) => h.objetivoId === objetivo.id),
    cofrinhos: dados.cofrinhos.some((c) => c.objetivoId === objetivo.id),
  }
  const semanas = diasComAcaoPorSemana(dias, hoje).map(({ segunda, dias: n }, i, todas) => {
    const data = new Date(`${segunda}T12:00:00`)
    return {
      rotulo: `${data.getDate()}/${data.getMonth() + 1}`,
      descricao: i === todas.length - 1 ? t('objetivos.estaSemana') : t('objetivos.semanaDe', { data: data.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' }) }),
      valor: n,
    }
  })
  const doMes = diasDoMes(mes)
  const foco = focoPorDia(objetivo.id, dados, mes)
  return (
    <section aria-label={t('objetivos.painel', { objetivo: objetivo.titulo })} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <CartaoNumero
          rotulo={t('objetivos.diasNestaSemana')}
          valor={String(semana)}
          detalhe={t('objetivos.deDiasAteHoje', { count: diasAteHojeNaSemana(hoje) })}
          tom="bg-lavanda"
        />
        <CartaoNumero rotulo={t('objetivos.diasNoMes', { mes: nomeMes })} valor={String(totais.diasComAcao)} tom="bg-lavanda" />
        <CartaoNumero
          rotulo={t('objetivos.focoNoMes', { mes: nomeMes })}
          valor={String(totais.minutosFoco)}
          detalhe={t('objetivos.emSessoes', { count: totais.sessoes })}
        />
        <CartaoNumero rotulo={t('objetivos.tarefasNoMes', { mes: nomeMes })} valor={String(totais.tarefasFeitas)} />
        {ligados.habitos && <CartaoNumero rotulo={t('objetivos.habitosNoMes', { mes: nomeMes })} valor={String(totais.vezesHabitos)} />}
        {ligados.cofrinhos && <CartaoNumero rotulo={t('objetivos.guardadoNoMes', { mes: nomeMes })} valor={formatarValor(totais.guardado, i18n.language)} />}
      </div>
      <ColunasSemanais
        titulo={t('objetivos.colunasTitulo')}
        subtitulo={t('objetivos.colunasSub')}
        dados={semanas}
        maximo={7}
        unidade={t('objetivos.unidadeDias')}
      />
      <MapaDeCalor
        titulo={t('objetivos.mapaTitulo')}
        subtitulo={agora.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
        primeiroDiaSemana={doMes.primeiroDiaSemana}
        dias={doMes.dias.map((dia, i) => ({ dia: i + 1, valor: foco.get(dia) ?? 0, hoje: dia === hoje, futuro: dia > hoje }))}
      />
      {totais.minutosFoco === 0 && <p className="text-sm">{t('objetivos.mapaDica')}</p>}
    </section>
  )
}
