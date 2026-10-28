// Junta tudo o que pode ir para o cartão "Agora": remédios, consultas e tarefas.

import { useTranslation } from 'react-i18next'
import { diaLocal } from '../logica/datas'
import { ocorrencias } from '../logica/calendario'
import { candidatosDeConsultas, candidatosDeEventos, candidatosDeRemedios, candidatosDeTarefas, escolherAgora, type Candidato } from '../logica/hoje'
import { useConsultas } from './consultas'
import { useEventos } from './eventos'
import { useDosesDoDia } from './remedios'
import { useTarefas } from './tarefas'

export function useCandidatoAgora(agora: Date): { candidato: Candidato | undefined; pronto: boolean } {
  const { t } = useTranslation()
  const tarefas = useTarefas()
  const doses = useDosesDoDia(diaLocal(agora))
  const consultas = useConsultas()
  const eventos = useEventos()
  if (!tarefas || !doses || !consultas || !eventos) return { candidato: undefined, pronto: false }
  const textos = {
    arrumar: (titulo: string) => t('consultas.arrumarPara', { titulo }),
    sair: (titulo: string) => t('consultas.sairPara', { titulo }),
  }
  const candidatos = [
    ...candidatosDeRemedios(doses.doses, doses.registros, agora),
    ...candidatosDeConsultas(consultas, agora, textos),
    ...candidatosDeEventos(ocorrencias(eventos, diaLocal(agora), diaLocal(agora)), agora),
    ...candidatosDeTarefas(tarefas, diaLocal(agora)),
  ]
  return { candidato: escolherAgora(candidatos, agora), pronto: true }
}
