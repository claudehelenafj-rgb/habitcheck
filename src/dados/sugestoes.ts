// Sugestões escolhidas ("Vou fazer") e a resposta de "ajudou?", guardadas no aparelho.

import { useLiveQuery } from 'dexie-react-hooks'
import { diaLocal } from '../logica/datas'
import type { Candidato, RegistroSugestao, Resposta } from '../logica/sugestoes'
import { banco, novoId } from './banco'
import { registrarVez } from './hobbies'

/** Histórico das escolhas (as respostas de "ajudou?" decidem a ordem das próximas ideias). undefined = carregando. */
export function useHistoricoSugestoes(): RegistroSugestao[] | undefined {
  return useLiveQuery(() => banco.sugestoes.toArray(), [])
}

export async function escolherSugestao(c: Candidato, agora = new Date()): Promise<RegistroSugestao> {
  const r: RegistroSugestao = {
    id: novoId(),
    chave: c.chave,
    texto: c.texto,
    origem: c.origem,
    ...(c.hobbyId ? { hobbyId: c.hobbyId } : {}),
    quando: agora.toISOString(),
    dia: diaLocal(agora),
  }
  await banco.sugestoes.add(r)
  return r
}

/**
 * Guarda a resposta. Se a ideia era um hobby, responder quer dizer que ele aconteceu:
 * registra uma vez do hobby no dia da escolha. Devolve o id dessa vez (para o "Desfazer").
 */
export async function responderSugestao(id: string, resposta: Resposta, agora = new Date()): Promise<string | undefined> {
  const r = await banco.sugestoes.get(id)
  if (!r) return undefined
  await banco.sugestoes.update(id, { resposta })
  if (r.hobbyId && (await banco.hobbies.get(r.hobbyId))) {
    const ja = await banco.vezesHobby.where('hobbyId').equals(r.hobbyId).filter((v) => v.dia === r.dia).count()
    if (!ja) return (await registrarVez(r.hobbyId, r.dia === diaLocal(agora) ? agora : new Date(`${r.dia}T12:00:00`))).id
  }
  return undefined
}

export async function dispensarSugestao(id: string) {
  await banco.sugestoes.update(id, { dispensada: true })
}

export async function desfazerResposta(id: string, vezId?: string) {
  await banco.sugestoes.update(id, { resposta: undefined, dispensada: undefined })
  if (vezId) await banco.vezesHobby.delete(vezId)
}

export async function apagarEscolha(id: string) {
  await banco.sugestoes.delete(id)
}
