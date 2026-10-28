// Regras de captura e de tarefas (estratégias 1, 2, 3 e 8 do guia):
// um lugar só para despejar, no máximo 3 tarefas A por dia, passos pequenos com "pronto quando".

import type { Passo, Tarefa } from '../dados/banco'
import type { Dia } from './datas'

export const LIMITE_TAREFAS_A = 3

/** Cada linha não vazia vira um item da caixa de entrada (dá para colar uma lista inteira). */
export function separarItens(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.replace(/^\s*(?:[-*•]|\d+[.)]|\[ ?\])\s+/, '').trim())
    .filter(Boolean)
}

/** Tarefas A marcadas para um dia, ainda abertas ou já feitas (as feitas também ocupam o lugar). */
export function tarefasADoDia(tarefas: Tarefa[], dia: Dia, ignorarId?: string): Tarefa[] {
  return tarefas.filter((t) => t.prioridade === 'A' && t.dia === dia && t.id !== ignorarId)
}

/** Ainda cabe mais uma tarefa A neste dia? */
export function cabeTarefaA(tarefas: Tarefa[], dia: Dia, ignorarId?: string): boolean {
  return tarefasADoDia(tarefas, dia, ignorarId).length < LIMITE_TAREFAS_A
}

export type Grupos = {
  /** A de hoje, ainda abertas */
  a: Tarefa[]
  /** A de outro dia que ficaram abertas (sem julgamento: só "de outro dia") */
  deOutroDia: Tarefa[]
  b: Tarefa[]
  c: Tarefa[]
  /** feitas hoje, para ver o progresso do dia */
  feitasHoje: Tarefa[]
}

const porCriacao = (x: Tarefa, y: Tarefa) => x.criadaEm.localeCompare(y.criadaEm)

export function agruparTarefas(tarefas: Tarefa[], hoje: Dia): Grupos {
  const abertas = tarefas.filter((t) => !t.feitaEm)
  return {
    a: abertas.filter((t) => t.prioridade === 'A' && (!t.dia || t.dia >= hoje)).sort(porCriacao),
    deOutroDia: abertas.filter((t) => t.prioridade === 'A' && !!t.dia && t.dia < hoje).sort(porCriacao),
    b: abertas.filter((t) => t.prioridade === 'B').sort(porCriacao),
    c: abertas.filter((t) => t.prioridade === 'C').sort(porCriacao),
    feitasHoje: tarefas.filter((t) => t.feitaNoDia === hoje).sort((x, y) => (x.feitaEm ?? '').localeCompare(y.feitaEm ?? '')),
  }
}

export function proximoPasso(tarefa: Pick<Tarefa, 'passos'>): Passo | undefined {
  return tarefa.passos.find((p) => !p.feito)
}

export function progressoPassos(tarefa: Pick<Tarefa, 'passos'>): { feitos: number; total: number } {
  return { feitos: tarefa.passos.filter((p) => p.feito).length, total: tarefa.passos.length }
}

/** Todos os passos feitos (e há pelo menos um): hora de oferecer "concluir a tarefa". */
export function passosCompletos(tarefa: Pick<Tarefa, 'passos'>): boolean {
  return tarefa.passos.length > 0 && tarefa.passos.every((p) => p.feito)
}
