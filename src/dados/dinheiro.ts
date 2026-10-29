// Dinheiro no banco local: contas a pagar e os pagamentos de cada mês, potes da semana e gastos,
// lista de desejos (pausa de 48 h) e cofrinhos. Nada sai do aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import {
  desmarcarPaga,
  marcarPaga,
  poteDoGasto,
  type Centavos,
  type Cofrinho,
  type Conta,
  type Deposito,
  type Desejo,
  type Gasto,
  type Mes,
  type Pote,
} from '../logica/dinheiro'
import { diaLocal } from '../logica/datas'
import { banco, novoId } from './banco'

export function useContas(): Conta[] | undefined {
  return useLiveQuery(() => banco.contas.toArray(), [])
}

/** Contas só com a área Dinheiro ligada (para a tela Hoje, o calendário e os lembretes). */
export function useContasAtivas(): Conta[] | null | undefined {
  return useLiveQuery(async () => {
    const perfil = (await banco.configuracoes.get('perfil'))?.valor as { areasAtivas?: IdArea[] } | undefined
    if (!perfil?.areasAtivas?.includes('dinheiro')) return null
    return banco.contas.toArray()
  }, [])
}

export function novaConta(dados: Partial<Conta> = {}): Conta {
  return { id: novoId(), nome: '', dia: 10, repete: true, avisarDiasAntes: 3, pagamentos: [], criadaEm: new Date().toISOString(), ...dados }
}

export async function salvarConta(c: Conta) {
  await banco.contas.put(c)
}

export async function apagarConta(id: string): Promise<Conta | undefined> {
  const c = await banco.contas.get(id)
  await banco.contas.delete(id)
  return c
}

export async function restaurarConta(c: Conta) {
  await banco.contas.put(c)
}

async function mudarConta(id: string, mudar: (c: Conta) => Conta) {
  await banco.transaction('rw', banco.contas, async () => {
    const c = await banco.contas.get(id)
    if (c) await banco.contas.put(mudar(c))
  })
}

export async function pagarConta(id: string, mes: Mes, agora = new Date()) {
  await mudarConta(id, (c) => marcarPaga(c, mes, agora))
}

export async function despagarConta(id: string, mes: Mes) {
  await mudarConta(id, (c) => desmarcarPaga(c, mes))
}

// ---------- potes da semana e gastos ----------

export function usePotes(): Pote[] | undefined {
  return useLiveQuery(() => banco.potes.orderBy('ordem').toArray(), [])
}

export function useGastos(): Gasto[] | undefined {
  return useLiveQuery(() => banco.gastos.toArray(), [])
}

export async function novoPote(dados: Pick<Pote, 'nome' | 'limite'>) {
  await banco.transaction('rw', banco.potes, async () => {
    const ultimo = await banco.potes.orderBy('ordem').last()
    await banco.potes.add({ id: novoId(), palavras: [], ordem: (ultimo?.ordem ?? -1) + 1, ...dados })
  })
}

export async function salvarPote(p: Pote) {
  await banco.potes.put(p)
}

/** Apaga o pote; os gastos dele ficam sem pote. Devolve tudo, para o "Desfazer". */
export async function apagarPote(id: string): Promise<{ pote?: Pote; gastos: Gasto[] }> {
  return banco.transaction('rw', banco.potes, banco.gastos, async () => {
    const pote = await banco.potes.get(id)
    const gastos = await banco.gastos.where('poteId').equals(id).toArray()
    await banco.potes.delete(id)
    await banco.gastos.bulkPut(gastos.map((g) => ({ ...g, poteId: undefined })))
    return { pote, gastos }
  })
}

export async function restaurarPote({ pote, gastos }: { pote?: Pote; gastos: Gasto[] }) {
  await banco.transaction('rw', banco.potes, banco.gastos, async () => {
    if (pote) await banco.potes.put(pote)
    await banco.gastos.bulkPut(gastos)
  })
}

/** Anota um gasto. Sem pote escolhido, procura pelo nome ou pelas palavras do pote na descrição. */
export async function anotarGasto(valor: Centavos, descricao: string, poteId?: string, agora = new Date()): Promise<Gasto> {
  return banco.transaction('rw', banco.potes, banco.gastos, async () => {
    const pote = poteId ? undefined : poteDoGasto(descricao, await banco.potes.toArray())
    const gasto: Gasto = { id: novoId(), valor, descricao: descricao.trim(), poteId: poteId ?? pote?.id, dia: diaLocal(agora), quando: agora.toISOString() }
    await banco.gastos.add(gasto)
    return gasto
  })
}

