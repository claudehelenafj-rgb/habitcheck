// Modo foco no banco local: a sessão em andamento fica na tabela configuracoes (chave "foco"),
// para continuar certa depois de recarregar ou trocar de tela. No fim, vira um registro em sessoesFoco
// e os minutos somam no "quanto levou" da tarefa.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal } from '../logica/datas'
import { terminarFoco, type EstadoFoco, type SessaoFoco } from '../logica/foco'
import { banco, novoId } from './banco'

const CHAVE = 'foco'

async function lerFoco(): Promise<EstadoFoco | null> {
  return ((await banco.configuracoes.get(CHAVE))?.valor as EstadoFoco | undefined) ?? null
}

export function useEstadoFoco(): EstadoFoco | null | undefined {
  return useLiveQuery(lerFoco, [])
}

export async function guardarFoco(e: EstadoFoco) {
  await banco.configuracoes.put({ chave: CHAVE, valor: e })
}

/** Muda a partir do que está guardado agora (cliques rápidos não se atropelam). */
export async function mudarFoco(mudar: (e: EstadoFoco) => EstadoFoco) {
  await banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerFoco()
    if (atual) await guardarFoco(mudar(atual))
  })
}

/** Marca que a fase que começou em `faseInicio` já avisou. Devolve true só para quem marcou primeiro. */
export async function marcarAvisoFoco(faseInicio: string): Promise<boolean> {
  return banco.transaction('rw', banco.configuracoes, async () => {
    const atual = await lerFoco()
    if (!atual || atual.faseInicio !== faseInicio || atual.avisadoEm === faseInicio) return false
    await guardarFoco({ ...atual, avisadoEm: faseInicio })
    return true
  })
}

export type FimDoFoco = {
  concluir: boolean
  /** texto do passo "continuar de…" que entra na tarefa, quando ela não terminou */
  passoOndeParei?: string
}

/** Guarda a sessão, soma os minutos na tarefa (e conclui, se for o caso) e encerra o modo foco. */
export async function encerrarFoco({ concluir, passoOndeParei }: FimDoFoco, agora = new Date()): Promise<SessaoFoco | undefined> {
  return banco.transaction('rw', banco.configuracoes, banco.sessoesFoco, banco.tarefas, async () => {
    const atual = await lerFoco()
    if (!atual) return undefined
    const e = terminarFoco(atual, agora)
    const minutos = Math.round(e.focoMin)
    let sessao: SessaoFoco | undefined
    if (minutos >= 1) {
      sessao = {
        id: novoId(),
        dia: diaLocal(new Date(e.comecouEm)),
        inicio: e.comecouEm,
        fim: agora.toISOString(),
        minutos,
        ...(e.tarefaId ? { tarefaId: e.tarefaId } : {}),
        ...(e.estimativaMin ? { estimativaMin: e.estimativaMin } : {}),
      }
      await banco.sessoesFoco.add(sessao)
    }
    const tarefa = e.tarefaId ? await banco.tarefas.get(e.tarefaId) : undefined
    if (tarefa) {
      const passos = [...tarefa.passos]
      if (!concluir && passoOndeParei?.trim()) {
        // entra como o próximo passo, antes dos que ainda faltam
        const primeiroAberto = passos.findIndex((p) => !p.feito)
        passos.splice(primeiroAberto < 0 ? passos.length : primeiroAberto, 0, { id: novoId(), texto: passoOndeParei.trim(), feito: false })
      }
      await banco.tarefas.update(tarefa.id, {
        realMin: (tarefa.realMin ?? 0) + minutos,
        passos,
        ...(concluir && !tarefa.feitaEm ? { feitaEm: agora.toISOString(), feitaNoDia: diaLocal(agora) } : {}),
      })
    }
    await banco.configuracoes.delete(CHAVE)
    return sessao
  })
}

/** Sai do modo foco sem guardar nada. */
export async function descartarFoco() {
  await banco.configuracoes.delete(CHAVE)
}

export function useSessoesFoco(): SessaoFoco[] | undefined {
  return useLiveQuery(() => banco.sessoesFoco.toArray(), [])
}

/** O que a pessoa escolheu da última vez (movimento antes, tela cheia, sino), para não repetir a cada sessão. */
export type EscolhasFoco = { mexer: boolean; telaCheia: boolean; som: boolean }
const CHAVE_ESCOLHAS = 'focoEscolhas'
const ESCOLHAS_PADRAO: EscolhasFoco = { mexer: false, telaCheia: true, som: true }

export function useEscolhasFoco(): EscolhasFoco | undefined {
  return useLiveQuery(
    async () => ({ ...ESCOLHAS_PADRAO, ...((await banco.configuracoes.get(CHAVE_ESCOLHAS))?.valor as Partial<EscolhasFoco> | undefined) }),
    [],
  )
}

export async function guardarEscolhasFoco(escolhas: EscolhasFoco) {
  await banco.configuracoes.put({ chave: CHAVE_ESCOLHAS, valor: escolhas })
}
