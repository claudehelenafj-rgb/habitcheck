// Banco de dados local do Caderninho (IndexedDB via Dexie).
// Tudo fica só no aparelho. Cada tabela nova entra numa versão nova do esquema,
// para quem já usa o app não perder nada ao atualizar.

import Dexie, { type EntityTable } from 'dexie'
import type { IdArea } from '../design/areas'
import type { Evento } from '../logica/calendario'
import type { Checkin } from '../logica/checkin'
import type { Avaliacao } from '../logica/faculdade'
import type { SessaoFoco } from '../logica/foco'
import type { Habito, RegistroHabito } from '../logica/habitos'
import type { Foto, Lugar, ResetQuarto, Zona } from '../logica/quarto'
import type { Comida, DiaAlimentacao, ItemCompra } from '../logica/alimentacao'
import type { Cofrinho, Conta, Deposito, Desejo, Gasto, Pote } from '../logica/dinheiro'
import type { Hobby, VezHobby } from '../logica/hobbies'
import type { RegistroRitual } from '../logica/rituais'
import type { NotaRemedio } from '../logica/remedioNoPlano'
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
  /** sessão de estudo gerada pelo planejamento de uma prova */
  avaliacaoId?: string
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

/** Arquivo guardado no aparelho (ex.: o PDF do plano alimentar), como data URL para entrar no backup. */
export type Arquivo = { id: string; nome: string; tipo: string; tamanho: number; dados: string; salvoEm: string }

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
  notasRemedio!: EntityTable<NotaRemedio, 'id'>
  avaliacoes!: EntityTable<Avaliacao, 'id'>
  sessoesFoco!: EntityTable<SessaoFoco, 'id'>
  habitos!: EntityTable<Habito, 'id'>
  registrosHabito!: EntityTable<RegistroHabito, 'id'>
  zonas!: EntityTable<Zona, 'id'>
  resets!: EntityTable<ResetQuarto, 'id'>
  lugares!: EntityTable<Lugar, 'id'>
  fotos!: EntityTable<Foto, 'id'>
  diasAlimentacao!: EntityTable<DiaAlimentacao, 'dia'>
  comidas!: EntityTable<Comida, 'id'>
  compras!: EntityTable<ItemCompra, 'id'>
  contas!: EntityTable<Conta, 'id'>
  potes!: EntityTable<Pote, 'id'>
  gastos!: EntityTable<Gasto, 'id'>
  desejos!: EntityTable<Desejo, 'id'>
  cofrinhos!: EntityTable<Cofrinho, 'id'>
  depositos!: EntityTable<Deposito, 'id'>
  rituais!: EntityTable<RegistroRitual, 'id'>
  arquivos!: EntityTable<Arquivo, 'id'>

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
    // Bem-estar (B7): "como estou com o remédio"
    this.version(10).stores({
      notasRemedio: 'id, dia, remedioId',
    })
    // etapa 9: provas e entregas da faculdade, sessões de foco e o vínculo da tarefa com a prova
    this.version(11).stores({
      tarefas: 'id, dia, prioridade, area, objetivoId, feitaEm, avaliacaoId',
      avaliacoes: 'id, data, materia',
      sessoesFoco: 'id, dia, tarefaId',
    })
    // etapa 10: hábitos (academia) e um registro por hábito e por dia
    this.version(12).stores({
      habitos: 'id, area, arquivadoEm',
      registrosHabito: 'id, habitoId, dia',
    })
    // etapa 11: quarto (zonas, resets de 10 minutos, um lugar para cada coisa, fotos de antes e depois)
    this.version(13).stores({
      zonas: 'id, ordem',
      resets: 'id, zonaId, dia',
      lugares: 'id',
      fotos: 'id',
    })
    // etapa 12: alimentação (um registro por dia: refeições e copos de água), comidas fáceis e lista de compras
    this.version(14).stores({
      diasAlimentacao: 'dia',
      comidas: 'id',
      compras: 'id, compradoEm',
    })
    // etapa 13: contas a pagar (com os pagamentos de cada mês)
    this.version(15).stores({
      contas: 'id',
    })
    // etapa 13: potes da semana e gastos, lista de desejos (pausa de 48 h), cofrinhos e o que foi guardado
    this.version(16).stores({
      potes: 'id, ordem',
      gastos: 'id, dia, poteId',
      desejos: 'id, criadoEm',
      cofrinhos: 'id',
      depositos: 'id, cofrinhoId, dia',
    })
    // etapa 14: rituais da manhã e da noite (um por dia: em que passo parou e quando terminou)
    this.version(17).stores({
      rituais: 'id, dia, ritual',
    })
    // plano alimentar: o PDF da pessoa, guardado só no aparelho
    this.version(18).stores({
      arquivos: 'id',
    })
  }
}

/** Tabelas com dados de saúde mental (exportar e apagar separado na etapa B8). */
export const TABELAS_BEM_ESTAR = ['checkins', 'sintomas', 'hobbies', 'vezesHobby', 'sugestoes', 'sonos', 'notasRemedio'] as const

export const banco = new BancoCaderninho()

export function novoId(): string {
  return crypto.randomUUID()
}
