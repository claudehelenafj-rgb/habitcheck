// Configuração da aba Bem-estar: quais ferramentas estão ligadas.
// Guardada na tabela configuracoes, chave "bemEstar". Fica só neste aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { alternarFerramenta, type IdFerramenta } from '../logica/bemEstar'
import { banco } from './banco'

export type ConfigBemEstar = { ferramentas: IdFerramenta[] }

const CHAVE = 'bemEstar'
const VAZIA: ConfigBemEstar = { ferramentas: [] }

/** undefined = carregando */
export function useBemEstar(): ConfigBemEstar | undefined {
  return useLiveQuery(
    async () => ({ ...VAZIA, ...((await banco.configuracoes.get(CHAVE))?.valor as ConfigBemEstar | undefined) }),
    [],
  )
}

/** Liga ou desliga uma ferramenta. Devolve true se agora há mais ferramentas que o sugerido. */
export async function alternar(id: IdFerramenta): Promise<boolean> {
  return banco.transaction('rw', banco.configuracoes, async () => {
    const atual = { ...VAZIA, ...((await banco.configuracoes.get(CHAVE))?.valor as ConfigBemEstar | undefined) }
    const r = alternarFerramenta(atual.ferramentas, id)
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ferramentas: r.ligadas } })
    return r.muitas
  })
}
