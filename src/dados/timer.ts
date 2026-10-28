// Timer visual do cartão "Agora". Fica no banco local para continuar certo
// depois de recarregar a página e para aparecer igual na janelinha flutuante.

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { banco } from './banco'

export type Timer = { tarefaId?: string; inicio: string; duracaoMin: number }

const CHAVE = 'timer'

export function useTimer(): Timer | null | undefined {
  return useLiveQuery(async () => ((await banco.configuracoes.get(CHAVE))?.valor as Timer | undefined) ?? null, [])
}

export async function iniciarTimer(duracaoMin: number, tarefaId?: string) {
  await banco.configuracoes.put({ chave: CHAVE, valor: { tarefaId, inicio: new Date().toISOString(), duracaoMin } satisfies Timer })
}

export async function pararTimer() {
  await banco.configuracoes.delete(CHAVE)
}

/** Quanto falta, em segundos (0 quando acabou). */
export function segundosRestantes(timer: Timer, agora: Date): number {
  const fim = new Date(timer.inicio).getTime() + timer.duracaoMin * 60_000
  return Math.max(0, Math.round((fim - agora.getTime()) / 1000))
}

/** Hora atual, atualizada a cada `intervalo` milissegundos. */
export function useAgora(intervalo = 1000): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervalo)
    return () => clearInterval(id)
  }, [intervalo])
  return agora
}
