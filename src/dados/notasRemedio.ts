// "Como estou com o remédio": anotações para levar à consulta, guardadas no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal, type Dia } from '../logica/datas'
import type { NotaRemedio } from '../logica/remedioNoPlano'
import { banco, novoId } from './banco'

export type NovaNota = Pick<NotaRemedio, 'remedioId' | 'aspectos' | 'nota'>

export async function salvarNotaRemedio(dados: NovaNota, agora = new Date()): Promise<NotaRemedio> {
  const aspectos = Object.fromEntries(Object.entries(dados.aspectos).filter(([, v]) => v)) as NotaRemedio['aspectos']
  if (!Object.keys(aspectos).length && !dados.nota?.trim()) throw new Error('Nota vazia')
  const nota: NotaRemedio = {
    id: novoId(),
    dia: diaLocal(agora),
    quando: agora.toISOString(),
    aspectos,
    ...(dados.remedioId ? { remedioId: dados.remedioId } : {}),
    ...(dados.nota?.trim() ? { nota: dados.nota.trim() } : {}),
  }
  await banco.notasRemedio.add(nota)
  return nota
}

export async function apagarNotaRemedio(id: string) {
  await banco.notasRemedio.delete(id)
}

export async function restaurarNotaRemedio(nota: NotaRemedio) {
  await banco.notasRemedio.put(nota)
}

/** Notas a partir de um dia, da mais nova para a mais antiga. undefined = carregando. */
export function useNotasRemedio(desde: Dia): NotaRemedio[] | undefined {
  return useLiveQuery(
    async () => (await banco.notasRemedio.where('dia').aboveOrEqual(desde).toArray()).sort((a, b) => b.quando.localeCompare(a.quando)),
    [desde],
  )
}
