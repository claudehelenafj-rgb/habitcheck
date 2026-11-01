import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Candidato } from '../logica/sugestoes'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { criarHobby, registrarVez } from './hobbies'
import { desfazerResposta, dispensarSugestao, escolherSugestao, responderSugestao } from './sugestoes'

const atividade: Candidato = { chave: 'atividade:agua', texto: 'Beber água', origem: 'atividade', energia: 'baixa', acalma: true }

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('escolher e responder', () => {
  it('guarda a escolha e depois a resposta', async () => {
    const r = await escolherSugestao(atividade, new Date(2026, 9, 28, 15, 0))
    expect(r.dia).toBe('2026-10-28')
    expect(await responderSugestao(r.id, 'sim')).toBeUndefined()
    expect((await banco.sugestoes.get(r.id))?.resposta).toBe('sim')
  })

  it('responder sobre um hobby registra que ele aconteceu, uma vez só por dia; desfazer tira', async () => {
    const h = await criarHobby({ nome: 'violão', adesivo: 'musica', frequencia: { vezes: 2, por: 'semana' } })
    const c: Candidato = { chave: `hobby:${h.id}`, texto: 'violão', origem: 'hobby', energia: 'media', acalma: false, hobbyId: h.id }
    const r = await escolherSugestao(c)
    const vezId = await responderSugestao(r.id, 'maisOuMenos')
    expect(vezId).toBeDefined()
    expect(await banco.vezesHobby.count()).toBe(1)
    await desfazerResposta(r.id, vezId)
    expect(await banco.vezesHobby.count()).toBe(0)
    expect((await banco.sugestoes.get(r.id))?.resposta).toBeUndefined()
    // se o hobby já foi registrado no dia, não duplica
    await registrarVez(h.id)
    expect(await responderSugestao(r.id, 'sim')).toBeUndefined()
    expect(await banco.vezesHobby.count()).toBe(1)
  })

  it('"Não fiz" dispensa sem contar como resposta', async () => {
    const r = await escolherSugestao(atividade)
    await dispensarSugestao(r.id)
    const salvo = await banco.sugestoes.get(r.id)
    expect(salvo?.dispensada).toBe(true)
    expect(salvo?.resposta).toBeUndefined()
  })

  it('a tabela de sugestões está marcada como dado de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toContain('sugestoes')
  })
})
