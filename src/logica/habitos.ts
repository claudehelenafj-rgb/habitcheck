// Hábitos (guia: planos se-então, começar pequeno, falhar é esperado). Usados pela Academia.
// Cada hábito tem um plano se-então ("Se eu chegar da faculdade, então troco de roupa antes de sentar") e uma
// versão mínima que conta como feito. Dia sem registro é neutro: nunca vira erro, nunca zera nada.

import type { NomeAdesivo } from '../componentes/Adesivo'
import type { IdArea } from '../design/areas'
import { diaLocal, somarDias, type Dia } from './datas'
import { INICIO_BLOCO, type Bloco } from './hoje'
import { diasDaSemana } from './remedios'

export type NivelHabito = 'completo' | 'minimo'

export type Habito = {
  id: string
  titulo: string
  area?: IdArea
  adesivo: NomeAdesivo
  /** "Se…" (o gatilho) */
  se: string
  /** "então…" (a ação) */
  entao: string
  /** a versão mínima, que também conta */
  minima: string
  /** vezes por semana */
  meta: number
  /** dias combinados (0 = domingo); vazio = qualquer dia da semana */
  dias: number[]
  /** parte do dia, para o cartão "Agora" e a linha do dia */
  bloco?: Bloco
  /** lembrete com o plano escrito ('HH:MM') */
  lembrete?: string
  /** base de lançamento: o que deixar pronto na véspera (ex.: mochila, garrafa, fone) */
  base?: string[]
  /** treino acompanhado: com quem vai */
  companhia?: string
  /** aviso na véspera ('HH:MM'): deixar a base pronta e combinar com a companhia */
  vespera?: string
  /** o que já ficou pronto para um dia (só vale para aquele dia) */
  preparo?: Preparo
  objetivoId?: string
  arquivadoEm?: string // ISO
  criadoEm: string // ISO
}

export type Preparo = { dia: Dia; itens: string[]; combinado?: boolean }

/** Um registro por hábito e por dia. Sem registro = nada a mostrar (neutro). */
export type RegistroHabito = { id: string; habitoId: string; dia: Dia; nivel: NivelHabito; quando: string }

export const idRegistro = (habitoId: string, dia: Dia) => `${habitoId}|${dia}`

const diaDaSemanaDe = (dia: Dia) => new Date(`${dia}T12:00:00`).getDay()

/** O hábito está combinado para este dia? (sem dias escolhidos, vale qualquer dia) */
export function combinadoNoDia(h: Pick<Habito, 'dias'>, dia: Dia): boolean {
  return !h.dias.length || h.dias.includes(diaDaSemanaDe(dia))
}

/** Quantas vezes aconteceu na semana (segunda a domingo) do dia dado. A versão mínima conta. */
export function vezesNaSemana(registros: RegistroHabito[], dia: Dia): number {
  const semana = new Set(diasDaSemana(dia))
  return registros.filter((r) => semana.has(r.dia)).length
}

export function metaFeita(h: Pick<Habito, 'meta'>, registros: RegistroHabito[], dia: Dia): boolean {
  return vezesNaSemana(registros, dia) >= h.meta
}

/**
 * Entra em "Hoje"? Sem registro hoje e: combinado para hoje (com dias escolhidos) ou, sem dias,
 * enquanto a meta da semana não foi feita. Arquivado nunca entra.
 */
export function pendenteHoje(h: Habito, registros: RegistroHabito[], hoje: Dia): boolean {
  if (h.arquivadoEm || registros.some((r) => r.dia === hoje)) return false
  if (h.dias.length) return combinadoNoDia(h, hoje)
  return !metaFeita(h, registros, hoje)
}

export type EstadoDiaHabito = 'feito' | 'minimo' | 'vazio' | 'futuro' | 'livre'

/** Para a grade da semana: futuro e dia não combinado ("livre") ficam com um pontinho; combinado sem registro, contorno vazio. */
export function estadoDoDia(h: Pick<Habito, 'dias'>, registros: RegistroHabito[], dia: Dia, hoje: Dia): EstadoDiaHabito {
  const r = registros.find((x) => x.dia === dia)
  if (r) return r.nivel === 'completo' ? 'feito' : 'minimo'
  if (!combinadoNoDia(h, dia)) return 'livre'
  if (dia > hoje) return 'futuro'
  return 'vazio'
}

