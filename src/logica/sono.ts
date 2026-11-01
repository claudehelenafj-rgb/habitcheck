// Sono (guia de saúde mental, estratégia 6: TCC para insônia). Horário fixo de acordar, rotina para
// desacelerar, diário de sono e, se o sono for ruim na maioria das noites por algumas semanas,
// uma sugestão gentil de procurar avaliação profissional. O app não diagnostica.

import { diasEntre, somarDias, type Dia } from './datas'

export type Demora = 'menos15' | '15a30' | '30a60' | 'mais60'
export const DEMORAS: Demora[] = ['menos15', '15a30', '30a60', 'mais60']
/** Minutos que cada faixa representa nas contas (o meio da faixa). */
const MINUTOS_DEMORA: Record<Demora, number> = { menos15: 10, '15a30': 22, '30a60': 45, mais60: 75 }

export type Despertares = 0 | 1 | 2 | 3
/** 1 = muito ruim … 5 = muito boa */
export type Qualidade = 1 | 2 | 3 | 4 | 5

export type RegistroSono = {
  id: string
  /** a noite é o dia em que a pessoa foi deitar (noite de 28 para 29 = 28) */
  noite: Dia
  deitou: string // HH:MM
  levantou: string // HH:MM
  demora: Demora
  /** 3 = três ou mais */
  despertares: Despertares
  qualidade: Qualidade
  nota?: string
  registradoEm: string // ISO
}

export type PassoRotina = { id: string; texto: string }

export const ROTINA_INICIAL: PassoRotina[] = [
  { id: 'luzes', texto: 'Diminuir as luzes' },
  { id: 'celular', texto: 'Deixar o celular longe da cama' },
  { id: 'banho', texto: 'Banho morno ou lavar o rosto' },
  { id: 'calmo', texto: 'Ler algo leve ou ouvir algo calmo' },
  { id: 'cabeca', texto: 'Anotar o que ficou na cabeça para amanhã' },
]

export type ConfigSono = {
  /** horário fixo de acordar, todos os dias */
  acordarAs?: string
  lembreteAcordar?: boolean
  /** horário em que pretende deitar (opcional) */
  deitarAs?: string
  /** aviso para começar a desacelerar, este tanto de minutos antes de deitar */
  lembreteRotina?: boolean
  rotina?: PassoRotina[]
  /** a pessoa fechou o cartão de "vale conversar com um profissional" neste dia */
  avaliacaoDispensadaEm?: Dia
}

export const MINUTOS_DESACELERAR = 30

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** Tempo na cama, atravessando a meia-noite (23:30 → 07:00 = 7 h 30). */
export function minutosNaCama(deitou: string, levantou: string): number {
  const d = minutos(levantou) - minutos(deitou)
  return d > 0 ? d : d + 24 * 60
}

/** Estimativa de sono: tempo na cama menos a demora para pegar no sono. */
export function minutosDeSono(r: Pick<RegistroSono, 'deitou' | 'levantou' | 'demora'>): number {
  return Math.max(0, minutosNaCama(r.deitou, r.levantou) - MINUTOS_DEMORA[r.demora])
}

/** Noite difícil: qualidade ruim, mais de 30 min para dormir ou menos de 6 h de sono. */
export function noiteDificil(r: RegistroSono): boolean {
  return r.qualidade <= 2 || r.demora === '30a60' || r.demora === 'mais60' || minutosDeSono(r) < 6 * 60
}

export const JANELA_AVALIACAO = 21
export const MINIMO_NOITES = 10
export const PAUSA_DEPOIS_DE_FECHAR = 30

/**
 * "Vale conversar com um profissional": nas últimas 3 semanas, com pelo menos 10 noites anotadas,
 * mais da metade foi difícil. Depois de fechado, o cartão só volta 30 dias depois.
 */
export function sugerirAvaliacao(registros: RegistroSono[], hoje: Dia, dispensadaEm?: Dia): boolean {
  if (dispensadaEm && diasEntre(dispensadaEm, hoje) < PAUSA_DEPOIS_DE_FECHAR) return false
  const inicio = somarDias(hoje, -JANELA_AVALIACAO)
  const recentes = registros.filter((r) => r.noite >= inicio && r.noite < hoje)
  if (recentes.length < MINIMO_NOITES) return false
  return recentes.filter(noiteDificil).length > recentes.length / 2
}

/** Médias das noites anotadas a partir de um dia. */
export function resumoSono(registros: RegistroSono[], desde: Dia) {
  const lista = registros.filter((r) => r.noite >= desde)
  if (!lista.length) return null
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  return {
    noites: lista.length,
    sonoMedioMin: Math.round(media(lista.map(minutosDeSono))),
    qualidadeMedia: Math.round(media(lista.map((r) => r.qualidade)) * 10) / 10,
    demoraramMais30: lista.filter((r) => r.demora === '30a60' || r.demora === 'mais60').length,
  }
}

/** A noite que a rotina de desacelerar está cuidando: de madrugada (antes das 5h) ainda é a noite anterior. */
export function noiteDaRotina(agora: Date, hoje: Dia): Dia {
  return agora.getHours() < 5 ? somarDias(hoje, -1) : hoje
}

/** Horário em que o aviso de desacelerar toca (deitar menos 30 min, atravessando a meia-noite). */
export function horaDeDesacelerar(deitarAs: string): string {
  const m = (minutos(deitarAs) - MINUTOS_DESACELERAR + 24 * 60) % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Está dentro dos 30 minutos depois do horário? (para o aviso tocar uma vez, mesmo se o app abrir um pouco depois) */
export function dentroDaJanela(hhmm: string, agora: Date): boolean {
  const passou = (agora.getHours() * 60 + agora.getMinutes() - minutos(hhmm) + 24 * 60) % (24 * 60)
  return passou <= 30
}
