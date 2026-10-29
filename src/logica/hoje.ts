// Regras da tela Hoje: blocos do dia, quanto falta e a escolha do cartão "Agora".

import type { Tarefa } from '../dados/banco'
import type { Ocorrencia } from './calendario'
import { pendenteHoje, type Habito, type RegistroHabito } from './habitos'
import { planoReverso, type Consulta } from './consultas'
import { estadoDose, textoDoLembrete, type DosePrevista, type RegistroDose } from './remedios'
import type { Dia } from './datas'
import { proximoPasso } from './tarefas'

export type Bloco = 'manha' | 'tarde' | 'noite'
export const BLOCOS: Bloco[] = ['manha', 'tarde', 'noite']

/** Hora em que cada bloco começa. A madrugada conta como o fim da noite. */
export const INICIO_BLOCO: Record<Bloco, number> = { manha: 5, tarde: 12, noite: 18 }

export function blocoDoHorario(data: Date): Bloco {
  const h = data.getHours()
  if (h >= INICIO_BLOCO.noite || h < INICIO_BLOCO.manha) return 'noite'
  if (h >= INICIO_BLOCO.tarde) return 'tarde'
  return 'manha'
}

/** Quando o bloco atual termina. */
export function fimDoBloco(agora: Date): Date {
  const fim = new Date(agora)
  fim.setMinutes(0, 0, 0)
  const bloco = blocoDoHorario(agora)
  if (bloco === 'manha') fim.setHours(INICIO_BLOCO.tarde)
  else if (bloco === 'tarde') fim.setHours(INICIO_BLOCO.noite)
  else {
    // a noite vai até as 5h; se já passou da meia-noite, é hoje mesmo
    if (agora.getHours() >= INICIO_BLOCO.noite) fim.setDate(fim.getDate() + 1)
    fim.setHours(INICIO_BLOCO.manha)
  }
  return fim
}

export function minutosAte(agora: Date, depois: Date): number {
  return Math.max(0, Math.ceil((depois.getTime() - agora.getTime()) / 60_000))
}

/** "3h 20min", "45min", "1h". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h && m) return `${h}h ${m}min`
  if (h) return `${h}h`
  return `${m}min`
}

/** Blocos que já passaram hoje (a noite nunca "passa" antes de virar o dia). */
export function blocoJaPassou(bloco: Bloco, atual: Bloco): boolean {
  return BLOCOS.indexOf(bloco) < BLOCOS.indexOf(atual)
}

// ---------- Cartão "Agora" ----------

/** Tudo o que pode aparecer no cartão "Agora". */
export type Candidato =
  | { tipo: 'remedio'; id: string; titulo: string; horario: Date; dose?: DosePrevista }
  | { tipo: 'transicao'; id: string; titulo: string; horario: Date; detalhe?: string }
  | { tipo: 'compromisso'; id: string; titulo: string; inicio: Date; fim?: Date; detalhe?: string; origem?: 'consulta' | 'evento' }
  | { tipo: 'tarefa'; id: string; titulo: string; tarefa: Tarefa }
  | { tipo: 'habito'; id: string; titulo: string; bloco?: Bloco; habito?: Habito }

/** Compromisso entra no "Agora" a partir de 15 minutos antes. */
export const ANTECEDENCIA_COMPROMISSO_MIN = 15

/**
 * Escolhe a única coisa do cartão "Agora", nesta ordem:
 * 1. remédio no horário ou atrasado; 2. alarme de transição ("começar a se arrumar");
 * 3. compromisso começando em até 15 min (ou em andamento); 4. tarefa A do bloco atual;
 * 5. tarefa A sem bloco; 6. tarefa A de um bloco que já passou; 7. hábito do bloco atual.
 * Nada disso: devolve undefined ("Tudo certo por agora").
 */
export function escolherAgora(candidatos: Candidato[], agora: Date): Candidato | undefined {
  const bloco = blocoDoHorario(agora)
  const t = agora.getTime()
  const maisCedo = <T extends { horario: Date }>(a: T, b: T) => a.horario.getTime() - b.horario.getTime()

  const remedios = candidatos
    .filter((c): c is Extract<Candidato, { tipo: 'remedio' }> => c.tipo === 'remedio' && c.horario.getTime() <= t)
    .sort(maisCedo)
  if (remedios[0]) return remedios[0]

  const transicoes = candidatos
    .filter((c): c is Extract<Candidato, { tipo: 'transicao' }> => c.tipo === 'transicao' && c.horario.getTime() <= t)
    .sort(maisCedo)
  if (transicoes.at(-1)) return transicoes.at(-1)

  const compromissos = candidatos
    .filter(
      (c): c is Extract<Candidato, { tipo: 'compromisso' }> =>
        c.tipo === 'compromisso' &&
        c.inicio.getTime() - ANTECEDENCIA_COMPROMISSO_MIN * 60_000 <= t &&
        (c.fim ? c.fim.getTime() > t : c.inicio.getTime() > t - 60 * 60_000),
    )
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
  if (compromissos[0]) return compromissos[0]

  const tarefas = candidatos
    .filter((c): c is Extract<Candidato, { tipo: 'tarefa' }> => c.tipo === 'tarefa' && c.tarefa.prioridade === 'A' && !c.tarefa.feitaEm)
    .sort((a, b) => a.tarefa.criadaEm.localeCompare(b.tarefa.criadaEm))
  const doBloco = tarefas.find((c) => c.tarefa.bloco === bloco)
  if (doBloco) return doBloco
  const semBloco = tarefas.find((c) => !c.tarefa.bloco)
  if (semBloco) return semBloco
  const atrasada = tarefas.find((c) => c.tarefa.bloco && blocoJaPassou(c.tarefa.bloco, bloco))
  if (atrasada) return atrasada

  return candidatos.find((c) => c.tipo === 'habito' && (!c.bloco || c.bloco === bloco))
}

