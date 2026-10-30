// Calendário: ocorrências de eventos (inclusive os que se repetem) e grades de semana e mês.

import { diaLocal, somarDias, type Dia } from './datas'
import type { OrigemEvento, RegraRepeticao } from './ics'
import { diasDaSemana } from './remedios'

export type Evento = {
  id: string
  titulo: string
  inicio: string // ISO
  fim: string // ISO
  diaInteiro: boolean
  local?: string
  descricao?: string
  origem: OrigemEvento
  /** identificador vindo do arquivo importado (para atualizar sem duplicar) */
  uidExterno?: string
  nomeCalendario?: string
  repeticao?: RegraRepeticao
  excecoes?: string[]
  criadoEm: string
}

export type Ocorrencia = { evento: Evento; inicio: Date; fim: Date; diaInicio: Dia; diaFim: Dia }

const LIMITE_OCORRENCIAS = 2000

function avancar(d: Date, regra: RegraRepeticao, passos: number): Date {
  const r = new Date(d)
  if (regra.freq === 'DAILY') r.setDate(r.getDate() + passos * regra.intervalo)
  else if (regra.freq === 'WEEKLY') r.setDate(r.getDate() + passos * 7 * regra.intervalo)
  else if (regra.freq === 'MONTHLY') r.setMonth(r.getMonth() + passos * regra.intervalo)
  else r.setFullYear(r.getFullYear() + passos * regra.intervalo)
  return r
}

/** Inícios de um evento que se repete, até `ate`. */
function inicios(evento: Evento, ate: Date): Date[] {
  const primeiro = new Date(evento.inicio)
  const regra = evento.repeticao
  if (!regra) return [primeiro]
  const limite = regra.ate ? new Date(Math.min(new Date(regra.ate).getTime(), ate.getTime())) : ate
  const lista: Date[] = []
  if (regra.freq === 'WEEKLY' && regra.diasSemana?.length) {
    // semana a semana, nos dias pedidos, a partir da semana do primeiro evento
    const domingo = new Date(primeiro)
    domingo.setDate(domingo.getDate() - domingo.getDay())
    for (let s = 0; lista.length < LIMITE_OCORRENCIAS; s++) {
      const semana = avancar(domingo, regra, s)
      if (semana > limite) break
      for (const dia of [...regra.diasSemana].sort()) {
        const d = new Date(semana)
        d.setDate(d.getDate() + dia)
        if (d < primeiro || d > limite) continue
        lista.push(d)
        if (regra.vezes && lista.length >= regra.vezes) return lista
      }
    }
    return lista
  }
  for (let i = 0; lista.length < LIMITE_OCORRENCIAS; i++) {
    const d = avancar(primeiro, regra, i)
    if (d > limite) break
    // mensal no dia 31: meses sem dia 31 ficam de fora (como no Google e na Apple)
    if (regra.freq === 'MONTHLY' && d.getDate() !== primeiro.getDate()) continue
    lista.push(d)
    if (regra.vezes && lista.length >= regra.vezes) break
  }
  return lista
}

/** Todas as ocorrências que tocam o intervalo de dias [de, ate]. */
export function ocorrencias(eventos: Evento[], de: Dia, ate: Dia): Ocorrencia[] {
  const inicioJanela = new Date(`${de}T00:00:00`)
  const fimJanela = new Date(`${somarDias(ate, 1)}T00:00:00`)
  const lista: Ocorrencia[] = []
  for (const evento of eventos) {
    const duracao = new Date(evento.fim).getTime() - new Date(evento.inicio).getTime()
    const excecoes = new Set((evento.excecoes ?? []).map((x) => new Date(x).getTime()))
    for (const inicio of inicios(evento, fimJanela)) {
      if (excecoes.has(inicio.getTime())) continue
      const fim = new Date(inicio.getTime() + duracao)
      // fim exclusivo: evento de dia inteiro de 28 termina 29 00:00
      const fimEfetivo = duracao > 0 ? new Date(fim.getTime() - 1) : fim
      if (fimEfetivo < inicioJanela || inicio >= fimJanela) continue
      lista.push({ evento, inicio, fim, diaInicio: diaLocal(inicio), diaFim: diaLocal(fimEfetivo) })
    }
  }
  return lista.sort(
    (a, b) => Number(b.evento.diaInteiro) - Number(a.evento.diaInteiro) || a.inicio.getTime() - b.inicio.getTime() || a.evento.titulo.localeCompare(b.evento.titulo),
  )
}

/** Ocorrências que acontecem num dia (inclusive as de vários dias). */
export function doDia(lista: Ocorrencia[], dia: Dia): Ocorrencia[] {
  return lista.filter((o) => o.diaInicio <= dia && o.diaFim >= dia)
}

/** 6 semanas (segunda a domingo) que cobrem o mês do dia dado. */
export function gradeDoMes(dia: Dia): Dia[][] {
  const primeiro = `${dia.slice(0, 7)}-01`
  const inicio = diasDaSemana(primeiro)[0]
  return Array.from({ length: 6 }, (_, s) => Array.from({ length: 7 }, (_, d) => somarDias(inicio, s * 7 + d)))
}

export function mesmoMes(a: Dia, b: Dia): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

export type ResultadoImportacao = { novos: number; atualizados: number; ignorados: number }

/**
 * Junta eventos importados com os que já existem, sem duplicar:
 * mesmo identificador externo = atualiza; novo = cria.
 */
export function mesclarImportacao(
  existentes: Evento[],
  importados: Array<Omit<Evento, 'id' | 'criadoEm'>>,
  gerarId: () => string,
  agoraIso: string,
): { salvar: Evento[]; resultado: ResultadoImportacao } {
  const porUid = new Map(existentes.filter((e) => e.uidExterno).map((e) => [e.uidExterno!, e]))
  const salvar: Evento[] = []
  let novos = 0
  let atualizados = 0
  let ignorados = 0
  const vistos = new Set<string>()
  for (const imp of importados) {
    const uid = imp.uidExterno
    if (uid && vistos.has(uid)) {
      ignorados++
      continue
    }
    if (uid) vistos.add(uid)
    const antigo = uid ? porUid.get(uid) : undefined
    if (antigo) {
      const novo = { ...antigo, ...imp, id: antigo.id, criadoEm: antigo.criadoEm }
      if (JSON.stringify(novo) !== JSON.stringify(antigo)) {
        salvar.push(novo)
        atualizados++
      } else ignorados++
    } else {
      salvar.push({ ...imp, id: gerarId(), criadoEm: agoraIso })
      novos++
    }
  }
  return { salvar, resultado: { novos, atualizados, ignorados } }
}
