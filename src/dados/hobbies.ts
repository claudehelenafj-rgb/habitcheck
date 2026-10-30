// Hobbies e as vezes em que aconteceram, guardados no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal, type Dia } from '../logica/datas'
import type { Frequencia, Hobby, MotivoParado, VezHobby } from '../logica/hobbies'
import type { NomeAdesivo } from '../componentes/Adesivo'
import { banco, novoId } from './banco'

/** undefined = carregando */
export function useHobbies(): { hobbies: Hobby[]; vezes: VezHobby[] } | undefined {
  return useLiveQuery(async () => ({ hobbies: await banco.hobbies.toArray(), vezes: await banco.vezesHobby.toArray() }), [])
}

export async function criarHobby(dados: { nome: string; adesivo: NomeAdesivo; frequencia: Frequencia }, agora = new Date()): Promise<Hobby> {
  const nome = dados.nome.trim()
  if (!nome) throw new Error('Hobby sem nome')
  const hobby: Hobby = { id: novoId(), nome, adesivo: dados.adesivo, frequencia: dados.frequencia, criadoEm: agora.toISOString(), motivos: [] }
  await banco.hobbies.add(hobby)
  return hobby
}

export async function atualizarHobby(id: string, mudanca: Partial<Omit<Hobby, 'id'>>) {
  await banco.hobbies.update(id, mudanca)
}

/** Registro em um toque. A duração pode vir depois. */
export async function registrarVez(hobbyId: string, agora = new Date()): Promise<VezHobby> {
  const vez: VezHobby = { id: novoId(), hobbyId, dia: diaLocal(agora), quando: agora.toISOString() }
  await banco.vezesHobby.add(vez)
  return vez
}

export async function definirDuracao(vezId: string, duracaoMin: number) {
  await banco.vezesHobby.update(vezId, { duracaoMin })
}

export async function apagarVez(id: string) {
  await banco.vezesHobby.delete(id)
}

export async function anotarMotivo(hobbyId: string, motivo: Omit<MotivoParado, 'dia'>, hoje: Dia = diaLocal()) {
  await banco.transaction('rw', banco.hobbies, async () => {
    const h = await banco.hobbies.get(hobbyId)
    if (!h) return
    const limpo: MotivoParado = { dia: hoje, etiquetas: motivo.etiquetas, ...(motivo.texto?.trim() ? { texto: motivo.texto.trim() } : {}) }
    // um porquê por dia: anotar de novo no mesmo dia substitui
    await banco.hobbies.update(hobbyId, { motivos: [...h.motivos.filter((m) => m.dia !== hoje), limpo] })
  })
}

/** Apaga o hobby e as vezes dele. Devolve tudo, para o "Desfazer". */
export async function apagarHobby(id: string): Promise<{ hobby?: Hobby; vezes: VezHobby[] }> {
  return banco.transaction('rw', banco.hobbies, banco.vezesHobby, async () => {
    const hobby = await banco.hobbies.get(id)
    const vezes = await banco.vezesHobby.where('hobbyId').equals(id).toArray()
    await banco.hobbies.delete(id)
    await banco.vezesHobby.where('hobbyId').equals(id).delete()
    return { hobby, vezes }
  })
}

export async function restaurarHobby({ hobby, vezes }: { hobby?: Hobby; vezes: VezHobby[] }) {
  await banco.transaction('rw', banco.hobbies, banco.vezesHobby, async () => {
    if (hobby) await banco.hobbies.put(hobby)
    await banco.vezesHobby.bulkPut(vezes)
  })
}
