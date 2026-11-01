// Leitura de arquivos .ics (Apple Calendar, Google Agenda e outros), sem biblioteca externa.
// Entende: eventos com hora (UTC, horário local ou com fuso TZID), eventos de dia inteiro,
// repetição simples (RRULE), exceções (EXDATE) e eventos cancelados.

export type OrigemEvento = 'apple' | 'google' | 'ics' | 'caderninho'

export type RegraRepeticao = {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  intervalo: number
  /** até quando (inclusive), como instante ISO */
  ate?: string
  vezes?: number
  /** dias da semana (0 = domingo), para WEEKLY */
  diasSemana?: number[]
}

export type EventoLido = {
  uid: string
  titulo: string
  /** instante de início (ISO, UTC). Para dia inteiro, meia-noite local do dia. */
  inicio: string
  fim: string
  diaInteiro: boolean
  local?: string
  descricao?: string
  repeticao?: RegraRepeticao
  /** inícios (ISO) que não acontecem */
  excecoes?: string[]
}

export type ResultadoIcs = { origem: OrigemEvento; nomeCalendario?: string; eventos: EventoLido[] }

/** Junta linhas dobradas (que começam com espaço ou tab) e separa em linhas. */
export function desdobrar(texto: string): string[] {
  return texto.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
}

type Propriedade = { nome: string; parametros: Record<string, string>; valor: string }

export function lerLinha(linha: string): Propriedade | null {
  // o valor começa no primeiro ":" que não está entre aspas
  let aspas = false
  let corte = -1
  for (let i = 0; i < linha.length; i++) {
    if (linha[i] === '"') aspas = !aspas
    if (linha[i] === ':' && !aspas) {
      corte = i
      break
    }
  }
  if (corte < 0) return null
  const [nome, ...params] = linha.slice(0, corte).split(';')
  const parametros: Record<string, string> = {}
  for (const p of params) {
    const [k, ...v] = p.split('=')
    parametros[k.toUpperCase()] = v.join('=').replace(/^"|"$/g, '')
  }
  return { nome: nome.toUpperCase(), parametros, valor: linha.slice(corte + 1) }
}

export function desescapar(v: string): string {
  return v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

/** Diferença (em minutos) entre o fuso e UTC naquele instante. */
function deslocamentoDoFuso(instanteUtc: number, fuso: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instanteUtc))
  const v = (t: string) => Number(partes.find((p) => p.type === t)!.value)
  const comoUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second'))
  return (comoUtc - instanteUtc) / 60_000
}

/** Converte data e hora "de parede" num fuso (ex.: America/Sao_Paulo) para o instante em UTC. */
export function deFusoParaUtc(a: number, m: number, d: number, h: number, min: number, s: number, fuso: string): number {
  const ingenuo = Date.UTC(a, m - 1, d, h, min, s)
  try {
    let instante = ingenuo - deslocamentoDoFuso(ingenuo, fuso) * 60_000
    instante = ingenuo - deslocamentoDoFuso(instante, fuso) * 60_000 // segunda passada acerta o horário de verão
    return instante
  } catch {
    return new Date(a, m - 1, d, h, min, s).getTime() // fuso desconhecido: usa o local
  }
}

export type DataLida = { instante: number; diaInteiro: boolean }

export function lerData(valor: string, parametros: Record<string, string>): DataLida | null {
  const v = valor.trim()
  const dia = /^(\d{4})(\d{2})(\d{2})$/.exec(v)
  if (dia || parametros.VALUE === 'DATE') {
    const [, a, m, d] = dia ?? /^(\d{4})(\d{2})(\d{2})/.exec(v) ?? []
    if (!a) return null
    return { instante: new Date(+a, +m - 1, +d).getTime(), diaInteiro: true }
  }
  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v)
  if (!dt) return null
  const [, a, m, d, h, min, s = '0', z] = dt
  if (z) return { instante: Date.UTC(+a, +m - 1, +d, +h, +min, +s), diaInteiro: false }
  if (parametros.TZID) return { instante: deFusoParaUtc(+a, +m, +d, +h, +min, +s, parametros.TZID), diaInteiro: false }
  return { instante: new Date(+a, +m - 1, +d, +h, +min, +s).getTime(), diaInteiro: false }
}

/** Duração ISO 8601 (ex.: PT1H30M, P1D) em milissegundos. */
export function lerDuracao(v: string): number {
  const r = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim())
  if (!r) return 0
  const [, sinal, sem = '0', d = '0', h = '0', m = '0', s = '0'] = r
  const ms = ((+sem * 7 + +d) * 86_400 + +h * 3600 + +m * 60 + +s) * 1000
  return sinal === '-' ? -ms : ms
}

const DIAS_RRULE: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

