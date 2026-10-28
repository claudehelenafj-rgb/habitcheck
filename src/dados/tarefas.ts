// Caixa de entrada e tarefas: leitura ao vivo e gravação no banco local.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal } from '../logica/datas'
import { banco, novoId, type ItemCaixa, type Passo, type Tarefa } from './banco'

// ---------- Caixa de entrada ----------

export async function capturar(textos: string[]): Promise<number> {
  const agora = new Date().toISOString()
  await banco.caixaEntrada.bulkAdd(textos.map((texto) => ({ id: novoId(), texto, criadoEm: agora })))
  return textos.length
}

/** Itens ainda não resolvidos, do mais novo para o mais antigo. */
export function useCaixaAberta(): ItemCaixa[] | undefined {
  return useLiveQuery(async () =>
    (await banco.caixaEntrada.toArray()).filter((i) => !i.resolvidoEm).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
  )
}

export async function resolverItem(id: string, destino: NonNullable<ItemCaixa['destino']>) {
  await banco.caixaEntrada.update(id, { destino, resolvidoEm: new Date().toISOString() })
}

export async function desfazerResolucao(id: string) {
  await banco.caixaEntrada.update(id, { destino: undefined, resolvidoEm: undefined })
}

// ---------- Tarefas ----------

export function useTarefas(): Tarefa[] | undefined {
  return useLiveQuery(() => banco.tarefas.toArray())
}

export function novaTarefa(titulo = ''): Tarefa {
  return { id: novoId(), titulo, prioridade: 'B', passos: [], criadaEm: new Date().toISOString() }
}

export function novoPasso(texto = ''): Passo {
  return { id: novoId(), texto, feito: false }
}

export async function salvarTarefa(tarefa: Tarefa) {
  await banco.tarefas.put(tarefa)
}

export async function concluirTarefa(id: string) {
  const agora = new Date()
  await banco.tarefas.update(id, { feitaEm: agora.toISOString(), feitaNoDia: diaLocal(agora) })
}

export async function reabrirTarefa(id: string) {
  await banco.tarefas.update(id, { feitaEm: undefined, feitaNoDia: undefined })
}

/** Apaga e devolve a tarefa, para o "Desfazer". */
export async function apagarTarefa(id: string): Promise<Tarefa | undefined> {
  const tarefa = await banco.tarefas.get(id)
  await banco.tarefas.delete(id)
  return tarefa
}

export async function alternarPasso(tarefaId: string, passoId: string) {
  await banco.transaction('rw', banco.tarefas, async () => {
    const t = await banco.tarefas.get(tarefaId)
    if (!t) return
    await banco.tarefas.update(tarefaId, {
      passos: t.passos.map((p) => (p.id === passoId ? { ...p, feito: !p.feito } : p)),
    })
  })
}
