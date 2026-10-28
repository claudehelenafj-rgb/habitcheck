import { describe, expect, it } from 'vitest'
import { etiqueta, limitesDoMes, maiorPorDia, maisFrequentes, nivel, resumoDoMes, type RegistroSintoma } from './sintomas'

const r = (dia: string, sintoma: string, intensidade: number, extra: Partial<RegistroSintoma> = {}): RegistroSintoma => ({
  id: `${dia}-${sintoma}-${intensidade}`,
  quando: `${dia}T12:00:00.000Z`,
  dia,
  sintoma,
  intensidade,
  porques: [],
  ajudou: [],
  ...extra,
})

describe('bolinhas do mês', () => {
  it('nível pela intensidade, e dia sem registro fica neutro', () => {
    expect([undefined, 0, 3, 4, 6, 7, 10].map(nivel)).toEqual([0, 1, 1, 2, 2, 3, 3])
  })

  it('usa a maior intensidade do dia', () => {
    const mapa = maiorPorDia([r('2026-10-02', 'cansaço', 3), r('2026-10-02', 'ansiedade', 8), r('2026-10-05', 'choro', 2)])
    expect(mapa.get('2026-10-02')).toBe(8)
    expect(mapa.get('2026-10-05')).toBe(2)
    expect(mapa.has('2026-10-03')).toBe(false)
  })
})

describe('o que mais se repete', () => {
  it('conta, ordena e corta no limite; empate em ordem alfabética', () => {
    expect(maisFrequentes(['b', 'a', 'b', 'c', 'a', 'b', 'd'], 2)).toEqual([
      { nome: 'b', vezes: 3 },
      { nome: 'a', vezes: 2 },
    ])
  })

  it('resumo do mês ignora "não sei" nos porquês e conta possíveis efeitos do remédio', () => {
    const lista = [
      r('2026-10-02', 'ansiedade', 7, { porques: ['prazo', 'dormi mal'], ajudou: ['caminhar'] }),
      r('2026-10-02', 'cansaço', 4, { porques: ['dormi mal'], efeitoRemedio: true }),
      r('2026-10-09', 'ansiedade', 5, { porques: ['não sei'], ajudou: ['caminhar', 'água'] }),
    ]
    const resumo = resumoDoMes(lista)
    expect(resumo.registros).toBe(3)
    expect(resumo.dias).toBe(2)
    expect(resumo.sintomas[0]).toEqual({ nome: 'ansiedade', vezes: 2 })
    expect(resumo.porques.map((p) => p.nome)).toEqual(['dormi mal', 'prazo'])
    expect(resumo.ajudou[0]).toEqual({ nome: 'caminhar', vezes: 2 })
    expect(resumo.efeitoRemedio).toBe(1)
  })
})

describe('datas e etiquetas', () => {
  it('limites do mês, inclusive fevereiro de ano bissexto', () => {
    expect(limitesDoMes('2026-10-28')).toEqual(['2026-10-01', '2026-10-31'])
    expect(limitesDoMes('2028-02-10')).toEqual(['2028-02-01', '2028-02-29'])
    expect(limitesDoMes('2026-11-30')).toEqual(['2026-11-01', '2026-11-30'])
  })

  it('normaliza o que a pessoa digita', () => {
    expect(etiqueta('  Dor  de   CABEÇA ')).toBe('dor de cabeça')
  })
})
