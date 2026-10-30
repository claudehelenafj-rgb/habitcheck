// Junta tudo o que pode ir para o cartão "Agora": remédios, consultas, eventos, refeições, tarefas e hábitos
// (refeições e hábitos só das áreas ligadas).

import { useTranslation } from 'react-i18next'
import { nomeRefeicao } from '../componentes/Refeicoes'
import { candidatosDeRefeicoes } from '../logica/alimentacao'
import { diaLocal } from '../logica/datas'
import { ocorrencias } from '../logica/calendario'
import {
  candidatosDeConsultas,
  candidatosDeEventos,
  candidatosDeHabitos,
  candidatosDeRemedios,
  candidatosDeTarefas,
  escolherAgora,
  type Candidato,
} from '../logica/hoje'
import { useAlimentacaoDeHoje } from './alimentacao'
import { useConsultas } from './consultas'
import { useEventos } from './eventos'
import { useHabitosAtivos } from './habitos'
import { useDosesDoDia } from './remedios'
import { useTarefas } from './tarefas'

export function useCandidatoAgora(agora: Date): { candidato: Candidato | undefined; pronto: boolean } {
  const { t } = useTranslation()
  const tarefas = useTarefas()
  const doses = useDosesDoDia(diaLocal(agora))
  const consultas = useConsultas()
  const eventos = useEventos()
  const habitos = useHabitosAtivos()
  const comida = useAlimentacaoDeHoje(diaLocal(agora))
  if (!tarefas || !doses || !consultas || !eventos || !habitos || comida === undefined) return { candidato: undefined, pronto: false }
  const textos = {
    arrumar: (titulo: string) => t('consultas.arrumarPara', { titulo }),
    sair: (titulo: string) => t('consultas.sairPara', { titulo }),
  }
  const candidatos = [
    ...candidatosDeRemedios(doses.doses, doses.registros, agora),
    ...candidatosDeConsultas(consultas, agora, textos),
    ...candidatosDeEventos(ocorrencias(eventos, diaLocal(agora), diaLocal(agora)), agora),
    ...(comida ? candidatosDeRefeicoes(comida.config, comida.dia, agora, (r) => nomeRefeicao(t, r)) : []),
    ...candidatosDeTarefas(tarefas, diaLocal(agora)),
    ...candidatosDeHabitos(habitos.habitos, habitos.registros, diaLocal(agora)),
  ]
  return { candidato: escolherAgora(candidatos, agora), pronto: true }
}
