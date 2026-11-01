import { describe, expect, it } from 'vitest'
import type { Checkin } from './checkin'
import type { RegistroSintoma } from './sintomas'
import {
  ATIVIDADES_INICIAIS,
  contexto,
  juntarCandidatos,
  nivelEnergia,
  pendente,
  sugerir,
  type Candidato,
  type Contexto,
  type RegistroSugestao,
} from './sugestoes'

const agora = new Date('2026-10-28T17:30:00.000Z')
const hoje = '2026-10-28'
const checkin = (quando: string, ansiedade: number, energia: number): Checkin => ({
  id: quando,
  quando,
  dia: hoje,
  ansiedade,
  irritacao: 0,
  energia,
})
const sintoma = (quando: string, intensidade: number): RegistroSintoma => ({
  id: quando,
  quando,
  dia: hoje,
  sintoma: 'ansiedade',
  intensidade,
  porques: [],
  ajudou: [],
})
const cand = (chave: string, energia: Candidato['energia'], acalma = false, extra: Partial<Candidato> = {}): Candidato => ({
  chave,
  texto: chave,
  origem: 'atividade',
  energia,
  acalma,
  ...extra,
})
const reg = (chave: string, resposta: RegistroSugestao['resposta'], dia = '2026-10-20', quando = `${dia}T12:00:00.000Z`): RegistroSugestao => ({
  id: `${chave}${quando}`,
  chave,
  texto: chave,
  origem: 'atividade',
  quando,
  dia,
  resposta,
})

describe('contexto do momento', () => {
  it('energia pelas faixas do check-in', () => {
    expect([0, 3, 4, 6, 7, 10].map(nivelEnergia)).toEqual(['baixa', 'baixa', 'media', 'media', 'alta', 'alta'])
  })

  it('usa o check-in recente: energia e tensão', () => {
    expect(contexto(checkin('2026-10-28T16:00:00.000Z', 8, 2), undefined, agora)).toMatchObject({
      energia: 'baixa',
      tensaoAlta: true,
      origem: 'checkin',
    })
  })

  it('um sintoma mais novo que o check-in vale mais, mas não diz a energia', () => {
    expect(contexto(checkin('2026-10-28T15:00:00.000Z', 2, 8), sintoma('2026-10-28T17:00:00.000Z', 7), agora)).toEqual({
      tensaoAlta: true,
      origem: 'sintoma',
      quando: '2026-10-28T17:00:00.000Z',
    })
  })

  it('registro de mais de 4 horas atrás não conta como agora', () => {
    expect(contexto(checkin('2026-10-28T13:00:00.000Z', 9, 9), undefined, agora).origem).toBe('nenhum')
  })
})

describe('escolher as ideias', () => {
  const ctx: Contexto = { energia: 'media', tensaoAlta: false, origem: 'checkin' }

  it('nunca pede mais energia do que a pessoa tem; sem energia conhecida, assume baixa', () => {
    const lista = [cand('a', 'baixa'), cand('b', 'media'), cand('c', 'alta')]
    expect(sugerir(lista, ctx, [], hoje).map((c) => c.chave)).toEqual(['a', 'b'])
    expect(sugerir(lista, { tensaoAlta: false, origem: 'nenhum' }, [], hoje).map((c) => c.chave)).toEqual(['a'])
  })

  it('o que já ajudou sobe; o que não ajudou desce', () => {
    const lista = [cand('a', 'baixa'), cand('b', 'baixa'), cand('c', 'baixa')]
    const historico = [reg('c', 'sim'), reg('c', 'sim'), reg('a', 'nao')]
    expect(sugerir(lista, ctx, historico, hoje).map((c) => c.chave)).toEqual(['c', 'b', 'a'])
  })

  it('com tensão alta, prefere o que acalma', () => {
    const lista = [cand('agitado', 'baixa'), cand('calmo', 'baixa', true)]
    expect(sugerir(lista, { ...ctx, tensaoAlta: true }, [], hoje)[0].chave).toBe('calmo')
  })

  it('hobby parado há mais tempo e o que ajudou nos sintomas ganham pontos', () => {
    const lista = [cand('x', 'baixa'), cand('hobby', 'media', false, { atraso: 2.5 }), cand('ajudou', 'baixa', true, { vezesAjudou: 1 })]
    expect(sugerir(lista, ctx, [], hoje).map((c) => c.chave)).toEqual(['hobby', 'ajudou', 'x'])
  })

  it('escolhida hoje perde a vez para variar', () => {
    const lista = [cand('a', 'baixa'), cand('b', 'baixa')]
    expect(sugerir(lista, ctx, [reg('a', undefined, hoje, `${hoje}T10:00:00.000Z`)], hoje)[0].chave).toBe('b')
  })

  it('"Outras ideias" mostra as próximas e depois volta ao começo', () => {
    const lista = ['a', 'b', 'c', 'd', 'e'].map((k) => cand(k, 'baixa'))
    expect(sugerir(lista, ctx, [], hoje, 3, 1).map((c) => c.chave)).toEqual(['d', 'e'])
    expect(sugerir(lista, ctx, [], hoje, 3, 2).map((c) => c.chave)).toEqual(['a', 'b', 'c'])
  })
})

describe('juntar as fontes', () => {
  it('não repete o mesmo texto e marca a origem', () => {
    const lista = juntarCandidatos(
      ATIVIDADES_INICIAIS.slice(0, 2),
      [{ id: 'h1', nome: 'violão', adesivo: 'musica', atraso: 1 }],
      [
        { nome: 'Respirar devagar por 3 minutos', vezes: 2 },
        { nome: 'silêncio', vezes: 3 },
      ],
    )
    expect(lista.map((c) => c.origem)).toEqual(['hobby', 'atividade', 'atividade', 'ajudou'])
    expect(lista.at(-1)).toMatchObject({ chave: 'ajudou:silêncio', energia: 'baixa', vezesAjudou: 3 })
  })
})

describe('"ajudou?" esperando resposta', () => {
  it('a escolha mais recente de hoje ou de ontem, sem resposta e não dispensada', () => {
    const historico: RegistroSugestao[] = [
      reg('velha', undefined, '2026-10-20'),
      reg('ontem', undefined, '2026-10-27'),
      { ...reg('hoje-respondida', 'sim', hoje), quando: `${hoje}T11:00:00.000Z` },
      { ...reg('hoje-dispensada', undefined, hoje), dispensada: true },
    ]
    expect(pendente(historico, hoje, '2026-10-27')?.chave).toBe('ontem')
  })
})
