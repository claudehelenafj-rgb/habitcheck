// Registro de sintomas com o porquê (guia de saúde mental, estratégia 3: "leve o registro para a terapia").
// Tudo aqui é observação: o app conta o que a pessoa anotou e nunca afirma causa.

import type { Dia } from './datas'

export type Duracao = 'minutos' | 'horas' | 'diaTodo'
export const DURACOES: Duracao[] = ['minutos', 'horas', 'diaTodo']

export type RegistroSintoma = {
  id: string
  /** ISO, com hora */
  quando: string
  /** dia local */
  dia: Dia
  sintoma: string
  intensidade: number
  duracao?: Duracao
  /** etiquetas do "Por quê?" */
  porques: string[]
  porqueTexto?: string
  /** etiquetas do "O que ajudou?" */
  ajudou: string[]
  ajudouTexto?: string
  /** a pessoa marcou "pode ser efeito do remédio?" */
  efeitoRemedio?: boolean
}

// Listas iniciais: a pessoa apaga e cria as dela.
export const SINTOMAS_INICIAIS = [
  'ansiedade',
  'tristeza',
  'irritação',
  'cansaço',
  'dor de cabeça',
  'sobrecarga sensorial',
  'travei (não consegui começar)',
  'choro',
  'sem apetite',
  'insônia',
]
export const PORQUES_INICIAIS = [
  'dormi mal',
  'barulho',
  'muita gente',
  'prazo',
  'conflito',
  'mudança de planos',
  'fome',
  'esqueci o remédio',
  'não sei',
]
export const AJUDOU_INICIAIS = ['respirar devagar', 'caminhar', 'água', 'silêncio', 'fone', 'deitar um pouco', 'conversar com alguém', 'música']

/**
 * Tamanho da bolinha no calendário do mês, pela maior intensidade do dia:
 * 0 = sem registro, 1 = 0 a 3, 2 = 4 a 6, 3 = 7 a 10.
 */
export type NivelBolinha = 0 | 1 | 2 | 3

export function nivel(intensidade: number | undefined): NivelBolinha {
  if (intensidade === undefined) return 0
  if (intensidade <= 3) return 1
  if (intensidade <= 6) return 2
  return 3
}

/** Maior intensidade registrada em cada dia. */
export function maiorPorDia(lista: RegistroSintoma[]): Map<Dia, number> {
  const mapa = new Map<Dia, number>()
  for (const r of lista) mapa.set(r.dia, Math.max(mapa.get(r.dia) ?? 0, r.intensidade))
  return mapa
}

export type Contagem = { nome: string; vezes: number }

/** As etiquetas que mais aparecem, da mais frequente para a menos; empate fica em ordem alfabética. */
export function maisFrequentes(valores: string[], limite = 3): Contagem[] {
  const contagem = new Map<string, number>()
  for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1)
  return [...contagem]
    .map(([nome, vezes]) => ({ nome, vezes }))
    .sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, limite)
}

/** Resumo do mês: sintomas, porquês e o que ajudou que mais se repetem ("não sei" não entra nos porquês). */
export function resumoDoMes(lista: RegistroSintoma[]) {
  return {
    registros: lista.length,
    dias: new Set(lista.map((r) => r.dia)).size,
    sintomas: maisFrequentes(lista.map((r) => r.sintoma)),
    porques: maisFrequentes(lista.flatMap((r) => r.porques).filter((p) => p !== 'não sei')),
    ajudou: maisFrequentes(lista.flatMap((r) => r.ajudou)),
    efeitoRemedio: lista.filter((r) => r.efeitoRemedio).length,
  }
}

/** Primeiro e último dia do mês de um dia qualquer. */
export function limitesDoMes(dia: Dia): [Dia, Dia] {
  const [ano, mes] = dia.split('-').map(Number)
  const ultimo = new Date(ano, mes, 0).getDate()
  const mm = String(mes).padStart(2, '0')
  return [`${ano}-${mm}-01`, `${ano}-${mm}-${String(ultimo).padStart(2, '0')}`]
}

/** Normaliza uma etiqueta digitada: sem espaços sobrando, em minúsculas. */
export function etiqueta(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
}
