// Quarto (guia: "um lugar para cada coisa", começar pequeno, tempo visível). Em vez de "arrumar o quarto"
// inteiro, um reset de 10 minutos numa zona só (mesa, cama, chão, roupas), com a lista do que fazer nela.
// Parar quando o tempo acaba já conta.

import type { NomeAdesivo } from '../componentes/Adesivo'
import { diasEntre, type Dia } from './datas'

export type Zona = { id: string; nome: string; adesivo: NomeAdesivo; itens: string[]; ordem: number }

/** Um reset feito (guardado no fim). */
export type ResetQuarto = {
  id: string
  zonaId: string
  /** nome da zona no dia (se a zona mudar de nome ou for apagada, o registro continua legível) */
  zonaNome: string
  dia: Dia
  inicio: string // ISO
  fim: string // ISO
  minutos: number
  feitos: string[]
  total: number
  fotoAntes?: string
  fotoDepois?: string
}

/** O reset em andamento (fica guardado para continuar certo depois de recarregar). */
export type EstadoReset = {
  zonaId: string
  inicio: string // ISO
  minutos: number
  feitos: string[]
  /** "mais 5 min" já pedidos */
  extras: number
  fase: 'correndo' | 'fim'
  fimEm?: string
  fotoAntes?: string
  /** início que já ganhou o aviso de "acabou o tempo" */
  avisadoEm?: string
}

export const DURACOES_RESET = [5, 10, 15] as const
export const EXTRA_RESET_MIN = 5
export const MAX_EXTRAS_RESET = 2

/** Zonas que já vêm prontas (os nomes e os itens vêm das traduções). */
export const MODELOS_ZONAS: Array<{ chave: string; adesivo: NomeAdesivo }> = [
  { chave: 'mesa', adesivo: 'livro' },
  { chave: 'cama', adesivo: 'lua' },
  { chave: 'chao', adesivo: 'vassoura' },
  { chave: 'roupas', adesivo: 'novelo' },
]

export function ultimoReset(resets: ResetQuarto[], zonaId: string): ResetQuarto | undefined {
  return resets.filter((r) => r.zonaId === zonaId).reduce<ResetQuarto | undefined>((ult, r) => (!ult || r.fim > ult.fim ? r : ult), undefined)
}

/** Dias desde o último reset da zona (null = nunca). */
export function diasSemReset(resets: ResetQuarto[], zonaId: string, hoje: Dia): number | null {
  const ult = ultimoReset(resets, zonaId)
  return ult ? diasEntre(ult.dia, hoje) : null
}

/** Sugestão de zona: a que nunca teve reset (na ordem) ou a que está há mais tempo sem. */
export function zonaSugerida(zonas: Zona[], resets: ResetQuarto[], hoje: Dia): Zona | undefined {
  const ordenadas = [...zonas].sort((a, b) => a.ordem - b.ordem)
  const nunca = ordenadas.find((z) => diasSemReset(resets, z.id, hoje) === null)
  if (nunca) return nunca
  return ordenadas.reduce<Zona | undefined>((melhor, z) => {
    if (!melhor) return z
    return diasSemReset(resets, z.id, hoje)! > diasSemReset(resets, melhor.id, hoje)! ? z : melhor
  }, undefined)
}

const minutosDesde = (inicio: string, agora: Date) => (agora.getTime() - new Date(inicio).getTime()) / 60_000

/** Quanto falta, em segundos (0 quando acabou ou terminou). */
export function segundosDoReset(e: EstadoReset, agora: Date): number {
  if (e.fase === 'fim') return 0
  const restante = Math.round((e.minutos - minutosDesde(e.inicio, agora)) * 60)
  return Math.min(e.minutos * 60, Math.max(0, restante))
}

/** Minutos de reset de verdade: do início até terminar, sem passar do combinado. */
export function minutosDoReset(e: EstadoReset, agora: Date): number {
  const fim = e.fimEm ? new Date(e.fimEm) : agora
  return Math.round(Math.min(e.minutos, Math.max(0, minutosDesde(e.inicio, fim))))
}

/** Mais 5 minutos a partir de agora (o tempo que passou depois do alarme também conta). */
export function maisCincoMinutos(e: EstadoReset, agora: Date): EstadoReset {
  if (e.fase !== 'correndo' || e.extras >= MAX_EXTRAS_RESET) return e
  const passou = Math.max(e.minutos, minutosDesde(e.inicio, agora))
  return { ...e, minutos: Math.round((passou + EXTRA_RESET_MIN) * 60) / 60, extras: e.extras + 1 }
}

export function terminarReset(e: EstadoReset, agora: Date): EstadoReset {
  if (e.fase === 'fim') return e
  // terminar depois do tempo acabar conta só até o fim do tempo
  const fimDoTempo = new Date(new Date(e.inicio).getTime() + e.minutos * 60_000)
  return { ...e, fase: 'fim', fimEm: (agora < fimDoTempo ? agora : fimDoTempo).toISOString() }
}

export function alternarItem(e: EstadoReset, item: string): EstadoReset {
  return { ...e, feitos: e.feitos.includes(item) ? e.feitos.filter((x) => x !== item) : [...e.feitos, item] }
}

/** Para a grade da semana: dia com reset, dia sem (contorno vazio, nunca erro) e dia que ainda não chegou. */
export function estadoDiaReset(resets: ResetQuarto[], dia: Dia, hoje: Dia): 'feito' | 'vazio' | 'futuro' {
  if (resets.some((r) => r.dia === dia)) return 'feito'
  return dia > hoje ? 'futuro' : 'vazio'
}

/** "Um lugar para cada coisa": onde fica cada objeto que costuma sumir. */
export type Lugar = { id: string; coisa: string; onde: string; criadoEm: string }

/** Foto de antes ou depois, reduzida e guardada só no aparelho (como texto, para entrar no backup). */
export type Foto = { id: string; dataUrl: string; criadaEm: string }
