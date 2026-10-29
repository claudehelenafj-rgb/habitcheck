// Banco de dados local do Caderninho (IndexedDB via Dexie).
// Tudo fica só no aparelho. Cada tabela nova entra numa versão nova do esquema,
// para quem já usa o app não perder nada ao atualizar.

import Dexie, { type EntityTable } from 'dexie'
import type { IdArea } from '../design/areas'
import type { Evento } from '../logica/calendario'
import type { Checkin } from '../logica/checkin'
import type { Hobby, VezHobby } from '../logica/hobbies'
import type { RegistroSintoma } from '../logica/sintomas'
import type { RegistroSono } from '../logica/sono'
import type { RegistroSugestao } from '../logica/sugestoes'
import type { Consulta } from '../logica/consultas'
import type { RegistroDose, Remedio } from '../logica/remedios'

/** Item despejado na captura rápida, esperando virar tarefa, evento, hábito ou lixo. */
export type ItemCaixa = {
  id: string
  texto: string
  criadoEm: string // ISO
  destino?: 'tarefa' | 'evento' | 'habito' | 'feito' | 'lixo'
  resolvidoEm?: string
}

export type Passo = { id: string; texto: string; pronto?: string; feito: boolean }

export type Tarefa = {
  id: string
  titulo: string
  area?: IdArea
  prioridade: 'A' | 'B' | 'C'
  dia?: string // AAAA-MM-DD
  bloco?: 'manha' | 'tarde' | 'noite'
  passos: Passo[]
  estimativaMin?: number
  realMin?: number
  recompensa?: string
  objetivoId?: string
  feitaEm?: string // ISO
  /** dia local em que foi feita (o ISO acima é em UTC e pode cair no dia seguinte à noite) */
  feitaNoDia?: string
  criadaEm: string
}

export type Objetivo = {
  id: string
  titulo: string
  porque: string
  criadoEm: string
  arquivadoEm?: string
}

/** Configurações guardadas como chave → valor (preferências, idioma, primeiro uso...). */
export type Configuracao = { chave: string; valor: unknown }

export class BancoCaderninho extends Dexie {
  configuracoes!: EntityTable<Configuracao, 'chave'>
  caixaEntrada!: EntityTable<ItemCaixa, 'id'>
  tarefas!: EntityTable<Tarefa, 'id'>
  objetivos!: EntityTable<Objetivo, 'id'>
  remedios!: EntityTable<Remedio, 'id'>
  doses!: EntityTable<RegistroDose, 'id'>
  consultas!: EntityTable<Consulta, 'id'>
  eventos!: EntityTable<Evento, 'id'>
  checkins!: EntityTable<Checkin, 'id'>
  sintomas!: EntityTable<RegistroSintoma, 'id'>
  hobbies!: EntityTable<Hobby, 'id'>
  vezesHobby!: EntityTable<VezHobby, 'id'>
  sugestoes!: EntityTable<RegistroSugestao, 'id'>
  sonos!: EntityTable<RegistroSono, 'id'>

  constructor(nome = 'caderninho') {
    super(nome)
    this.version(1).stores({
      configuracoes: 'chave',
      caixaEntrada: 'id, criadoEm, resolvidoEm',
      tarefas: 'id, dia, prioridade, area, objetivoId, feitaEm',
      objetivos: 'id, criadoEm',
    })
    // etapa 6: remédios e registro de cada dose (tomei, pulei, adiei, quantos avisos)
    this.version(2).stores({
      remedios: 'id, ativo',
      doses: 'id, remedioId, dia',
    })
    // etapa 7: consultas ("preciso marcar", marcadas e feitas)
    this.version(3).stores({
      consultas: 'id, status, data',
    })
    // etapa 8: eventos do calendário (criados aqui ou importados da Apple e do Google)
    this.version(4).stores({
      eventos: 'id, uidExterno, inicio',
    })
    // Bem-estar (B2): check-ins de emoções. As tabelas do Bem-estar ficam em TABELAS_BEM_ESTAR,
    // para poder exportar ou apagar só elas.
    this.version(5).stores({
      checkins: 'id, dia, quando',
    })
    // Bem-estar (B3): sintomas com o porquê
    this.version(6).stores({
      sintomas: 'id, dia, quando',
    })
    // Bem-estar (B4): hobbies e cada vez que aconteceram
    this.version(7).stores({
      hobbies: 'id, arquivadoEm',
      vezesHobby: 'id, hobbyId, dia',
    })
    // Bem-estar (B5): sugestões escolhidas e a resposta de "ajudou?"
    this.version(8).stores({
      sugestoes: 'id, chave, dia',
    })
    // Bem-estar (B6): diário de sono, uma linha por noite
    this.version(9).stores({
      sonos: 'id, &noite',
    })
  }
}

/** Tabelas com dados de saúde mental (exportar e apagar separado na etapa B8). */
export const TABELAS_BEM_ESTAR = ['checkins', 'sintomas', 'hobbies', 'vezesHobby', 'sugestoes', 'sonos'] as const

export const banco = new BancoCaderninho()

export function novoId(): string {
  return crypto.randomUUID()
}
