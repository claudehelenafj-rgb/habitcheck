// Consultas no banco local.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal } from '../logica/datas'
import { preparoPadrao, proximaDaRepeticao, type Consulta } from '../logica/consultas'
import { banco, novoId } from './banco'

export function useConsultas(): Consulta[] | undefined {
  return useLiveQuery(() => banco.consultas.toArray())
}

export function novaConsulta(itensPreparo: string[]): Consulta {
  return {
    id: novoId(),
    titulo: '',
    status: 'marcar',
    duracaoMin: 60,
    deslocamentoMin: 30,
    preparoMin: 30,
    folgaPct: 30,
    preparo: preparoPadrao(novoId, itensPreparo),
    criadaEm: new Date().toISOString(),
  }
}

export async function salvarConsulta(c: Consulta) {
  await banco.consultas.put(c)
}

export async function apagarConsulta(id: string): Promise<Consulta | undefined> {
  const c = await banco.consultas.get(id)
  await banco.consultas.delete(id)
  return c
}

/** Marca como feita; se repete, cria o próximo "preciso marcar". Devolve o próximo (se houver). */
export async function marcarComoFeita(c: Consulta): Promise<Consulta | null> {
  const agora = new Date()
  const proxima = proximaDaRepeticao(c, diaLocal(agora), novoId(), agora.toISOString())
  await banco.transaction('rw', banco.consultas, async () => {
    await banco.consultas.put({ ...c, status: 'feita', feitaEm: agora.toISOString(), recorrenciaMeses: undefined })
    if (proxima) await banco.consultas.put(proxima)
  })
  return proxima
}

/** Desfaz o "já fui": volta a consulta para marcada e tira o "preciso marcar" que nasceu dela. */
export async function desfazerFeita(c: Consulta, proxima: Consulta | null) {
  await banco.transaction('rw', banco.consultas, async () => {
    await banco.consultas.put(c)
    if (proxima) await banco.consultas.delete(proxima.id)
  })
}

export async function alternarPreparo(consultaId: string, itemId: string) {
  await banco.transaction('rw', banco.consultas, async () => {
    const c = await banco.consultas.get(consultaId)
    if (!c) return
    await banco.consultas.update(consultaId, { preparo: c.preparo.map((p) => (p.id === itemId ? { ...p, feito: !p.feito } : p)) })
  })
}

// ---------- Avisos de transição já mostrados (para não repetir) ----------

const CHAVE_TRANSICOES = 'transicoesAvisadas'

/** Os avisos já mostrados (ids como "habito|<id>|<dia>"), para a revisão semanal. */
export function useAvisosTocados(): string[] | undefined {
  return useLiveQuery(async () => ((await banco.configuracoes.get(CHAVE_TRANSICOES))?.valor as string[] | undefined) ?? [], [])
}

export async function jaAvisouTransicao(id: string): Promise<boolean> {
  const lista = ((await banco.configuracoes.get(CHAVE_TRANSICOES))?.valor as string[] | undefined) ?? []
  return lista.includes(id)
}

export async function registrarTransicao(id: string) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const lista = ((await banco.configuracoes.get(CHAVE_TRANSICOES))?.valor as string[] | undefined) ?? []
    // guarda os 400 mais recentes: dá para a revisão semanal saber quais avisos da semana ficaram sem resposta
    await banco.configuracoes.put({ chave: CHAVE_TRANSICOES, valor: [...lista, id].slice(-400) })
  })
}
