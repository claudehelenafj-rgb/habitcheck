// Configuração da aba Bem-estar: ferramentas ligadas, plano por faixa e sinais do corpo.
// Guardada na tabela configuracoes, chave "bemEstar". Fica só neste aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { alternarFerramenta, type IdFerramenta } from '../logica/bemEstar'
import type { PlanoFaixas } from '../logica/checkin'
import type { ConfigSono } from '../logica/sono'
import type { Atividade } from '../logica/sugestoes'
import { banco } from './banco'

export type ConfigBemEstar = {
  ferramentas: IdFerramenta[]
  /** o que a pessoa combinou fazer em cada faixa do check-in; vazio = ainda não combinou */
  planoFaixas?: Partial<PlanoFaixas>
  /** etiquetas de sinais do corpo; ausente = lista inicial */
  sinais?: string[]
  /** listas de etiquetas dos sintomas; ausente = lista inicial */
  listaSintomas?: string[]
  listaPorques?: string[]
  listaAjudou?: string[]
  listaMotivosHobby?: string[]
  /** ideias de atividade; ausente = lista inicial */
  atividades?: Atividade[]
  sono?: ConfigSono
  /** passos da rotina de desacelerar já feitos, e de qual noite */
  rotinaFeita?: { noite: string; ids: string[] }
}

/** Nome do campo de cada lista de etiquetas editável. */
export type ListaEtiquetas = 'sinais' | 'listaSintomas' | 'listaPorques' | 'listaAjudou' | 'listaMotivosHobby'

const CHAVE = 'bemEstar'
const VAZIA: ConfigBemEstar = { ferramentas: [] }

async function ler(): Promise<ConfigBemEstar> {
  return { ...VAZIA, ...((await banco.configuracoes.get(CHAVE))?.valor as ConfigBemEstar | undefined) }
}

/** undefined = carregando */
export function useBemEstar(): ConfigBemEstar | undefined {
  return useLiveQuery(ler, [])
}

/**
 * Muda a configuração a partir do que está guardado agora (não do que a tela mostrou),
 * numa transação só: duas mudanças rápidas seguidas não apagam uma à outra.
 */
export async function mudarBemEstar(mudar: (atual: ConfigBemEstar) => Partial<ConfigBemEstar>) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await ler()
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ...mudar(atual) } })
  })
}

/** Troca campos inteiros. Para mudar uma parte de uma lista ou do sono, use mudarBemEstar. */
export async function atualizarBemEstar(mudanca: Partial<ConfigBemEstar>) {
  await mudarBemEstar(() => mudanca)
}

/** Muda só alguns campos do sono, sem perder os outros. */
export async function mudarSono(mudanca: Partial<ConfigSono>) {
  await mudarBemEstar((c) => ({ sono: { ...c.sono, ...mudanca } }))
}

/** Liga ou desliga uma ferramenta. Devolve true se agora há mais ferramentas que o sugerido. */
export async function alternar(id: IdFerramenta): Promise<boolean> {
  return banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await ler()
    const r = alternarFerramenta(atual.ferramentas, id)
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ferramentas: r.ligadas } })
    return r.muitas
  })
}
