// Perfil da pessoa: nome (opcional), áreas ativas, início do plano de 2 semanas e última visita.
// Guardado na tabela configuracoes, chave "perfil".

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import type { Dia } from '../logica/datas'
import { banco } from './banco'

export type Perfil = {
  nome?: string
  areasAtivas: IdArea[]
  inicioPlano: Dia
  ultimaVisita?: Dia
  /** a pessoa escondeu o cartão do plano depois de concluir */
  planoEscondido?: boolean
}

const CHAVE = 'perfil'

/** undefined = carregando; null = primeiro uso (ainda não há perfil). */
export function usePerfil(): Perfil | null | undefined {
  return useLiveQuery(async () => ((await banco.configuracoes.get(CHAVE))?.valor as Perfil | undefined) ?? null, [])
}

export async function salvarPerfil(perfil: Perfil) {
  await banco.configuracoes.put({ chave: CHAVE, valor: perfil })
}

export async function atualizarPerfil(mudanca: Partial<Perfil>) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = (await banco.configuracoes.get(CHAVE))?.valor as Perfil | undefined
    if (!atual) return
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ...mudanca } })
  })
}
