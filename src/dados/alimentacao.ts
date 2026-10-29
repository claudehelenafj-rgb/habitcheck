// Alimentação no banco local: a configuração (refeições, horários, lembretes e quantos copos de água),
// guardada em configuracoes, chave "alimentacao", e um registro por dia (refeições marcadas e copos).

import { useLiveQuery } from 'dexie-react-hooks'
import type { IdArea } from '../design/areas'
import {
  alternarRefeicao,
  CONFIG_ALIMENTACAO_PADRAO,
  diaVazio,
  tocarCopo,
  type ConfigAlimentacao,
  type DiaAlimentacao,
  type IdRefeicao,
} from '../logica/alimentacao'
import type { Dia } from '../logica/datas'
import { banco } from './banco'

const CHAVE = 'alimentacao'

async function lerConfig(): Promise<ConfigAlimentacao> {
  const guardada = (await banco.configuracoes.get(CHAVE))?.valor as Partial<ConfigAlimentacao> | undefined
  return { ...CONFIG_ALIMENTACAO_PADRAO, ...guardada }
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
