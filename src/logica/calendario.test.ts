import { describe, expect, it } from 'vitest'
import { doDia, gradeDoMes, mesclarImportacao, ocorrencias, type Evento } from './calendario'

function evento(dados: Partial<Evento>): Evento {
  return {
    id: 'e1',
    titulo: 'Evento',
    inicio: new Date(2026, 10, 2, 19).toISOString(),
    fim: new Date(2026, 10, 2, 21).toISOString(),
    diaInteiro: false,
    origem: 'caderninho',
    criadoEm: '',
    ...dados,
  }
}

describe('ocorrências', () => {
  it('evento simples aparece só no seu dia', () => {
    const l = ocorrencias([evento({})], '2026-11-01', '2026-11-07')
    expect(l.map((o) => o.diaInicio)).toEqual(['2026-11-02'])
    expect(ocorrencias([evento({})], '2026-11-03', '2026-11-07')).toHaveLength(0)
  })

  it('semanal em segunda e quarta, 4 vezes', () => {
    const e = evento({ repeticao: { freq: 'WEEKLY', intervalo: 1, vezes: 4, diasSemana: [1, 3] } })
    expect(ocorrencias([e], '2026-11-01', '2026-11-30').map((o) => o.diaInicio)).toEqual(['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11'])
  })

  it('diário pulando exceções, até uma data', () => {
    const e = evento({
      repeticao: { freq: 'DAILY', intervalo: 1, ate: new Date(2026, 10, 5, 23).toISOString() },
      excecoes: [new Date(2026, 10, 3, 19).toISOString()],
    })
    expect(ocorrencias([e], '2026-11-01', '2026-11-30').map((o) => o.diaInicio)).toEqual(['2026-11-02', '2026-11-04', '2026-11-05'])
  })

  it('mensal no dia 31 pula os meses sem dia 31', () => {
    const e = evento({ inicio: new Date(2026, 0, 31, 9).toISOString(), fim: new Date(2026, 0, 31, 10).toISOString(), repeticao: { freq: 'MONTHLY', intervalo: 1, vezes: 3 } })
    expect(ocorrencias([e], '2026-01-01', '2026-12-31').map((o) => o.diaInicio)).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
  })

  it('dia inteiro de vários dias aparece em cada dia, e vem antes dos com hora', () => {
    const viagem = evento({ id: 'v', titulo: 'Viagem', diaInteiro: true, inicio: new Date(2026, 10, 2).toISOString(), fim: new Date(2026, 10, 5).toISOString() })
    const l = ocorrencias([evento({}), viagem], '2026-11-01', '2026-11-30')
    expect(doDia(l, '2026-11-04').map((o) => o.evento.titulo)).toEqual(['Viagem'])
    expect(doDia(l, '2026-11-05')).toHaveLength(0)
    expect(doDia(l, '2026-11-02').map((o) => o.evento.titulo)).toEqual(['Viagem', 'Evento'])
  })
})

describe('grade do mês', () => {
  it('6 semanas de segunda a domingo cobrindo o mês', () => {
    const g = gradeDoMes('2026-11-15')
    expect(g).toHaveLength(6)
    expect(g[0][0]).toBe('2026-10-26')
    expect(g[0][6]).toBe('2026-11-01')
    expect(g.flat()).toContain('2026-11-30')
  })
})

describe('importar sem duplicar', () => {
  let n = 0
  const gerar = () => `novo${++n}`
  const base = { titulo: 'Aula', inicio: 'a', fim: 'b', diaInteiro: false, origem: 'apple' as const }

  it('primeira vez cria, segunda vez com mudança atualiza, sem mudança ignora', () => {
    const r1 = mesclarImportacao([], [{ ...base, uidExterno: 'u1' }], gerar, 'agora')
    expect(r1.resultado).toEqual({ novos: 1, atualizados: 0, ignorados: 0 })
    const salvo = r1.salvar
    const r2 = mesclarImportacao(salvo, [{ ...base, uidExterno: 'u1', titulo: 'Aula (sala nova)' }], gerar, 'depois')
    expect(r2.resultado).toEqual({ novos: 0, atualizados: 1, ignorados: 0 })
    expect(r2.salvar[0].id).toBe(salvo[0].id)
    const r3 = mesclarImportacao(r2.salvar, [{ ...base, uidExterno: 'u1', titulo: 'Aula (sala nova)' }], gerar, 'depois')
    expect(r3.resultado).toEqual({ novos: 0, atualizados: 0, ignorados: 1 })
  })

  it('o mesmo evento repetido no arquivo entra uma vez só', () => {
    const r = mesclarImportacao([], [{ ...base, uidExterno: 'u2' }, { ...base, uidExterno: 'u2' }], gerar, 'agora')
    expect(r.resultado.novos).toBe(1)
    expect(r.resultado.ignorados).toBe(1)
  })
})
