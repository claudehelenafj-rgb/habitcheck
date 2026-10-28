// Banco de dados local do Caderninho (IndexedDB via Dexie).
// Tudo fica só no aparelho. Cada tabela nova entra numa versão nova do esquema,
// para quem já usa o app não perder nada ao atualizar.

import Dexie, { type EntityTable } from 'dexie'
import type { IdArea } from '../design/areas'
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
  }
}

export const banco = new BancoCaderninho()

export function novoId(): string {
  return crypto.randomUUID()
}
