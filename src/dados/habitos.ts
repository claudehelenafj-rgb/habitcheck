// Hábitos e o registro de cada dia (feito ou versão mínima) no banco local.
// Tocar de novo no mesmo nível desfaz; nada é apagado sem "Desfazer".

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import { alternarPreparo, idRegistro, type Habito, type NivelHabito, type RegistroHabito } from '../logica/habitos'
import type { Dia } from '../logica/datas'
import { banco, novoId } from './banco'

export function useHabitos(area?: IdArea): Habito[] | undefined {
  return useLiveQuery(async () => {
    const todos = await banco.habitos.toArray()
    return todos.filter((h) => !area || h.area === area).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
  }, [area])
}

/** Hábitos não arquivados das áreas ligadas, com os registros (para a tela Hoje e o cartão "Agora"). */
export function useHabitosAtivos(): { habitos: Habito[]; registros: RegistroHabito[] } | undefined {
  return useLiveQuery(async () => {
    const perfil = (await banco.configuracoes.get('perfil'))?.valor as { areasAtivas?: IdArea[] } | undefined
    const areas = perfil?.areasAtivas ?? []
    const habitos = (await banco.habitos.toArray())
      .filter((h) => !h.arquivadoEm && (!h.area || areas.includes(h.area)))
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
    const registros = await banco.registrosHabito.toArray()
    return { habitos, registros }
  }, [])
}

export function useRegistrosHabito(): RegistroHabito[] | undefined {
  return useLiveQuery(() => banco.registrosHabito.toArray(), [])
}

export function novoHabito(dados: Partial<Habito> = {}): Habito {
  return { id: novoId(), titulo: '', adesivo: 'haltere', se: '', entao: '', minima: '', meta: 3, dias: [], criadoEm: new Date().toISOString(), ...dados }
}

export async function salvarHabito(h: Habito) {
  await banco.habitos.put(h)
}

export async function arquivarHabito(id: string, arquivar: boolean) {
  await banco.habitos.update(id, { arquivadoEm: arquivar ? new Date().toISOString() : undefined })
}

/** Apaga o hábito e os registros dele. Devolve tudo, para o "Desfazer". */
export async function apagarHabito(id: string): Promise<{ habito?: Habito; registros: RegistroHabito[] }> {
  return banco.transaction('rw', banco.habitos, banco.registrosHabito, async () => {
    const habito = await banco.habitos.get(id)
    const registros = await banco.registrosHabito.where('habitoId').equals(id).toArray()
    await banco.habitos.delete(id)
    await banco.registrosHabito.bulkDelete(registros.map((r) => r.id))
    return { habito, registros }
  })
}

export async function restaurarHabito({ habito, registros }: { habito?: Habito; registros: RegistroHabito[] }) {
  await banco.transaction('rw', banco.habitos, banco.registrosHabito, async () => {
    if (habito) await banco.habitos.put(habito)
    await banco.registrosHabito.bulkPut(registros)
  })
}

/** Marca o dia com um nível; `undefined` tira a marca. */
export async function marcarHabito(habitoId: string, dia: Dia, nivel: NivelHabito | undefined, agora = new Date()) {
  const id = idRegistro(habitoId, dia)
  if (!nivel) await banco.registrosHabito.delete(id)
  else await banco.registrosHabito.put({ id, habitoId, dia, nivel, quando: agora.toISOString() })
}

/** Marca ou desmarca um item da base de lançamento (ou o "combinei com…") para o dia. */
export async function marcarPreparo(habitoId: string, dia: Dia, item: string | { combinado: true }) {
  await banco.transaction('rw', banco.habitos, async () => {
    const h = await banco.habitos.get(habitoId)
    if (h) await banco.habitos.update(habitoId, { preparo: alternarPreparo(h, dia, item) })
  })
}
