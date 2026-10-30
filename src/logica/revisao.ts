// Revisão semanal: o que foi feito nos últimos 7 dias (só o que foi feito, sem cobrança), os avisos que tocaram e
// ficaram sem resposta (para mudar o horário ou desligar) e os dias das próximas 2 semanas.

import type { Tarefa } from '../dados/banco'
import type { IdRefeicao } from './alimentacao'
import { somarDias, type Dia } from './datas'
import type { Habito, RegistroHabito } from './habitos'
import type { RegistroDose } from './remedios'
import type { IdRitual, RegistroRitual, RespostasRevisao } from './rituais'

/** Os 7 dias que terminam hoje (a revisão pode ser feita em qualquer dia). */
export function ultimos7Dias(hoje: Dia): Dia[] {
  return Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6))
}

/** De amanhã até daqui a `n` dias. */
export function proximosDias(hoje: Dia, n = 14): Dia[] {
  return Array.from({ length: n }, (_, i) => somarDias(hoje, i + 1))
}

export type ResumoSemana = {
  tarefasFeitas: Tarefa[]
  habitos: Array<{ habito: Habito; vezes: number }>
  rituais: Record<'manha' | 'noite', number>
}

/** O que foi feito nos dias: tarefas concluídas, vezes de cada hábito e rituais feitos. */
export function resumoDaSemana(
  dados: { tarefas: Tarefa[]; habitos: Habito[]; registrosHabito: RegistroHabito[]; rituais: RegistroRitual[] },
  dias: Dia[],
): ResumoSemana {
  const naSemana = new Set(dias)
  const feitos = (ritual: IdRitual) => dados.rituais.filter((r) => r.ritual === ritual && r.feitoEm && naSemana.has(r.dia)).length
  return {
    tarefasFeitas: dados.tarefas.filter((t) => t.feitaNoDia && naSemana.has(t.feitaNoDia)).sort((a, b) => a.feitaEm!.localeCompare(b.feitaEm!)),
    habitos: dados.habitos
      .filter((h) => !h.arquivadoEm)
      .map((habito) => ({ habito, vezes: dados.registrosHabito.filter((r) => r.habitoId === habito.id && naSemana.has(r.dia)).length })),
    rituais: { manha: feitos('manha'), noite: feitos('noite') },
  }
}

// ---------- avisos sem resposta ----------

export type AvisoIgnorado =
  | { tipo: 'remedio'; chave: string; remedioId: string; horario: string; vezes: number }
  | { tipo: 'habito'; chave: string; habitoId: string; vezes: number }
  | { tipo: 'refeicao'; chave: string; refeicao: IdRefeicao; vezes: number }
  | { tipo: 'ritual'; chave: string; ritual: IdRitual; vezes: number }

/** O que conta como feito em cada dia, para saber se o aviso daquele dia ficou sem resposta. */
export type FeitoNoDia = {
  habito: (id: string, dia: Dia) => boolean
  refeicao: (id: IdRefeicao, dia: Dia) => boolean
  ritual: (ritual: IdRitual, dia: Dia) => boolean
}

/**
 * Avisos que tocaram nos dias e ficaram sem resposta, agrupados, dos mais repetidos para os menos:
 * doses com aviso e sem "tomei/pulei/adiei", e lembretes de hábito, refeição e ritual que tocaram (estão no registro
 * de avisos já mostrados) num dia em que a coisa não foi feita.
 */
export function avisosSemResposta(doses: RegistroDose[], avisados: string[], dias: Dia[], feito: FeitoNoDia): AvisoIgnorado[] {
  const naSemana = new Set(dias)
  const porChave = new Map<string, AvisoIgnorado>()
  const contar = (novo: AvisoIgnorado) => {
    const ja = porChave.get(novo.chave)
    if (ja) ja.vezes++
    else porChave.set(novo.chave, novo)
  }
  for (const r of doses) {
    if (naSemana.has(r.dia) && r.avisos > 0 && !r.status) {
      contar({ tipo: 'remedio', chave: `remedio|${r.remedioId}|${r.horario}`, remedioId: r.remedioId, horario: r.horario, vezes: 1 })
    }
  }
  for (const id of new Set(avisados)) {
    // habito|<id>|<dia>, refeicao|<id>|<dia>, ritual|<ritual>|<dia>
    const [tipo, a, b] = id.split('|')
    if (tipo === 'habito' && naSemana.has(b) && !feito.habito(a, b)) contar({ tipo: 'habito', chave: `habito|${a}`, habitoId: a, vezes: 1 })
    if (tipo === 'refeicao' && naSemana.has(b) && !feito.refeicao(a as IdRefeicao, b))
      contar({ tipo: 'refeicao', chave: `refeicao|${a}`, refeicao: a as IdRefeicao, vezes: 1 })
    // o aviso da própria revisão não entra: ela está acontecendo agora
    if (tipo === 'ritual' && a !== 'revisao' && naSemana.has(b) && !feito.ritual(a as IdRitual, b))
      contar({ tipo: 'ritual', chave: `ritual|${a}`, ritual: a as IdRitual, vezes: 1 })
  }
  return [...porChave.values()].sort((x, y) => y.vezes - x.vezes)
}

/** Para a revisão: o "o que eu ajusto" da revisão anterior a esta (se houver). */
export function ajusteAnterior(revisoes: RegistroRitual[], atual: string): { dia: Dia; ajusto: string } | undefined {
  const anterior = revisoes
    .filter((r) => r.ritual === 'revisao' && r.id !== atual && r.dia < atual.slice(atual.indexOf('|') + 1) && r.respostas?.ajusto?.trim())
    .sort((a, b) => b.dia.localeCompare(a.dia))[0]
  return anterior ? { dia: anterior.dia, ajusto: (anterior.respostas as RespostasRevisao).ajusto!.trim() } : undefined
}