/** Próximo nível ao tocar num dia da grade: nada → feito → mínima → nada. */
export function proximoNivel(atual: NivelHabito | undefined): NivelHabito | undefined {
  return atual === undefined ? 'completo' : atual === 'completo' ? 'minimo' : undefined
}

/** Hora de lembrar? Até 30 min depois do horário, só se ainda está pendente hoje. */
export function deveLembrar(h: Habito, registros: RegistroHabito[], agora: Date): boolean {
  if (!h.lembrete) return false
  const hoje = diaLocal(agora)
  if (!pendenteHoje(h, registros, hoje)) return false
  const [hh, mm] = h.lembrete.split(':').map(Number)
  const passou = agora.getHours() * 60 + agora.getMinutes() - (hh * 60 + mm)
  return passou >= 0 && passou <= 30
}

// ---------- Base de lançamento e treino acompanhado ----------

/** Tem algo para preparar na véspera? */
export const temPreparo = (h: Pick<Habito, 'base' | 'companhia'>) => !!(h.base?.length || h.companhia)

/**
 * Para que dia é o preparo agora: a partir da noite (18h), o próximo dia combinado depois de hoje; antes disso,
 * hoje (se combinado e ainda não feito) ou o próximo dia combinado.
 */
export function diaDoPreparo(h: Habito, registros: RegistroHabito[], agora: Date): Dia | null {
  const hoje = diaLocal(agora)
  const contaHoje = agora.getHours() < INICIO_BLOCO.noite && combinadoNoDia(h, hoje) && !registros.some((r) => r.dia === hoje)
  for (let i = contaHoje ? 0 : 1; i <= 7; i++) {
    const dia = somarDias(hoje, i)
    if (combinadoNoDia(h, dia)) return dia
  }
  return null
}

/** O que já está pronto para aquele dia (o preparo de outro dia não vale). */
export function preparoDoDia(h: Pick<Habito, 'preparo'>, dia: Dia): Preparo {
  return h.preparo?.dia === dia ? h.preparo : { dia, itens: [] }
}

export function preparoCompleto(h: Habito, dia: Dia): boolean {
  const p = preparoDoDia(h, dia)
  return (h.base ?? []).every((i) => p.itens.includes(i)) && (!h.companhia || !!p.combinado)
}

/** Liga ou desliga um item do preparo (ou o "combinei") para o dia. */
export function alternarPreparo(h: Pick<Habito, 'preparo'>, dia: Dia, item: string | { combinado: true }): Preparo {
  const p = preparoDoDia(h, dia)
  if (typeof item !== 'string') return { ...p, combinado: !p.combinado }
  return { ...p, itens: p.itens.includes(item) ? p.itens.filter((x) => x !== item) : [...p.itens, item] }
}

/** Aviso da véspera: no horário (até 30 min depois), se amanhã é dia combinado e o preparo ainda não está completo. */
export function deveAvisarVespera(h: Habito, agora: Date): Dia | null {
  if (!h.vespera || h.arquivadoEm || !temPreparo(h)) return null
  const amanha = somarDias(diaLocal(agora), 1)
  if (!combinadoNoDia(h, amanha) || preparoCompleto(h, amanha)) return null
  const [hh, mm] = h.vespera.split(':').map(Number)
  const passou = agora.getHours() * 60 + agora.getMinutes() - (hh * 60 + mm)
  return passou >= 0 && passou <= 30 ? amanha : null
}

/** Modelos prontos e editáveis (os textos vêm das traduções, pela chave). */
export type ModeloHabito = { chave: string; meta: number; bloco?: Bloco; adesivo: NomeAdesivo; comBase?: boolean }
export const MODELOS_ACADEMIA: ModeloHabito[] = [
  { chave: 'academia', meta: 3, bloco: 'tarde', adesivo: 'haltere', comBase: true },
  { chave: 'caminhada', meta: 3, bloco: 'tarde', adesivo: 'folha', comBase: true },
  { chave: 'alongar', meta: 5, bloco: 'manha', adesivo: 'onda' },
]
