// Provas, entregas e sessões de estudo no banco local, e a configuração da Faculdade (matérias e
// estudo acompanhado), guardada na tabela configuracoes, chave "faculdade".

import { useLiveQuery } from 'dexie-react-hooks'
import type { Avaliacao, Combinado, TipoAvaliacao } from '../logica/faculdade'
import { banco, novoId, type Tarefa } from './banco'

export type { Combinado }

export type ConfigFaculdade = { materias: string[]; acompanhado: Combinado[] }
const VAZIA: ConfigFaculdade = { materias: [], acompanhado: [] }
const CHAVE = 'faculdade'

async function lerConfig(): Promise<ConfigFaculdade> {
  return { ...VAZIA, ...((await banco.configuracoes.get(CHAVE))?.valor as ConfigFaculdade | undefined) }
}

export function useConfigFaculdade(): ConfigFaculdade | undefined {
  return useLiveQuery(lerConfig, [])
}

/** Muda a partir do que está guardado agora, numa transação (mudanças rápidas não se apagam). */
export async function mudarConfigFaculdade(mudar: (atual: ConfigFaculdade) => Partial<ConfigFaculdade>) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerConfig()
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ...mudar(atual) } })
  })
}

export function useAvaliacoes(): Avaliacao[] | undefined {
  return useLiveQuery(() => banco.avaliacoes.orderBy('data').toArray(), [])
}

export type NovaAvaliacao = { materia: string; tipo: TipoAvaliacao; titulo: string; data: string; hora?: string }

/** Cadastra várias de uma vez (a "configuração do semestre"). Linhas sem matéria ou sem data ficam de fora. */
export async function salvarAvaliacoes(lista: NovaAvaliacao[], agora = new Date()): Promise<Avaliacao[]> {
  const validas: Avaliacao[] = lista
    .filter((a) => a.materia.trim() && a.data)
    .map((a) => ({
      id: novoId(),
      materia: a.materia.trim(),
      tipo: a.tipo,
      titulo: a.titulo.trim() || (a.tipo === 'prova' ? 'Prova' : 'Entrega'),
      data: a.data,
      ...(a.hora ? { hora: a.hora } : {}),
      criadaEm: agora.toISOString(),
    }))
  await banco.avaliacoes.bulkAdd(validas)
  // as matérias novas entram na lista da configuração
  const novas = [...new Set(validas.map((a) => a.materia))]
  await mudarConfigFaculdade((c) => ({ materias: [...c.materias, ...novas.filter((m) => !c.materias.includes(m))] }))
  return validas
}

export async function atualizarAvaliacao(id: string, mudanca: Partial<Omit<Avaliacao, 'id'>>) {
  await banco.avaliacoes.update(id, mudanca)
}

/** Apaga a prova e as sessões ainda não feitas dela. Devolve tudo, para o "Desfazer". */
export async function apagarAvaliacao(id: string): Promise<{ avaliacao?: Avaliacao; sessoes: Tarefa[] }> {
  return banco.transaction('rw', banco.avaliacoes, banco.tarefas, async () => {
    const avaliacao = await banco.avaliacoes.get(id)
    const sessoes = await banco.tarefas.where('avaliacaoId').equals(id).filter((t) => !t.feitaEm).toArray()
    await banco.avaliacoes.delete(id)
    await banco.tarefas.bulkDelete(sessoes.map((t) => t.id))
    return { avaliacao, sessoes }
  })
}

export async function restaurarAvaliacao({ avaliacao, sessoes }: { avaliacao?: Avaliacao; sessoes: Tarefa[] }) {
  await banco.transaction('rw', banco.avaliacoes, banco.tarefas, async () => {
    if (avaliacao) await banco.avaliacoes.put(avaliacao)
    await banco.tarefas.bulkPut(sessoes)
  })
}

export async function concluirAvaliacao(id: string, feita: boolean) {
  await banco.avaliacoes.update(id, { feitaEm: feita ? new Date().toISOString() : undefined })
}

export async function criarSessoes(tarefas: Tarefa[]) {
  await banco.tarefas.bulkAdd(tarefas)
}

export async function apagarSessoes(ids: string[]) {
  await banco.tarefas.bulkDelete(ids)
}
