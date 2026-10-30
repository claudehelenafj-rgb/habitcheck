// Alimentação no banco local: a configuração (refeições, horários, lembretes e quantos copos de água),
// guardada em configuracoes, chave "alimentacao", um registro por dia (refeições marcadas e copos),
// as comidas fáceis e a lista de compras.

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import {
  alternarRefeicao,
  CONFIG_ALIMENTACAO_PADRAO,
  completarRefeicoes,
  diaVazio,
  novosItensDeCompra,
  tocarCopo,
  type Comida,
  type ConfigAlimentacao,
  type DiaAlimentacao,
  type IdRefeicao,
  type ItemCompra,
} from '../logica/alimentacao'
import type { Dia } from '../logica/datas'
import { banco, novoId } from './banco'

const CHAVE = 'alimentacao'

async function lerConfig(): Promise<ConfigAlimentacao> {
  const guardada = (await banco.configuracoes.get(CHAVE))?.valor as Partial<ConfigAlimentacao> | undefined
  return { ...CONFIG_ALIMENTACAO_PADRAO, ...guardada, refeicoes: completarRefeicoes(guardada?.refeicoes) }
}

export function useConfigAlimentacao(): ConfigAlimentacao | undefined {
  return useLiveQuery(lerConfig, [])
}

/** Muda a partir do que está guardado agora (mudanças rápidas não se apagam). */
export async function mudarConfigAlimentacao(mudar: (c: ConfigAlimentacao) => Partial<ConfigAlimentacao>) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerConfig()
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ...mudar(atual) } })
  })
}

export function useDiasAlimentacao(dias: Dia[]): DiaAlimentacao[] | undefined {
  const chave = dias.join(',')
  return useLiveQuery(async () => (await banco.diasAlimentacao.bulkGet(dias)).filter((d): d is DiaAlimentacao => !!d), [chave])
}

/** Configuração e o dia de hoje, só com a área Alimentação ligada (para a tela Hoje e os lembretes). */
export function useAlimentacaoDeHoje(hoje: Dia): { config: ConfigAlimentacao; dia?: DiaAlimentacao } | null | undefined {
  return useLiveQuery(async () => {
    const perfil = (await banco.configuracoes.get('perfil'))?.valor as { areasAtivas?: IdArea[] } | undefined
    if (!perfil?.areasAtivas?.includes('alimentacao')) return null
    return { config: await lerConfig(), dia: await banco.diasAlimentacao.get(hoje) }
  }, [hoje])
}

async function mudarDia(dia: Dia, mudar: (d: DiaAlimentacao) => DiaAlimentacao) {
  await banco.transaction('rw', banco.diasAlimentacao, async () => {
    const atual = (await banco.diasAlimentacao.get(dia)) ?? diaVazio(dia)
    await banco.diasAlimentacao.put(mudar(atual))
  })
}

export async function marcarRefeicao(dia: Dia, id: IdRefeicao, agora = new Date()) {
  await mudarDia(dia, (d) => alternarRefeicao(d, id, agora))
}

export async function marcarCopo(dia: Dia, n: number) {
  await mudarDia(dia, (d) => tocarCopo(d, n))
}

// ---------- comidas fáceis ----------

export function useComidas(): Comida[] | undefined {
  return useLiveQuery(() => banco.comidas.toArray(), [])
}

export async function salvarComida(c: Comida) {
  await banco.comidas.put(c)
}

export async function apagarComida(id: string): Promise<Comida | undefined> {
  const c = await banco.comidas.get(id)
  await banco.comidas.delete(id)
  return c
}

export async function restaurarComida(c: Comida) {
  await banco.comidas.put(c)
}

/** Ideias para começar (editáveis), só com a lista vazia. */
export async function criarComidasExemplo(exemplos: Array<Omit<Comida, 'id' | 'criadaEm'>>) {
  await banco.transaction('rw', banco.comidas, async () => {
    if (await banco.comidas.count()) return
    const agora = new Date().toISOString()
    await banco.comidas.bulkAdd(exemplos.map((e) => ({ ...e, id: novoId(), criadaEm: agora })))
  })
}

// ---------- lista de compras ----------

export function useCompras(): ItemCompra[] | undefined {
  return useLiveQuery(() => banco.compras.toArray(), [])
}

/** Acrescenta à lista o que ainda não está para comprar. Devolve quantos entraram. */
export async function acrescentarCompras(texto: string | string[]): Promise<number> {
  return banco.transaction('rw', banco.compras, async () => {
    const novos = novosItensDeCompra(texto, await banco.compras.toArray())
    const agora = Date.now()
    // um milissegundo de diferença mantém a ordem em que foram escritos
    await banco.compras.bulkAdd(novos.map((nome, i) => ({ id: novoId(), nome, criadoEm: new Date(agora + i).toISOString() })))
    return novos.length
  })
}

export async function alternarComprado(id: string) {
  await banco.transaction('rw', banco.compras, async () => {
    const i = await banco.compras.get(id)
    if (i) await banco.compras.update(id, { compradoEm: i.compradoEm ? undefined : new Date().toISOString() })
  })
}

/** Tira da lista o que já foi comprado. Devolve os itens, para o "Desfazer". */
export async function tirarComprados(): Promise<ItemCompra[]> {
  return banco.transaction('rw', banco.compras, async () => {
    const comprados = (await banco.compras.toArray()).filter((i) => i.compradoEm)
    await banco.compras.bulkDelete(comprados.map((i) => i.id))
    return comprados
  })
}

export async function restaurarCompras(itens: ItemCompra[]) {
  await banco.compras.bulkPut(itens)
}
