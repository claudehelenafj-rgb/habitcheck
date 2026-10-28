// Check-ins de emoções guardados no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal, type Dia } from '../logica/datas'
import { doDia, valorValido, type Checkin } from '../logica/checkin'
import { banco, novoId } from './banco'

export type NovoCheckin = Pick<Checkin, 'ansiedade' | 'irritacao' | 'energia' | 'sinais' | 'nota'>

export async function salvarCheckin(dados: NovoCheckin, agora = new Date()): Promise<Checkin> {
  if (![dados.ansiedade, dados.irritacao, dados.energia].every(valorValido)) {
    throw new Error('Check-in com valor fora de 0 a 10')
  }
  const checkin: Checkin = {
    id: novoId(),
    quando: agora.toISOString(),
    dia: diaLocal(agora),
    ansiedade: dados.ansiedade,
    irritacao: dados.irritacao,
    energia: dados.energia,
    ...(dados.sinais?.length ? { sinais: dados.sinais } : {}),
    ...(dados.nota?.trim() ? { nota: dados.nota.trim() } : {}),
  }
  await banco.checkins.add(checkin)
  return checkin
}

export async function apagarCheckin(id: string) {
  await banco.checkins.delete(id)
}

export async function restaurarCheckin(checkin: Checkin) {
  await banco.checkins.put(checkin)
}

/** Check-ins do dia, do mais recente para o mais antigo. undefined = carregando. */
export function useCheckinsDoDia(dia: Dia): Checkin[] | undefined {
  return useLiveQuery(async () => doDia(await banco.checkins.where('dia').equals(dia).toArray(), dia), [dia])
}

/** O check-in mais recente de todos (null = nenhum ainda; undefined = carregando). */
export function useUltimoCheckin(): Checkin | null | undefined {
  return useLiveQuery(async () => (await banco.checkins.orderBy('quando').last()) ?? null, [])
}
