// Álbum de adesivos no banco local. Os adesivos vêm do que já está guardado (hábitos, tarefas e rituais feitos);
// só os especiais ganhos ficam guardados à parte (configuracoes, chave "album"), para nunca saírem do álbum.

import { useLiveQuery } from 'dexie-react-hooks'
import { adesivosDoAlbum, especiaisNovos, type AdesivoDoAlbum, type EspeciaisGanhos } from '../logica/album'
import type { NomeAdesivo } from '../componentes/Adesivo'
import { banco } from './banco'

const CHAVE = 'album'

type ConfigAlbum = { especiais: EspeciaisGanhos }

async function lerConfig(): Promise<ConfigAlbum> {
  const guardada = (await banco.configuracoes.get(CHAVE))?.valor as Partial<ConfigAlbum> | undefined
  return { especiais: { ...guardada?.especiais } }
}

async function lerAdesivos(): Promise<AdesivoDoAlbum[]> {
  const [habitos, registros, tarefas, rituais] = await Promise.all([
    banco.habitos.toArray(),
    banco.registrosHabito.toArray(),
    banco.tarefas.filter((t) => !!t.feitaEm).toArray(),
    banco.rituais.filter((r) => !!r.feitoEm).toArray(),
  ])
  return adesivosDoAlbum({ habitos, registros, tarefas, rituais })
}

export type Album = { adesivos: AdesivoDoAlbum[]; especiais: EspeciaisGanhos }

export function useAlbum(): Album | undefined {
  return useLiveQuery(async () => {
    const [adesivos, config] = await Promise.all([lerAdesivos(), lerConfig()])
    return { adesivos, especiais: config.especiais }
  }, [])
}

/** Só o total (para a moldura notar quando chega um especial). */
export function useTotalDeAdesivos(): number | undefined {
  return useLiveQuery(async () => {
    const [registros, tarefas, rituais] = await Promise.all([
      banco.registrosHabito.count(),
      banco.tarefas.filter((t) => !!t.feitaEm).count(),
      banco.rituais.filter((r) => !!r.feitoEm).count(),
    ])
    return registros + tarefas + rituais
  }, [])
}

/** Guarda os especiais que o total alcançou e devolve os que acabaram de chegar (para avisar uma vez só). */
export async function guardarEspeciaisNovos(): Promise<NomeAdesivo[]> {
  return banco.transaction('rw', [banco.configuracoes, banco.habitos, banco.registrosHabito, banco.tarefas, banco.rituais], async () => {
    const config = await lerConfig()
    const novos = especiaisNovos(await lerAdesivos(), config.especiais)
    if (!novos.length) return []
    const especiais = { ...config.especiais }
    for (const n of novos) especiais[n.nome] = n.dia
    await banco.configuracoes.put({ chave: CHAVE, valor: { ...config, especiais } })
    return novos.map((n) => n.nome)
  })
}

/** Só os especiais ganhos (para escolher o adesivo de um hábito). */
export function useEspeciaisGanhos(): EspeciaisGanhos | undefined {
  return useLiveQuery(async () => (await lerConfig()).especiais, [])
}
