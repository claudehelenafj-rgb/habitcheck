// Remédios e doses no banco local.

import { useLiveQuery } from 'dexie-react-hooks'
import { ADIAR_MIN, dosesDoDia, type DosePrevista, type RegistroDose, type Remedio, type Silencio, type StatusDose } from '../logica/remedios'
import type { Dia } from '../logica/datas'
import { banco, novoId } from './banco'

export function useRemedios(): Remedio[] | undefined {
  return useLiveQuery(() => banco.remedios.toArray())
}

/** Registros de dose dos dias pedidos (ex.: a semana inteira). */
export function useRegistros(dias: Dia[]): RegistroDose[] | undefined {
  const chave = dias.join(',')
  return useLiveQuery(() => banco.doses.where('dia').anyOf(dias).toArray(), [chave])
}

export function novoRemedio(): Remedio {
  return { id: novoId(), nome: '', horarios: ['08:00'], repetir: { vezes: 2, intervaloMin: 10 }, ativo: true, criadoEm: new Date().toISOString() }
}

export async function salvarRemedio(r: Remedio) {
  await banco.remedios.put(r)
}

/** Apaga o remédio (o histórico de doses fica) e devolve o que foi apagado, para o "Desfazer". */
export async function apagarRemedio(id: string): Promise<Remedio | undefined> {
  const r = await banco.remedios.get(id)
  await banco.remedios.delete(id)
  return r
}

function registroVazio(dose: DosePrevista): RegistroDose {
  return { id: dose.id, remedioId: dose.remedio.id, dia: dose.dia, horario: dose.horario, avisos: 0 }
}

async function ajustarEstoque(remedioId: string, delta: number) {
  const r = await banco.remedios.get(remedioId)
  if (!r?.estoque) return
  await banco.remedios.update(remedioId, { estoque: { ...r.estoque, quantidade: Math.max(0, r.estoque.quantidade + delta * r.estoque.porDose) } })
}

/** Tomei, pulei ou adiei. "Tomei" desconta do estoque; trocar de "tomei" para outra coisa devolve. */
export async function responderDose(dose: DosePrevista, status: StatusDose) {
  await banco.transaction('rw', banco.doses, banco.remedios, async () => {
    const atual = (await banco.doses.get(dose.id)) ?? registroVazio(dose)
    if (atual.status === 'tomei' && status !== 'tomei') await ajustarEstoque(dose.remedio.id, +1)
    if (atual.status !== 'tomei' && status === 'tomei') await ajustarEstoque(dose.remedio.id, -1)
    const agora = new Date()
    await banco.doses.put({
      ...atual,
      status,
      respondidaEm: agora.toISOString(),
      adiadaAte: status === 'adiada' ? new Date(agora.getTime() + ADIAR_MIN * 60_000).toISOString() : undefined,
      avisosAntesDeAdiar: status === 'adiada' ? atual.avisos : undefined,
    })
  })
}

/** Volta a dose para "sem resposta" (usado pelo Desfazer). */
export async function desfazerResposta(dose: DosePrevista) {
  await banco.transaction('rw', banco.doses, banco.remedios, async () => {
    const atual = await banco.doses.get(dose.id)
    if (!atual) return
    if (atual.status === 'tomei') await ajustarEstoque(dose.remedio.id, +1)
    await banco.doses.put({ ...atual, status: undefined, respondidaEm: undefined, adiadaAte: undefined, avisosAntesDeAdiar: undefined })
  })
}

export async function registrarAviso(dose: DosePrevista) {
  await banco.transaction('rw', banco.doses, async () => {
    const atual = (await banco.doses.get(dose.id)) ?? registroVazio(dose)
    await banco.doses.put({ ...atual, avisos: atual.avisos + 1 })
  })
}

export async function compreiMais(remedioId: string, unidades: number) {
  const r = await banco.remedios.get(remedioId)
  if (!r?.estoque) return
  await banco.remedios.update(remedioId, { estoque: { ...r.estoque, quantidade: r.estoque.quantidade + unidades } })
}

// ---------- Configuração dos avisos ----------

export type ConfigAvisos = { silencio: Silencio }
export const AVISOS_PADRAO: ConfigAvisos = { silencio: { ativo: true, inicio: '22:00', fim: '07:00' } }

export function useConfigAvisos(): ConfigAvisos {
  const salvo = useLiveQuery(async () => (await banco.configuracoes.get('avisos'))?.valor as ConfigAvisos | undefined)
  return salvo ?? AVISOS_PADRAO
}

export async function salvarConfigAvisos(c: ConfigAvisos) {
  await banco.configuracoes.put({ chave: 'avisos', valor: c })
}

/** Doses de hoje já com os registros, para a tela Hoje, o Agora e os lembretes. */
export function useDosesDoDia(dia: Dia): { doses: DosePrevista[]; registros: RegistroDose[] } | undefined {
  const remedios = useRemedios()
  const registros = useRegistros([dia])
  if (!remedios || !registros) return undefined
  return { doses: dosesDoDia(remedios, dia), registros }
}

/** Registros de dose a partir de um dia (para o resumo e os padrões). */
export function useRegistrosDesde(dia: Dia): RegistroDose[] | undefined {
  return useLiveQuery(() => banco.doses.where('dia').aboveOrEqual(dia).toArray(), [dia])
}
