// Painel de um objetivo: só o que foi feito. Um "dia com ação" é um dia em que algo ligado ao objetivo aconteceu
// (hábito feito, mesmo na versão mínima; tarefa concluída; sessão de foco numa tarefa dele; dinheiro guardado no
// cofrinho dele). Semana parada é só uma coluna baixa; dia sem registro fica neutro.

import type { Tarefa } from '../dados/banco'
import { diasEntre, somarDias, type Dia } from './datas'
import type { Cofrinho, Deposito, Mes } from './dinheiro'
import type { SessaoFoco } from './foco'
import type { Habito, RegistroHabito } from './habitos'
import { diasDaSemana } from './remedios'

export type DadosDoPainel = {
  habitos: Habito[]
  registros: RegistroHabito[]
  tarefas: Tarefa[]
  sessoes: SessaoFoco[]
  cofrinhos: Cofrinho[]
  depositos: Deposito[]
}

/** O que, entre os dados, pertence ao objetivo (inclusive o que foi arquivado: o que foi feito continua contando). */
function doObjetivo(objetivoId: string, d: DadosDoPainel) {
  const habitos = new Set(d.habitos.filter((h) => h.objetivoId === objetivoId).map((h) => h.id))
  const tarefas = d.tarefas.filter((t) => t.objetivoId === objetivoId)
  const idsTarefas = new Set(tarefas.map((t) => t.id))
  const cofrinhos = new Set(d.cofrinhos.filter((c) => c.objetivoId === objetivoId).map((c) => c.id))
  return {
    registros: d.registros.filter((r) => habitos.has(r.habitoId)),
    tarefasFeitas: tarefas.filter((t) => t.feitaNoDia),
    sessoes: d.sessoes.filter((s) => s.tarefaId && idsTarefas.has(s.tarefaId)),
    depositos: d.depositos.filter((x) => cofrinhos.has(x.cofrinhoId) && x.valor > 0),
    temAlgoLigado: habitos.size > 0 || tarefas.length > 0 || cofrinhos.size > 0,
  }
}

export function temAlgoLigado(objetivoId: string, d: DadosDoPainel): boolean {
  return doObjetivo(objetivoId, d).temAlgoLigado
}

/** Os dias em que algo ligado ao objetivo foi feito. */
export function diasComAcao(objetivoId: string, d: DadosDoPainel): Set<Dia> {
  const o = doObjetivo(objetivoId, d)
  return new Set([...o.registros.map((r) => r.dia), ...o.tarefasFeitas.map((t) => t.feitaNoDia!), ...o.sessoes.map((s) => s.dia), ...o.depositos.map((x) => x.dia)])
}

/** Dias com ação em cada uma das últimas `n` semanas (segunda a domingo), da mais antiga até esta. */
export function diasComAcaoPorSemana(dias: Set<Dia>, hoje: Dia, n = 8): Array<{ segunda: Dia; dias: number }> {
  const estaSegunda = diasDaSemana(hoje)[0]
  return Array.from({ length: n }, (_, i) => {
    const segunda = somarDias(estaSegunda, (i - n + 1) * 7)
    return { segunda, dias: diasDaSemana(segunda).filter((dia) => dias.has(dia)).length }
  })
}

const noMes = (dia: Dia, mes: Mes) => dia.startsWith(mes)

/** Minutos de foco por dia do mês (só os dias com foco). */
export function focoPorDia(objetivoId: string, d: DadosDoPainel, mes: Mes): Map<Dia, number> {
  const porDia = new Map<Dia, number>()
  for (const s of doObjetivo(objetivoId, d).sessoes) if (noMes(s.dia, mes)) porDia.set(s.dia, (porDia.get(s.dia) ?? 0) + s.minutos)
  return porDia
}

export type TotaisDoMes = { diasComAcao: number; minutosFoco: number; sessoes: number; tarefasFeitas: number; vezesHabitos: number; guardado: number }

export function totaisDoMes(objetivoId: string, d: DadosDoPainel, mes: Mes): TotaisDoMes {
  const o = doObjetivo(objetivoId, d)
  const sessoes = o.sessoes.filter((s) => noMes(s.dia, mes))
  return {
    diasComAcao: [...diasComAcao(objetivoId, d)].filter((dia) => noMes(dia, mes)).length,
    minutosFoco: sessoes.reduce((soma, s) => soma + s.minutos, 0),
    sessoes: sessoes.length,
    tarefasFeitas: o.tarefasFeitas.filter((t) => noMes(t.feitaNoDia!, mes)).length,
    vezesHabitos: o.registros.filter((r) => noMes(r.dia, mes)).length,
    guardado: o.depositos.filter((x) => noMes(x.dia, mes)).reduce((soma, x) => soma + x.valor, 0),
  }
}

/** Os dias do mês, com o dia da semana do primeiro (0 = domingo), para o mapa de calor. */
export function diasDoMes(mes: Mes): { dias: Dia[]; primeiroDiaSemana: number } {
  const [a, m] = mes.split('-').map(Number)
  const primeiro = `${mes}-01`
  const total = new Date(a, m, 0).getDate()
  return { dias: Array.from({ length: total }, (_, i) => somarDias(primeiro, i)), primeiroDiaSemana: new Date(a, m - 1, 1).getDay() }
}

/** Quantos dias tem a semana até hoje (esta semana ainda não acabou: "3 de 4 dias até agora"). */
export function diasAteHojeNaSemana(hoje: Dia): number {
  return diasEntre(diasDaSemana(hoje)[0], hoje) + 1
}
