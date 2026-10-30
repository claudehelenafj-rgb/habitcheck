// Registros de sintomas guardados no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { valorValido } from '../logica/checkin'
import { diaLocal, type Dia } from '../logica/datas'
import { limitesDoMes, type RegistroSintoma } from '../logica/sintomas'
import { banco, novoId } from './banco'

export type NovoSintoma = Omit<RegistroSintoma, 'id' | 'quando' | 'dia'>

export async function salvarSintoma(dados: NovoSintoma, agora = new Date()): Promise<RegistroSintoma> {
  if (!dados.sintoma.trim()) throw new Error('Sintoma sem nome')
  if (!valorValido(dados.intensidade)) throw new Error('Intensidade fora de 0 a 10')
  const registro: RegistroSintoma = {
    id: novoId(),
    quando: agora.toISOString(),
    dia: diaLocal(agora),
    sintoma: dados.sintoma.trim(),
    intensidade: dados.intensidade,
    porques: dados.porques,
    ajudou: dados.ajudou,
    ...(dados.duracao ? { duracao: dados.duracao } : {}),
    ...(dados.porqueTexto?.trim() ? { porqueTexto: dados.porqueTexto.trim() } : {}),
    ...(dados.ajudouTexto?.trim() ? { ajudouTexto: dados.ajudouTexto.trim() } : {}),
    ...(dados.efeitoRemedio ? { efeitoRemedio: true } : {}),
  }
  await banco.sintomas.add(registro)
  return registro
}

export async function apagarSintoma(id: string) {
  await banco.sintomas.delete(id)
}

export async function restaurarSintoma(registro: RegistroSintoma) {
  await banco.sintomas.put(registro)
}

/** Registros do mês do dia dado, do mais recente para o mais antigo. undefined = carregando. */
export function useSintomasDoMes(dia: Dia): RegistroSintoma[] | undefined {
  const [inicio, fim] = limitesDoMes(dia)
  return useLiveQuery(
    async () => (await banco.sintomas.where('dia').between(inicio, fim, true, true).toArray()).sort((a, b) => b.quando.localeCompare(a.quando)),
    [inicio, fim],
  )
}

/** O registro de sintoma mais recente (null = nenhum ainda; undefined = carregando). */
export function useUltimoSintoma(): RegistroSintoma | null | undefined {
  return useLiveQuery(async () => (await banco.sintomas.orderBy('quando').last()) ?? null, [])
}

/** Registros a partir de um dia (para contar o que mais ajudou nos últimos tempos). */
export function useSintomasDesde(dia: Dia): RegistroSintoma[] | undefined {
  return useLiveQuery(() => banco.sintomas.where('dia').aboveOrEqual(dia).toArray(), [dia])
}
