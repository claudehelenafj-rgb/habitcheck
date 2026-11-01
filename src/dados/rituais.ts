// Rituais no banco local: um registro por ritual e por dia (tabela rituais) e os lembretes
// (configuracoes, chave "rituais").

import { useLiveQuery } from 'dexie-react-hooks'
import type { Dia } from '../logica/datas'
import {
  CONFIG_RITUAIS_PADRAO,
  idRitual,
  type ConfigRituais,
  type IdPassoRitual,
  type IdRitual,
  type RegistroRitual,
  type RespostasRevisao,
} from '../logica/rituais'
import { banco } from './banco'

const CHAVE = 'rituais'

async function lerConfig(): Promise<ConfigRituais> {
  const guardada = (await banco.configuracoes.get(CHAVE))?.valor as Partial<ConfigRituais> | undefined
  return { lembretes: { ...CONFIG_RITUAIS_PADRAO.lembretes, ...guardada?.lembretes } }
}

export function useConfigRituais(): ConfigRituais | undefined {
  return useLiveQuery(lerConfig, [])
}

/** Muda a partir do que está guardado agora (mudanças rápidas não se apagam). */
export async function mudarConfigRituais(mudar: (c: ConfigRituais) => Partial<ConfigRituais>) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerConfig()
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...atual, ...mudar(atual) } })
  })
}

/** null = ainda não começou neste dia; undefined = carregando */
export function useRitual(ritual: IdRitual, dia: Dia): RegistroRitual | null | undefined {
  return useLiveQuery(async () => (await banco.rituais.get(idRitual(ritual, dia))) ?? null, [ritual, dia])
}

/** Rituais a partir de um dia (para a semana em adesivos e a revisão semanal). */
export function useRituaisDesde(dia: Dia): RegistroRitual[] | undefined {
  return useLiveQuery(() => banco.rituais.where('dia').aboveOrEqual(dia).toArray(), [dia])
}

/** Começa o ritual do dia (ou devolve o que já existe, para continuar de onde parou). */
export async function comecarRitual(ritual: IdRitual, dia: Dia, primeiro: IdPassoRitual): Promise<RegistroRitual> {
  return banco.transaction('rw', banco.rituais, async () => {
    const id = idRitual(ritual, dia)
    const ja = await banco.rituais.get(id)
    if (ja) return ja
    const agora = new Date().toISOString()
    const novo: RegistroRitual = { id, ritual, dia, comecouEm: agora, passo: primeiro, passoDesde: agora }
    await banco.rituais.add(novo)
    return novo
  })
}

export async function irParaPasso(id: string, passo: IdPassoRitual) {
  await banco.transaction('rw', banco.rituais, async () => {
    const r = await banco.rituais.get(id)
    if (r && r.passo !== passo) await banco.rituais.update(id, { passo, passoDesde: new Date().toISOString() })
  })
}

/** As três perguntas da revisão: muda só o que foi escrito agora. */
export async function mudarRespostas(id: string, mudanca: Partial<RespostasRevisao>) {
  await banco.transaction('rw', banco.rituais, async () => {
    const r = await banco.rituais.get(id)
    if (r) await banco.rituais.update(id, { respostas: { ...r.respostas, ...mudanca } })
  })
}

/** Todas as revisões semanais (para o histórico e o "o que ajustar" da anterior). */
export function useRevisoes(): RegistroRitual[] | undefined {
  return useLiveQuery(() => banco.rituais.where('ritual').equals('revisao').toArray(), [])
}

/** Os 5 minutos contam de novo a partir de agora. */
export async function recomecarTimer(id: string) {
  await banco.rituais.update(id, { comecouEm: new Date().toISOString() })
}

export async function terminarRitual(id: string) {
  await banco.rituais.update(id, { feitoEm: new Date().toISOString() })
}

/** Fazer de novo: volta ao primeiro passo, com 5 minutos novos. */
export async function refazerRitual(id: string, primeiro: IdPassoRitual) {
  const agora = new Date().toISOString()
  await banco.rituais.update(id, { feitoEm: undefined, passo: primeiro, comecouEm: agora, passoDesde: agora })
}
