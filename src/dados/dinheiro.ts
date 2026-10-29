// Dinheiro no banco local: contas a pagar e os pagamentos de cada mês. Nada sai do aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import { desmarcarPaga, marcarPaga, type Conta, type Mes } from '../logica/dinheiro'
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