export async function mudarGasto(id: string, mudanca: Partial<Omit<Gasto, 'id'>>) {
  await banco.gastos.update(id, mudanca)
}

export async function apagarGasto(id: string): Promise<Gasto | undefined> {
  const g = await banco.gastos.get(id)
  await banco.gastos.delete(id)
  return g
}

export async function restaurarGasto(g: Gasto) {
  await banco.gastos.put(g)
}

/** A área Dinheiro está ligada? (a captura só lê gastos rápidos com ela ligada) */
export async function dinheiroLigado(): Promise<boolean> {
  const perfil = (await banco.configuracoes.get('perfil'))?.valor as { areasAtivas?: IdArea[] } | undefined
  return !!perfil?.areasAtivas?.includes('dinheiro')
}

// ---------- pausa antes de comprar ----------

export function useDesejos(): Desejo[] | undefined {
  return useLiveQuery(() => banco.desejos.orderBy('criadoEm').toArray(), [])
}

/** Desejos só com a área Dinheiro ligada (para o aviso de "ainda quer?"). */
export function useDesejosAtivos(): Desejo[] | null | undefined {
  return useLiveQuery(async () => ((await dinheiroLigado()) ? banco.desejos.toArray() : null), [])
}

export async function anotarDesejo(nome: string, valor?: Centavos, agora = new Date()) {
  await banco.desejos.add({ id: novoId(), nome: nome.trim(), ...(valor ? { valor } : {}), criadoEm: agora.toISOString() })
}

/** "Ainda quero?": comprei, desisti, ou `undefined` para desfazer a decisão. */
export async function decidirDesejo(id: string, decisao: Desejo['decisao'], agora = new Date()) {
  await banco.desejos.update(id, { decisao, decididoEm: decisao ? agora.toISOString() : undefined })
}

export async function apagarDesejo(id: string): Promise<Desejo | undefined> {
  const d = await banco.desejos.get(id)
  await banco.desejos.delete(id)
  return d
}

export async function restaurarDesejo(d: Desejo) {
  await banco.desejos.put(d)
}

// ---------- cofrinho ----------

export function useCofrinhos(): Cofrinho[] | undefined {
  return useLiveQuery(() => banco.cofrinhos.toArray(), [])
}

export function useDepositos(): Deposito[] | undefined {
  return useLiveQuery(() => banco.depositos.toArray(), [])
}

export async function novoCofrinho(nome: string, meta: Centavos, agora = new Date()) {
  await banco.cofrinhos.add({ id: novoId(), nome: nome.trim(), meta, criadoEm: agora.toISOString() })
}

export async function salvarCofrinho(c: Cofrinho) {
  await banco.cofrinhos.put(c)
}

/** Guarda (valor positivo) ou tira (negativo) dinheiro do cofrinho. */
export async function moverNoCofrinho(cofrinhoId: string, valor: Centavos, agora = new Date()): Promise<Deposito> {
  const d: Deposito = { id: novoId(), cofrinhoId, valor, dia: diaLocal(agora), quando: agora.toISOString() }
  await banco.depositos.add(d)
  return d
}

export async function apagarDeposito(id: string) {
  await banco.depositos.delete(id)
}

/** Apaga o cofrinho e o que foi guardado nele. Devolve tudo, para o "Desfazer". */
export async function apagarCofrinho(id: string): Promise<{ cofrinho?: Cofrinho; depositos: Deposito[] }> {
  return banco.transaction('rw', banco.cofrinhos, banco.depositos, async () => {
    const cofrinho = await banco.cofrinhos.get(id)
    const depositos = await banco.depositos.where('cofrinhoId').equals(id).toArray()
    await banco.cofrinhos.delete(id)
    await banco.depositos.bulkDelete(depositos.map((d) => d.id))
    return { cofrinho, depositos }
  })
}

export async function restaurarCofrinho({ cofrinho, depositos }: { cofrinho?: Cofrinho; depositos: Deposito[] }) {
  await banco.transaction('rw', banco.cofrinhos, banco.depositos, async () => {
    if (cofrinho) await banco.cofrinhos.put(cofrinho)
    await banco.depositos.bulkPut(depositos)
  })
}
