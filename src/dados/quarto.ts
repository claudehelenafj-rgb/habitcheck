// Quarto no banco local: zonas (com a lista do que fazer em cada uma), resets feitos e o reset em andamento
// (na tabela configuracoes, chave "resetQuarto", para continuar certo depois de recarregar).

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal } from '../logica/datas'
import { minutosDoReset, terminarReset, type EstadoReset, type ResetQuarto, type Zona } from '../logica/quarto'
import { banco, novoId } from './banco'

const CHAVE_RESET = 'resetQuarto'
const CHAVE_ZONAS_CRIADAS = 'quartoZonasCriadas'

export function useZonas(): Zona[] | undefined {
  return useLiveQuery(() => banco.zonas.orderBy('ordem').toArray(), [])
}

export function useResets(): ResetQuarto[] | undefined {
  return useLiveQuery(() => banco.resets.toArray(), [])
}

/** Na primeira visita, cria as zonas de exemplo (uma vez só: se a pessoa apagar todas, não voltam). */
export async function garantirZonasIniciais(modelos: Omit<Zona, 'id' | 'ordem'>[]) {
  await banco.transaction('rw', banco.zonas, banco.configuracoes, async () => {
    if (await banco.configuracoes.get(CHAVE_ZONAS_CRIADAS)) return
    if ((await banco.zonas.count()) === 0) await banco.zonas.bulkAdd(modelos.map((m, i) => ({ ...m, id: novoId(), ordem: i })))
    await banco.configuracoes.put({ chave: CHAVE_ZONAS_CRIADAS, valor: true })
  })
}

export async function novaZona(dados: Omit<Zona, 'id' | 'ordem'>) {
  await banco.transaction('rw', banco.zonas, async () => {
    const ultima = await banco.zonas.orderBy('ordem').last()
    await banco.zonas.add({ ...dados, id: novoId(), ordem: (ultima?.ordem ?? -1) + 1 })
  })
}

/** Muda a partir do que está guardado agora (mudanças rápidas não se apagam). */
export async function mudarZona(id: string, mudar: (z: Zona) => Partial<Zona>) {
  await banco.transaction('rw', banco.zonas, async () => {
    const z = await banco.zonas.get(id)
    if (z) await banco.zonas.update(id, mudar(z))
  })
}

/** Apaga a zona (os resets já feitos continuam, com o nome da zona). Devolve a zona, para o "Desfazer". */
export async function apagarZona(id: string): Promise<Zona | undefined> {
  const z = await banco.zonas.get(id)
  await banco.zonas.delete(id)
  return z
}

export async function restaurarZona(z: Zona) {
  await banco.zonas.put(z)
}

// ---------- reset em andamento ----------

async function lerReset(): Promise<EstadoReset | null> {
  return ((await banco.configuracoes.get(CHAVE_RESET))?.valor as EstadoReset | undefined) ?? null
}

export function useEstadoReset(): EstadoReset | null | undefined {
  return useLiveQuery(lerReset, [])
}

export async function comecarReset(zonaId: string, minutos: number, agora = new Date()) {
  const e: EstadoReset = { zonaId, inicio: agora.toISOString(), minutos, feitos: [], extras: 0, fase: 'correndo' }
  await banco.configuracoes.put({ chave: CHAVE_RESET, valor: e })
}

export async function mudarReset(mudar: (e: EstadoReset) => EstadoReset) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerReset()
    if (atual) await banco.configuracoes.put({ chave: CHAVE_RESET, valor: mudar(atual) })
  })
}

/** Marca que o tempo deste reset já avisou. Devolve true só para quem marcou primeiro. */
export async function marcarAvisoReset(inicioComMinutos: string): Promise<boolean> {
  return banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerReset()
    const chave = atual && `${atual.inicio}|${atual.minutos}`
    if (!atual || chave !== inicioComMinutos || atual.avisadoEm === chave) return false
    await banco.configuracoes.put({ chave: CHAVE_RESET, valor: { ...atual, avisadoEm: chave } })
    return true
  })
}

/** Guarda o reset feito e encerra. */
export async function encerrarReset(extra: { fotoDepois?: string } = {}, agora = new Date()): Promise<ResetQuarto | undefined> {
  return banco.transaction('rw', banco.configuracoes, banco.resets, banco.zonas, async () => {
    const atual = await lerReset()
    if (!atual) return undefined
    const e = terminarReset(atual, agora)
    const zona = await banco.zonas.get(e.zonaId)
    const reset: ResetQuarto = {
      id: novoId(),
      zonaId: e.zonaId,
      zonaNome: zona?.nome ?? '',
      dia: diaLocal(new Date(e.inicio)),
      inicio: e.inicio,
      fim: e.fimEm!,
      minutos: Math.max(1, minutosDoReset(e, agora)),
      feitos: e.feitos,
      total: zona?.itens.length ?? e.feitos.length,
      ...(e.fotoAntes ? { fotoAntes: e.fotoAntes } : {}),
      ...(extra.fotoDepois ? { fotoDepois: extra.fotoDepois } : {}),
    }
    await banco.resets.add(reset)
    await banco.configuracoes.delete(CHAVE_RESET)
    return reset
  })
}

/** Sai do reset sem guardar. Devolve a foto do antes, se tinha (para quem chamou apagar). */
export async function descartarReset(): Promise<string | undefined> {
  const atual = await lerReset()
  await banco.configuracoes.delete(CHAVE_RESET)
  return atual?.fotoAntes
}

export async function apagarResetFeito(id: string): Promise<ResetQuarto | undefined> {
  const r = await banco.resets.get(id)
  await banco.resets.delete(id)
  return r
}

export async function restaurarResetFeito(r: ResetQuarto) {
  await banco.resets.put(r)
}
