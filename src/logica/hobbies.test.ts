import { describe, expect, it } from 'vitest'
import { intervaloIdeal, ordenar, situacao, vezesNoPeriodo, type Hobby, type VezHobby } from './hobbies'

const hobby = (extra: Partial<Hobby> = {}): Hobby => ({
  id: 'h',
  nome: 'violão',
  adesivo: 'musica',
  frequencia: { vezes: 2, por: 'semana' },
  criadoEm: '2026-10-01T12:00:00.000Z',
  motivos: [],
  ...extra,
})
const vez = (dia: string): VezHobby => ({ id: dia, hobbyId: 'h', dia, quando: `${dia}T15:00:00.000Z` })

describe('intervalo combinado', () => {
  it('2 por semana = 3,5 dias; 1 por mês = 30', () => {
    expect(intervaloIdeal({ vezes: 2, por: 'semana' })).toBe(3.5)
    expect(intervaloIdeal({ vezes: 1, por: 'mes' })).toBe(30)
  })
})

describe('situação do hobby', () => {
  it('em dia quando aconteceu dentro do intervalo', () => {
    expect(situacao(hobby(), [vez('2026-10-26')], '2026-10-28', '2026-10-01')).toEqual({ tipo: 'emDia', dias: 2 })
  })

  it('de lado desbota aos poucos: passou do intervalo, depois do dobro', () => {
    expect(situacao(hobby(), [vez('2026-10-24')], '2026-10-28', '2026-10-01')).toMatchObject({ tipo: 'deLado', dias: 4, desbote: 1 })
    expect(situacao(hobby(), [vez('2026-10-20')], '2026-10-28', '2026-10-01')).toMatchObject({ tipo: 'deLado', dias: 8, desbote: 2 })
    // exatamente o dobro ainda é "um pouco"; só passa a desbotar mais depois do dobro
    expect(situacao(hobby(), [vez('2026-10-21')], '2026-10-28', '2026-10-01')).toMatchObject({ dias: 7, desbote: 1 })
  })

  it('hobby novo, sem nenhuma vez, conta desde que foi criado', () => {
    expect(situacao(hobby(), [], '2026-10-03', '2026-10-01')).toEqual({ tipo: 'emDia', dias: null })
    expect(situacao(hobby(), [], '2026-10-10', '2026-10-01')).toMatchObject({ tipo: 'deLado', dias: 9 })
  })

  it('pausado de propósito não desbota, e a contagem recomeça quando a pausa acaba', () => {
    const h = hobby({ pausadoAte: '2026-10-25' })
    expect(situacao(h, [vez('2026-10-01')], '2026-10-20', '2026-10-01')).toEqual({ tipo: 'pausado', ate: '2026-10-25' })
    expect(situacao(h, [vez('2026-10-01')], '2026-10-28', '2026-10-01')).toEqual({ tipo: 'emDia', dias: 27 })
  })

  it('arquivado fica fora', () => {
    expect(situacao(hobby({ arquivadoEm: '2026-10-10T10:00:00Z' }), [], '2026-10-28', '2026-10-01')).toEqual({ tipo: 'arquivado' })
  })

  it('mostra o porquê anotado depois da última vez; um porquê antigo não vale mais', () => {
    const motivo = { dia: '2026-10-22', etiquetas: ['sem energia'] }
    expect(situacao(hobby({ motivos: [motivo] }), [vez('2026-10-15')], '2026-10-28', '2026-10-01')).toMatchObject({ motivo })
    const s = situacao(hobby({ motivos: [{ dia: '2026-10-10', etiquetas: ['sem tempo'] }] }), [vez('2026-10-15')], '2026-10-28', '2026-10-01')
    expect(s).toMatchObject({ tipo: 'deLado' })
    expect(s.tipo === 'deLado' && s.motivo).toBeUndefined()
  })
})

describe('contagens e ordem', () => {
  it('conta as vezes da semana (segunda a domingo) ou do mês', () => {
    const vezes = [vez('2026-10-25'), vez('2026-10-26'), vez('2026-10-28')]
    expect(vezesNoPeriodo({ vezes: 2, por: 'semana' }, vezes, '2026-10-28', '2026-10-26')).toBe(2)
    expect(vezesNoPeriodo({ vezes: 4, por: 'mes' }, vezes, '2026-10-28', '2026-10-26')).toBe(3)
  })

  it('de lado primeiro, quem está parado há mais tempo antes', () => {
    const itens = [
      { hobby: hobby({ nome: 'a' }), situacao: { tipo: 'emDia', dias: 1 } as const },
      { hobby: hobby({ nome: 'b' }), situacao: { tipo: 'deLado', dias: 5, desbote: 1 } as const },
      { hobby: hobby({ nome: 'c' }), situacao: { tipo: 'pausado', ate: '2026-11-01' } as const },
      { hobby: hobby({ nome: 'd' }), situacao: { tipo: 'deLado', dias: 12, desbote: 2 } as const },
    ]
    expect(ordenar(itens).map((i) => i.hobby.nome)).toEqual(['d', 'b', 'a', 'c'])
  })
})
