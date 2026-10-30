// Consultas: "preciso marcar" com repetição, planejamento de trás para frente
// (começar a se arrumar, sair de casa, com folga) e arquivo .ics para o calendário.

import { diasEntre, diaLocal, type Dia } from './datas'
import { momento } from './remedios'

export type ItemPreparo = { id: string; texto: string; feito: boolean }

export type Consulta = {
  id: string
  titulo: string
  profissional?: string
  local?: string
  status: 'marcar' | 'marcada' | 'feita'
  /** repetir a cada N meses (ex.: dentista a cada 6) */
  recorrenciaMeses?: number
  /** até quando marcar (para "preciso marcar") */
  marcarAte?: Dia
  data?: Dia
  hora?: string
  duracaoMin: number
  deslocamentoMin: number
  preparoMin: number
  /** folga extra sobre deslocamento e preparo, em % (o guia sugere 25 a 50) */
  folgaPct: number
  preparo: ItemPreparo[]
  perguntas?: string
  criadaEm: string
  feitaEm?: string
}

// ---------- Planejamento de trás para frente ----------

export type PlanoReverso = { comecarArrumar: Date; sairDeCasa: Date; inicio: Date; fim: Date }

function arredondarPara5Antes(d: Date): Date {
  const r = new Date(d)
  r.setSeconds(0, 0)
  r.setMinutes(Math.floor(r.getMinutes() / 5) * 5)
  return r
}

/** Do horário da consulta para trás: sair de casa = deslocamento + folga; arrumar = preparo + folga antes de sair. */
export function planoReverso(c: Pick<Consulta, 'data' | 'hora' | 'duracaoMin' | 'deslocamentoMin' | 'preparoMin' | 'folgaPct'>): PlanoReverso | null {
  if (!c.data || !c.hora) return null
  const inicio = momento(c.data, c.hora)
  const fator = 1 + c.folgaPct / 100
  const sairDeCasa = arredondarPara5Antes(new Date(inicio.getTime() - Math.ceil(c.deslocamentoMin * fator) * 60_000))
  const comecarArrumar = arredondarPara5Antes(new Date(sairDeCasa.getTime() - Math.ceil(c.preparoMin * fator) * 60_000))
  const fim = new Date(inicio.getTime() + c.duracaoMin * 60_000)
  return { comecarArrumar, sairDeCasa, inicio, fim }
}

// ---------- Repetição e "preciso marcar" ----------

/** Soma meses a um dia; se o dia não existe no mês final (31 → fevereiro), usa o último dia do mês. */
export function somarMeses(dia: Dia, meses: number): Dia {
  const [a, m, d] = dia.split('-').map(Number)
  const alvo = new Date(a, m - 1 + meses, 1)
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(d, ultimo))
  return diaLocal(alvo)
}

export type SituacaoMarcar = 'sem-prazo' | 'hora-de-marcar' | 'em-breve' | 'tranquilo'

/** "Já está na hora de marcar" (prazo chegou ou passou), "em breve" (até 30 dias) ou "tranquilo". */
export function situacaoMarcar(marcarAte: Dia | undefined, hoje: Dia): SituacaoMarcar {
  if (!marcarAte) return 'sem-prazo'
  const faltam = diasEntre(hoje, marcarAte)
  if (faltam <= 0) return 'hora-de-marcar'
  if (faltam <= 30) return 'em-breve'
  return 'tranquilo'
}

/** Ao marcar como feita: se repete, nasce o próximo "preciso marcar" com prazo daqui a N meses. */
export function proximaDaRepeticao(c: Consulta, feitaNoDia: Dia, novoId: string, agoraIso: string): Consulta | null {
  if (!c.recorrenciaMeses) return null
  return {
    ...c,
    id: novoId,
    status: 'marcar',
    marcarAte: somarMeses(c.data ?? feitaNoDia, c.recorrenciaMeses),
    data: undefined,
    hora: undefined,
    preparo: c.preparo.map((p) => ({ ...p, feito: false })),
    criadaEm: agoraIso,
    feitaEm: undefined,
  }
}

export function preparoPadrao(gerarId: () => string, textos: string[]): ItemPreparo[] {
  return textos.map((texto) => ({ id: gerarId(), texto, feito: false }))
}

// ---------- Arquivo .ics ----------

function dataIcs(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapar(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Quebra linhas longas (limite de 75 bytes do padrão iCalendar). */
function dobrar(linha: string): string {
  const bytes = new TextEncoder().encode(linha)
  if (bytes.length <= 75) return linha
  const partes: string[] = []
  let atual = ''
  for (const ch of linha) {
    const limite = partes.length ? 74 : 75
    if (new TextEncoder().encode(atual + ch).length > limite) {
      partes.push(atual)
      atual = ch
    } else atual += ch
  }
  partes.push(atual)
  return partes.join('\r\n ')
}

export type TextosIcs = { arrumar: string; sair: string }

/** Evento com dois alarmes: "começar a se arrumar" e "sair de casa". Funciona no Apple Calendar e no Google Agenda. */
export function gerarIcs(c: Consulta, textos: TextosIcs, agora = new Date()): string | null {
  const plano = planoReverso(c)
  if (!plano) return null
  const minAntes = (d: Date) => Math.round((plano.inicio.getTime() - d.getTime()) / 60_000)
  const descricao = [
    c.profissional,
    c.preparo.length ? c.preparo.map((p) => `☐ ${p.texto}`).join('\n') : '',
    c.perguntas ? `\n${c.perguntas}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const alarme = (min: number, texto: string) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(texto)}`, `TRIGGER:-PT${min}M`, 'END:VALARM']
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Caderninho//Consultas//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${c.id}@caderninho`,
    `DTSTAMP:${dataIcs(agora)}`,
    `DTSTART:${dataIcs(plano.inicio)}`,
    `DTEND:${dataIcs(plano.fim)}`,
    `SUMMARY:${escapar(c.titulo)}`,
    ...(c.local ? [`LOCATION:${escapar(c.local)}`] : []),
    ...(descricao ? [`DESCRIPTION:${escapar(descricao)}`] : []),
    ...alarme(minAntes(plano.comecarArrumar), textos.arrumar),
    ...alarme(minAntes(plano.sairDeCasa), textos.sair),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return linhas.map(dobrar).join('\r\n') + '\r\n'
}

export function nomeArquivoIcs(c: Consulta): string {
  const base = c.titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `${base || 'consulta'}-${c.data ?? ''}.ics`
}
