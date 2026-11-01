// Diário de sono, uma anotação por noite, guardado no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import type { RegistroSono } from '../logica/sono'
import { banco, novoId } from './banco'

export type NovaNoite = Omit<RegistroSono, 'id' | 'registradoEm'>

/** undefined = carregando */
export function useSonos(): RegistroSono[] | undefined {
  return useLiveQuery(() => banco.sonos.orderBy('noite').toArray(), [])
}

/** Anota a noite. Se ela já tinha anotação, substitui (fica uma por noite). Devolve a anterior, para o "Desfazer". */
export async function salvarNoite(dados: NovaNoite, agora = new Date()): Promise<{ salvo: RegistroSono; anterior?: RegistroSono }> {
  return banco.transaction('rw', banco.sonos, async () => {
    const anterior = await banco.sonos.where('noite').equals(dados.noite).first()
    const { nota, ...resto } = dados
    const salvo: RegistroSono = {
      ...resto,
      id: anterior?.id ?? novoId(),
      registradoEm: agora.toISOString(),
      ...(nota?.trim() ? { nota: nota.trim() } : {}),
    }
    await banco.sonos.put(salvo)
    return { salvo, anterior }
  })
}

export async function desfazerNoite(salvo: RegistroSono, anterior?: RegistroSono) {
  await banco.transaction('rw', banco.sonos, async () => {
    await banco.sonos.delete(salvo.id)
    if (anterior) await banco.sonos.put(anterior)
  })
}

export async function apagarNoite(id: string) {
  await banco.sonos.delete(id)
}
