import { describe, expect, it } from 'vitest'
import type { Checkin } from './checkin'
import { idDose, type RegistroDose, type Remedio } from './remedios'
import { resumoCheckins, resumoDoses, resumoSintomasDetalhado } from './resumo'
import type { RegistroSintoma } from './sintomas'

const ck = (dia: string, hora: string, ansiedade: number, irritacao: number, energia: number, sinais?: string[]): Checkin => ({
  id: dia + hora,
  quando: `${dia}T${hora}:00.000Z`,
  dia,
  ansiedade,
  irritacao,
  energia,
  sinais,
})

describe('resumo dos check-ins', () => {
  it('médias, o maior de cada dia e os dias com 7 a 10', () => {
    const r = resumoCheckins([
      ck('2026-10-27', '10:00', 3, 1, 6, ['barriga']),
      ck('2026-10-27', '20:00', 8, 2, 3, ['ombros tensos', 'barriga']),
      ck('2026-10-28', '10:00', 2, 2, 7),
    ])
    expect(r).toMatchObject({ total: 3, dias: 2, diasAltos: 1, medias: { ansiedade: 4.3, irritacao: 1.7, energia: 5.3 } })
    expect(r.porDia[0]).toEqual({ dia: '2026-10-27', ansiedade: 8, irritacao: 2, energia: 4.5, sinais: ['barriga', 'ombros tensos'] })
  })
})

describe('resumo dos sintomas', () => {
  const s = (dia: string, sintoma: string, intensidade: number, extra: Partial<RegistroSintoma> = {}): RegistroSintoma => ({
    id: dia + sintoma + intensidade,
    quando: `${dia}T12:00:00.000Z`,
    dia,
    sintoma,
    intensidade,
    porques: [],
    ajudou: [],
    ...extra,
  })
  it('agrupa por sintoma (vezes, média e maior) e separa os marcados como possível efeito do remédio', () => {
    const r = resumoSintomasDetalhado([
      s('2026-10-20', 'ansiedade', 6, { porques: ['prazo', 'não sei'] }),
      s('2026-10-22', 'ansiedade', 9, { porques: ['prazo'], ajudou: ['caminhar'] }),
      s('2026-10-23', 'sem apetite', 5, { efeitoRemedio: true }),
    ])
    expect(r.porSintoma).toEqual([
      { nome: 'ansiedade', vezes: 2, media: 7.5, maior: 9 },
      { nome: 'sem apetite', vezes: 1, media: 5, maior: 5 },
    ])
    expect(r.porques).toEqual([{ nome: 'prazo', vezes: 2 }])
    expect(r.efeitoRemedio.map((x) => x.sintoma)).toEqual(['sem apetite'])
  })
})

describe('resumo das doses', () => {
  const remedio: Remedio = {
    id: 'r',
    nome: 'R',
    horarios: ['08:00', '20:00'],
    repetir: { vezes: 0, intervaloMin: 10 },
    ativo: true,
    criadoEm: new Date(2026, 9, 26, 12, 0).toISOString(),
  }
  const reg = (dia: string, horario: string, status: RegistroDose['status']): RegistroDose => ({
    id: idDose('r', dia, horario),
    remedioId: 'r',
    dia,
    horario,
    status,
    avisos: 0,
  })
  it('conta só as doses que já deveriam ter acontecido, depois do cadastro', () => {
    const registros = [reg('2026-10-26', '20:00', 'tomei'), reg('2026-10-27', '08:00', 'tomei'), reg('2026-10-27', '20:00', 'pulei'), reg('2026-10-28', '08:00', 'tomei')]
    // de 26 (cadastro ao meio-dia: só a das 20h) até 28 às 15h (a das 20h ainda não chegou)
    const [r] = resumoDoses([remedio], registros, '2026-10-20', '2026-10-28', new Date(2026, 9, 28, 15, 0))
    expect(r).toMatchObject({ previstas: 4, tomadas: 3, puladas: 1, semResposta: 0 })
    const [semResp] = resumoDoses([remedio], registros.slice(0, 2), '2026-10-20', '2026-10-28', new Date(2026, 9, 28, 15, 0))
    expect(semResp).toMatchObject({ previstas: 4, tomadas: 2, semResposta: 2 })
  })
})
