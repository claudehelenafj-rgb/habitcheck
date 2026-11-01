// Meus objetivos: o objetivo final e "por que isso importa para mim", escritos pela pessoa numa folha de caderno, e o
// que faz o objetivo andar (hábitos, tarefas e sessões de estudo, cofrinhos). O ritual da manhã mostra o porquê de um
// objetivo por dia; a revisão semanal pergunta "isso ainda é importante pra mim?".

import type { Objetivo, Tarefa } from '../dados/banco'
import { diasEntre, type Dia } from './datas'
import type { Cofrinho } from './dinheiro'
import type { Habito } from './habitos'

/** Com mais objetivos que isso ao mesmo tempo, o app sugere (sem impedir) deixar algum de lado. */
export const SUGESTAO_OBJETIVOS = 3

export function objetivosAtivos(objetivos: Objetivo[]): Objetivo[] {
  return objetivos.filter((o) => !o.arquivadoEm).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
}

/** O objetivo do dia para o ritual da manhã: um por dia, em rodízio, entre os que têm o porquê escrito. */
export function objetivoDoDia(objetivos: Objetivo[], dia: Dia): Objetivo | undefined {
  const comPorque = objetivosAtivos(objetivos).filter((o) => o.porque.trim())
  if (!comPorque.length) return undefined
  return comPorque[((diasEntre('2026-01-01', dia) % comPorque.length) + comPorque.length) % comPorque.length]
}

export type LigadosAoObjetivo = { habitos: Habito[]; tarefas: Tarefa[]; cofrinhos: Cofrinho[] }

/** O que faz o objetivo andar. Tarefas: as abertas primeiro; hábitos e cofrinhos arquivados ficam de fora. */
export function ligadosAo(objetivoId: string, dados: LigadosAoObjetivo): LigadosAoObjetivo {
  return {
    habitos: dados.habitos.filter((h) => h.objetivoId === objetivoId && !h.arquivadoEm),
    tarefas: dados.tarefas
      .filter((t) => t.objetivoId === objetivoId)
      .sort((a, b) => Number(!!a.feitaEm) - Number(!!b.feitaEm) || a.criadaEm.localeCompare(b.criadaEm)),
    cofrinhos: dados.cofrinhos.filter((c) => c.objetivoId === objetivoId && !c.arquivadoEm),
  }
}

/** Ao apagar um objetivo, o que estava ligado a ele (para soltar agora e religar no "Desfazer"). */
export type Ligacoes = { habitos: string[]; tarefas: string[]; cofrinhos: string[] }