export function lerRRule(valor: string): RegraRepeticao | undefined {
  const partes = Object.fromEntries(valor.split(';').map((p) => p.split('=') as [string, string]))
  const freq = partes.FREQ as RegraRepeticao['freq']
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return undefined
  const regra: RegraRepeticao = { freq, intervalo: Math.max(1, Number(partes.INTERVAL) || 1) }
  if (partes.COUNT) regra.vezes = Number(partes.COUNT)
  if (partes.UNTIL) {
    const d = lerData(partes.UNTIL, {})
    if (d) regra.ate = new Date(d.diaInteiro ? d.instante + 86_399_000 : d.instante).toISOString()
  }
  if (partes.BYDAY && freq === 'WEEKLY') {
    regra.diasSemana = partes.BYDAY.split(',')
      .map((x) => DIAS_RRULE[x.replace(/^[+-]?\d+/, '')])
      .filter((x) => x !== undefined)
  }
  return regra
}

function origemDoProdid(prodid: string): OrigemEvento {
  if (/apple/i.test(prodid)) return 'apple'
  if (/google/i.test(prodid)) return 'google'
  return 'ics'
}

/** Lê um arquivo .ics inteiro. Eventos cancelados ficam de fora; alterações de uma ocorrência viram exceção + evento próprio. */
export function lerIcs(texto: string): ResultadoIcs {
  const linhas = desdobrar(texto)
  const eventos: EventoLido[] = []
  let origem: OrigemEvento = 'ics'
  let nomeCalendario: string | undefined
  let atual: Record<string, Propriedade[]> | null = null
  let profundidade = 0 // ignora VALARM e outros blocos dentro do evento

  for (const linha of linhas) {
    if (!linha.trim()) continue
    const p = lerLinha(linha)
    if (!p) continue
    if (p.nome === 'BEGIN' && p.valor.toUpperCase() === 'VEVENT') {
      atual = {}
      profundidade = 0
      continue
    }
    if (atual && p.nome === 'BEGIN') {
      profundidade++
      continue
    }
    if (atual && p.nome === 'END' && p.valor.toUpperCase() !== 'VEVENT') {
      profundidade--
      continue
    }
    if (atual && p.nome === 'END') {
      const ev = montarEvento(atual)
      if (ev) eventos.push(ev)
      atual = null
      continue
    }
    if (atual) {
      if (profundidade === 0) (atual[p.nome] ??= []).push(p)
    } else if (p.nome === 'PRODID') origem = origemDoProdid(p.valor)
    else if (p.nome === 'X-WR-CALNAME') nomeCalendario = desescapar(p.valor)
  }

  // alterações de uma ocorrência (RECURRENCE-ID): a original vira exceção
  const finais: EventoLido[] = []
  for (const ev of eventos) {
    const rid = (ev as EventoLido & { recorrenciaDe?: string }).recorrenciaDe
    if (rid) {
      const mestre = eventos.find((m) => m.uid === ev.uid && !(m as { recorrenciaDe?: string }).recorrenciaDe)
      if (mestre) mestre.excecoes = [...(mestre.excecoes ?? []), rid]
      finais.push({ ...ev, uid: `${ev.uid}|${rid}` })
    } else finais.push(ev)
  }
  for (const ev of finais) delete (ev as { recorrenciaDe?: string }).recorrenciaDe
  return { origem, nomeCalendario, eventos: finais }
}

function montarEvento(props: Record<string, Propriedade[]>): EventoLido | null {
  const um = (n: string) => props[n]?.[0]
  if (um('STATUS')?.valor.toUpperCase() === 'CANCELLED') return null
  const dtstart = um('DTSTART')
  if (!dtstart) return null
  const inicio = lerData(dtstart.valor, dtstart.parametros)
  if (!inicio) return null
  let fim: number
  const dtend = um('DTEND')
  const dur = um('DURATION')
  if (dtend && lerData(dtend.valor, dtend.parametros)) fim = lerData(dtend.valor, dtend.parametros)!.instante
  else if (dur) fim = inicio.instante + lerDuracao(dur.valor)
  else fim = inicio.instante + (inicio.diaInteiro ? 86_400_000 : 0)
  const uid = um('UID')?.valor ?? `sem-uid-${dtstart.valor}-${um('SUMMARY')?.valor ?? ''}`
  const excecoes = (props.EXDATE ?? []).flatMap((p) =>
    p.valor.split(',').map((v) => lerData(v, p.parametros)).filter(Boolean).map((d) => new Date(d!.instante).toISOString()),
  )
  const rid = um('RECURRENCE-ID')
  const ev: EventoLido & { recorrenciaDe?: string } = {
    uid,
    titulo: desescapar(um('SUMMARY')?.valor ?? '').trim() || '(sem título)',
    inicio: new Date(inicio.instante).toISOString(),
    fim: new Date(Math.max(fim, inicio.instante)).toISOString(),
    diaInteiro: inicio.diaInteiro,
  }
  const local = um('LOCATION')?.valor
  if (local) ev.local = desescapar(local)
  const descricao = um('DESCRIPTION')?.valor
  if (descricao) ev.descricao = desescapar(descricao)
  const rrule = um('RRULE')
  if (rrule) ev.repeticao = lerRRule(rrule.valor)
  if (excecoes.length) ev.excecoes = excecoes
  if (rid) {
    const d = lerData(rid.valor, rid.parametros)
    if (d) ev.recorrenciaDe = new Date(d.instante).toISOString()
  }
  return ev
}
