// Regras dos remédios e dos lembretes (estratégia 6 do guia: lembrete com a ação escrita).
// O app não sugere doses nem dá orientação médica: só lembra do que a pessoa cadastrou.

import { diasEntre, somarDias, type Dia } from './datas'

export type Remedio = {
  id: string
  nome: string
  /** horários no formato 'HH:MM' */
  horarios: string[]
  /** dias da semana (0 = domingo). Vazio ou ausente = todos os dias */
  diasSemana?: number[]
  observacao?: string
  /** texto do lembrete; padrão: "Tomar {nome} e marcar no app" */
  acao?: string
  estoque?: { quantidade: number; porDose: number; avisarComDias: number }
  /** repetições gentis se não houver resposta */
  repetir: { vezes: number; intervaloMin: number }
  ativo: boolean
  criadoEm: string
  /** janela em que a pessoa percebe mais efeito (opcional), para encaixar as tarefas A */
  efeito?: { de: string; ate: string }
}

export type StatusDose = 'tomei' | 'pulei' | 'adiada'

export type RegistroDose = {
  /** `${remedioId}|${dia}|${horario}` */
  id: string
  remedioId: string
  dia: Dia
  horario: string
  status?: StatusDose
  respondidaEm?: string
  adiadaAte?: string
  /** quantos avisos já foram mostrados para esta dose */
  avisos: number
  /** quantos avisos já tinham sido mostrados quando a pessoa adiou (as repetições recomeçam depois) */
  avisosAntesDeAdiar?: number
}

export type DosePrevista = { id: string; remedio: Remedio; dia: Dia; horario: string; quando: Date }

export const ADIAR_MIN = 10

export function idDose(remedioId: string, dia: Dia, horario: string): string {
  return `${remedioId}|${dia}|${horario}`
}

/** Data e hora local de um dia + 'HH:MM'. */
export function momento(dia: Dia, horario: string): Date {
  const [a, m, d] = dia.split('-').map(Number)
  const [h, min] = horario.split(':').map(Number)
  return new Date(a, m - 1, d, h, min)
}

function diaDaSemana(dia: Dia): number {
  return momento(dia, '12:00').getDay()
}

export function tomaNoDia(remedio: Remedio, dia: Dia): boolean {
  return remedio.ativo && (!remedio.diasSemana?.length || remedio.diasSemana.includes(diaDaSemana(dia)))
}

export function dosesDoDia(remedios: Remedio[], dia: Dia): DosePrevista[] {
  return remedios
    .filter((r) => tomaNoDia(r, dia))
    .flatMap((remedio) =>
      [...new Set(remedio.horarios)].map((horario) => ({
        id: idDose(remedio.id, dia, horario),
        remedio,
        dia,
        horario,
        quando: momento(dia, horario),
      })),
    )
    .sort((a, b) => a.quando.getTime() - b.quando.getTime() || a.remedio.nome.localeCompare(b.remedio.nome))
}

export function textoDoLembrete(remedio: Remedio): string {
  return remedio.acao?.trim() || `Tomar ${remedio.nome} e marcar no app`
}

export type EstadoDose = 'tomei' | 'pulei' | 'adiada' | 'agora' | 'depois'

/** Estado da dose agora. "agora" = na hora ou atrasada e ainda sem resposta. */
export function estadoDose(dose: DosePrevista, registro: RegistroDose | undefined, agora: Date): EstadoDose {
  if (registro?.status === 'tomei' || registro?.status === 'pulei') return registro.status
  if (registro?.status === 'adiada' && registro.adiadaAte && new Date(registro.adiadaAte) > agora) return 'adiada'
  return dose.quando <= agora ? 'agora' : 'depois'
}

// ---------- Horário de silêncio ----------

export type Silencio = { ativo: boolean; inicio: string; fim: string }

