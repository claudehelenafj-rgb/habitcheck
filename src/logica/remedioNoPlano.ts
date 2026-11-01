// Remédio como parte do plano (guia de saúde mental, estratégia 2). O app não orienta dose nem troca:
// guarda a janela em que a pessoa percebe mais efeito (para encaixar as tarefas A) e como ela está com o remédio.

import type { Dia } from './datas'
import type { DosePrevista } from './remedios'

export type JanelaEfeito = { de: string; ate: string }

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** A hora está dentro da janela? (a janela pode atravessar a meia-noite) */
export function dentroDoEfeito(janela: JanelaEfeito, agora: Date): boolean {
  const m = agora.getHours() * 60 + agora.getMinutes()
  const de = minutos(janela.de)
  const ate = minutos(janela.ate)
  return de <= ate ? m >= de && m < ate : m >= de || m < ate
}

/** Janelas de efeito dos remédios que a pessoa toma hoje, sem repetir remédio. */
export function janelasDeHoje(doses: DosePrevista[]): Array<{ nome: string } & JanelaEfeito> {
  const vistos = new Set<string>()
  const saida: Array<{ nome: string } & JanelaEfeito> = []
  for (const d of doses) {
    const e = d.remedio.efeito
    if (!e || vistos.has(d.remedio.id)) continue
    vistos.add(d.remedio.id)
    saida.push({ nome: d.remedio.nome, ...e })
  }
  return saida.sort((a, b) => a.de.localeCompare(b.de))
}

export type Mudanca = 'melhor' | 'igual' | 'pior'
export const MUDANCAS: Mudanca[] = ['melhor', 'igual', 'pior']
export type AspectoRemedio = 'sono' | 'apetite' | 'ansiedade' | 'humor'
export const ASPECTOS: AspectoRemedio[] = ['sono', 'apetite', 'ansiedade', 'humor']

/** "Como estou com o remédio": anotação livre para levar à consulta. */
export type NotaRemedio = {
  id: string
  dia: Dia
  quando: string // ISO
  /** remédio a que a nota se refere; ausente = os remédios em geral */
  remedioId?: string
  aspectos: Partial<Record<AspectoRemedio, Mudanca>>
  nota?: string
}