/** Tarefas que viram candidatas ao "Agora": as A de hoje ainda abertas. */
export function candidatosDeTarefas(tarefas: Tarefa[], hoje: Dia): Candidato[] {
  return tarefas
    .filter((t) => t.prioridade === 'A' && t.dia === hoje && !t.feitaEm)
    .map((tarefa) => ({ tipo: 'tarefa', id: tarefa.id, titulo: proximoPasso(tarefa)?.texto ?? tarefa.titulo, tarefa }))
}

/** Hábitos ainda pendentes hoje viram candidatos ao "Agora" (no bloco deles, ou a qualquer hora). */
export function candidatosDeHabitos(habitos: Habito[], registros: RegistroHabito[], hoje: Dia): Candidato[] {
  return habitos
    .filter((h) => pendenteHoje(h, registros.filter((r) => r.habitoId === h.id), hoje))
    .map((h) => ({ tipo: 'habito', id: h.id, titulo: h.titulo, bloco: h.bloco, habito: h }))
}

/** Hábitos que aparecem na linha do dia: os pendentes hoje e os que já foram feitos hoje. */
export function habitosDoDia(habitos: Habito[], registros: RegistroHabito[], hoje: Dia): Array<{ habito: Habito; registro?: RegistroHabito }> {
  return habitos
    .filter((h) => !h.arquivadoEm)
    .map((h) => ({ habito: h, registro: registros.find((r) => r.habitoId === h.id && r.dia === hoje) }))
    .filter(({ habito, registro }) => registro || pendenteHoje(habito, registros.filter((r) => r.habitoId === habito.id), hoje))
}

/** Tarefas de hoje que aparecem na linha do dia: A marcadas para hoje e tudo o que foi feito hoje. */
export function tarefasDoDia(tarefas: Tarefa[], hoje: Dia): Tarefa[] {
  return tarefas.filter((t) => (t.prioridade === 'A' && t.dia === hoje) || t.feitaNoDia === hoje)
}

/** Doses na hora (ou atrasadas) e ainda sem resposta viram candidatas ao "Agora". */
export function candidatosDeRemedios(doses: DosePrevista[], registros: RegistroDose[], agora: Date): Candidato[] {
  return doses
    .filter((d) => estadoDose(d, registros.find((r) => r.id === d.id), agora) === 'agora')
    .map((dose) => ({ tipo: 'remedio', id: dose.id, titulo: textoDoLembrete(dose.remedio), horario: dose.quando, dose }))
}

export type TextosTransicao = { arrumar: (titulo: string) => string; sair: (titulo: string) => string }

/**
 * Consultas marcadas viram, no "Agora": "começar a se arrumar" (a partir do horário calculado),
 * "sair de casa" e, 15 minutos antes, a própria consulta (até ela acabar).
 */
export function candidatosDeConsultas(consultas: Consulta[], agora: Date, textos: TextosTransicao): Candidato[] {
  const lista: Candidato[] = []
  for (const c of consultas) {
    if (c.status !== 'marcada') continue
    const plano = planoReverso(c)
    if (!plano || plano.fim <= agora) continue
    const detalhe = [c.hora, c.local].filter(Boolean).join(' · ')
    if (agora < plano.inicio) {
      lista.push({ tipo: 'transicao', id: `${c.id}|arrumar`, titulo: textos.arrumar(c.titulo), horario: plano.comecarArrumar, detalhe })
      lista.push({ tipo: 'transicao', id: `${c.id}|sair`, titulo: textos.sair(c.titulo), horario: plano.sairDeCasa, detalhe })
    }
    lista.push({ tipo: 'compromisso', id: c.id, titulo: c.titulo, inicio: plano.inicio, fim: plano.fim, detalhe, origem: 'consulta' })
  }
  return lista
}

/** Eventos com horário viram compromisso no "Agora" (15 minutos antes até acabar). Dia todo não entra. */
export function candidatosDeEventos(lista: Ocorrencia[], agora: Date): Candidato[] {
  return lista
    .filter((o) => !o.evento.diaInteiro && o.fim > agora)
    .map((o) => ({
      tipo: 'compromisso',
      id: `${o.evento.id}|${o.inicio.toISOString()}`,
      titulo: o.evento.titulo,
      inicio: o.inicio,
      fim: o.fim,
      detalhe: [o.inicio.toTimeString().slice(0, 5), o.evento.local].filter(Boolean).join(' · '),
      origem: 'evento',
    }))
}
