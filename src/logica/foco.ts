// Modo foco (guia: sistema de trabalho, tempo visível e saída programada do hiperfoco).
// Este arquivo cresce na parte 2 da etapa 9; aqui fica o registro de cada sessão.

import type { Dia } from './datas'

export type SessaoFoco = {
  id: string
  tarefaId?: string
  dia: Dia
  inicio: string // ISO
  fim: string // ISO
  /** minutos de foco de verdade (sem as pausas) */
  minutos: number
  /** quanto a pessoa achou que ia levar */
  estimativaMin?: number
}