function minutosDoDia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes()
}
function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Está dentro do horário de silêncio? Funciona também quando atravessa a meia-noite (22:00 → 07:00). */
export function emSilencio(agora: Date, silencio: Silencio | undefined): boolean {
  if (!silencio?.ativo) return false
  const m = minutosDoDia(agora)
  const ini = paraMinutos(silencio.inicio)
  const fim = paraMinutos(silencio.fim)
  if (ini === fim) return false
  return ini < fim ? m >= ini && m < fim : m >= ini || m < fim
}

// ---------- Quando avisar ----------

/**
 * Próximo momento de avisar sobre esta dose, ou null se não precisa mais.
 * Aviso 1 = no horário (ou quando o adiamento acaba). Depois, repete `vezes` vezes a cada `intervaloMin`.
 * O silêncio não cala o primeiro aviso (o horário foi a pessoa que escolheu), só as repetições.
 */
export function proximoAviso(dose: DosePrevista, registro: RegistroDose | undefined, silencio?: Silencio): Date | null {
  if (registro?.status === 'tomei' || registro?.status === 'pulei') return null
  const base = registro?.status === 'adiada' && registro.adiadaAte ? new Date(registro.adiadaAte) : dose.quando
  const avisosDesdeBase = registro?.status === 'adiada' ? Math.max(0, registro.avisos - (registro.avisosAntesDeAdiar ?? 0)) : (registro?.avisos ?? 0)
  const { vezes, intervaloMin } = dose.remedio.repetir
  if (avisosDesdeBase > vezes) return null
  const quando = new Date(base.getTime() + avisosDesdeBase * intervaloMin * 60_000)
  if (avisosDesdeBase > 0 && emSilencio(quando, silencio)) return null
  return quando
}

/** Deve mostrar um aviso agora? Não acorda avisos de mais de 3 horas atrás (ex.: abriu o app à noite). */
export function deveAvisar(dose: DosePrevista, registro: RegistroDose | undefined, agora: Date, silencio?: Silencio): boolean {
  const quando = proximoAviso(dose, registro, silencio)
  return !!quando && quando <= agora && agora.getTime() - quando.getTime() < 3 * 3_600_000
}

// ---------- Semana e estoque ----------

export type EstadoDiaSemana = 'feito' | 'minimo' | 'vazio' | 'futuro'

/** Para a grade da semana: tomou tudo, parte, nada (neutro) ou ainda não chegou. */
export function estadoDoDia(remedio: Remedio, dia: Dia, registros: RegistroDose[], hoje: Dia): EstadoDiaSemana | 'nao-toma' {
  if (!tomaNoDia(remedio, dia)) return 'nao-toma'
  if (diasEntre(hoje, dia) > 0) return 'futuro'
  const horarios = [...new Set(remedio.horarios)]
  const tomadas = horarios.filter((h) => registros.find((r) => r.id === idDose(remedio.id, dia, h))?.status === 'tomei').length
  if (tomadas === horarios.length && horarios.length > 0) return 'feito'
  if (tomadas > 0) return 'minimo'
  return 'vazio'
}

/** Segunda a domingo da semana que contém `dia`. */
export function diasDaSemana(dia: Dia): Dia[] {
  const semana = diaDaSemana(dia)
  const segunda = somarDias(dia, -((semana + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i))
}

export function dosesPorDia(remedio: Remedio): number {
  const porSemana = (remedio.diasSemana?.length || 7) * new Set(remedio.horarios).size
  return porSemana / 7
}

/** Quantos dias o estoque ainda dura (null se não controla estoque). */
export function diasDeEstoque(remedio: Remedio): number | null {
  if (!remedio.estoque || remedio.estoque.porDose <= 0) return null
  const porDia = dosesPorDia(remedio) * remedio.estoque.porDose
  if (porDia <= 0) return null
  return Math.floor(remedio.estoque.quantidade / porDia)
}

export function precisaComprar(remedio: Remedio): boolean {
  const dias = diasDeEstoque(remedio)
  return dias !== null && dias <= remedio.estoque!.avisarComDias
}

/** Doses que receberam aviso e ficaram sem resposta (para a revisão semanal). */
export function avisosIgnorados(registros: RegistroDose[]): number {
  return registros.filter((r) => r.avisos > 0 && !r.status).length
}

