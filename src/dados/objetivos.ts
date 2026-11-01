// Objetivos no banco local (tabela objetivos) e as ligações com hábitos, tarefas e cofrinhos (o campo objetivoId de cada um).

import { useLiveQuery } from 'dexie-react-hooks'
import type { Ligacoes } from '../logica/objetivos'
import { banco, novoId, type Objetivo } from './banco'

export function useObjetivos(): Objetivo[] | undefined {
  return useLiveQuery(() => banco.objetivos.toArray(), [])
}

export function novoObjetivo(titulo = '', porque = ''): Objetivo {
  return { id: novoId(), titulo, porque, criadoEm: new Date().toISOString() }
}

export async function salvarObjetivo(o: Objetivo) {
  await banco.objetivos.put(o)
}

/** Muda a partir do que está guardado agora (escrever no título e no porquê não apaga um ao outro). */
export async function mudarObjetivo(id: string, mudanca: Partial<Objetivo>) {
  await banco.objetivos.update(id, mudanca)
}

/** Deixar de lado (arquivar) ou trazer de volta. As ligações continuam. */
export async function arquivarObjetivo(id: string, arquivar: boolean) {
  await banco.objetivos.update(id, { arquivadoEm: arquivar ? new Date().toISOString() : undefined })
}

export type CopiaObjetivo = { objetivo: Objetivo; ligacoes: Ligacoes }

/** Apaga o objetivo e solta o que estava ligado a ele; devolve tudo para o "Desfazer". */
export async function apagarObjetivo(id: string): Promise<CopiaObjetivo | undefined> {
  return banco.transaction('rw', banco.objetivos, banco.habitos, banco.tarefas, banco.cofrinhos, async () => {
    const objetivo = await banco.objetivos.get(id)
    if (!objetivo) return undefined
    const habitos = (await banco.habitos.toArray()).filter((h) => h.objetivoId === id).map((h) => h.id)
    const tarefas = (await banco.tarefas.where('objetivoId').equals(id).toArray()).map((t) => t.id)
    const cofrinhos = (await banco.cofrinhos.toArray()).filter((c) => c.objetivoId === id).map((c) => c.id)
    for (const h of habitos) await banco.habitos.update(h, { objetivoId: undefined })
    for (const t of tarefas) await banco.tarefas.update(t, { objetivoId: undefined })
    for (const c of cofrinhos) await banco.cofrinhos.update(c, { objetivoId: undefined })
    await banco.objetivos.delete(id)
    return { objetivo, ligacoes: { habitos, tarefas, cofrinhos } }
  })
}

export async function restaurarObjetivo({ objetivo, ligacoes }: CopiaObjetivo) {
  await banco.transaction('rw', banco.objetivos, banco.habitos, banco.tarefas, banco.cofrinhos, async () => {
    await banco.objetivos.put(objetivo)
    for (const h of ligacoes.habitos) await banco.habitos.update(h, { objetivoId: objetivo.id })
    for (const t of ligacoes.tarefas) await banco.tarefas.update(t, { objetivoId: objetivo.id })
    for (const c of ligacoes.cofrinhos) await banco.cofrinhos.update(c, { objetivoId: objetivo.id })
  })
}

export type TipoLigado = 'habito' | 'tarefa' | 'cofrinho'

/** Liga (ou solta, com undefined) um hábito, uma tarefa ou um cofrinho a um objetivo. */
export async function ligarAoObjetivo(tipo: TipoLigado, id: string, objetivoId: string | undefined) {
  const tabela = tipo === 'habito' ? banco.habitos : tipo === 'tarefa' ? banco.tarefas : banco.cofrinhos
  await tabela.update(id, { objetivoId })
}
