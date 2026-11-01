import { describe, expect, it } from 'vitest'
import { somarDias } from './datas'
import {
  dentroDaJanela,
  horaDeDesacelerar,
  minutosDeSono,
  minutosNaCama,
  noiteDaRotina,
  noiteDificil,
  resumoSono,
  sugerirAvaliacao,
  type RegistroSono,
} from './sono'

const noite = (dia: string, extra: Partial<RegistroSono> = {}): RegistroSono => ({
  id: dia,
  noite: dia,
  deitou: '23:00',
  levantou: '07:00',
  demora: 'menos15',
  despertares: 0,
  qualidade: 4,
  registradoEm: `${dia}T10:00:00.000Z`,
  ...extra,
})

describe('horas de sono', () => {
  it('atravessa a meia-noite', () => {
    expect(minutosNaCama('23:30', '07:00')).toBe(450)
    expect(minutosNaCama('01:00', '08:30')).toBe(450)
  })

  it('desconta a demora para pegar no sono (meio da faixa)', () => {
    expect(minutosDeSono({ deitou: '23:00', levantou: '07:00', demora: '30a60' })).toBe(480 - 45)
  })
})

describe('noite difícil', () => {
  it('qualidade ruim, demora de mais de 30 min ou menos de 6 h', () => {
    expect(noiteDificil(noite('2026-10-01'))).toBe(false)
    expect(noiteDificil(noite('2026-10-01', { qualidade: 2 }))).toBe(true)
    expect(noiteDificil(noite('2026-10-01', { demora: '30a60' }))).toBe(true)
    expect(noiteDificil(noite('2026-10-01', { deitou: '02:00', levantou: '07:30' }))).toBe(true)
  })
})

describe('sugestão de avaliação profissional', () => {
  const hoje = '2026-10-29'
  const noites = (n: number, dificeis: number) =>
    Array.from({ length: n }, (_, i) => noite(somarDias(hoje, -1 - i), i < dificeis ? { qualidade: 1 } : {}))

  it('mais da metade das noites difíceis em 3 semanas, com pelo menos 10 anotadas', () => {
    expect(sugerirAvaliacao(noites(12, 7), hoje)).toBe(true)
    expect(sugerirAvaliacao(noites(12, 6), hoje)).toBe(false) // metade não é "a maioria"
    expect(sugerirAvaliacao(noites(9, 9), hoje)).toBe(false) // poucas noites anotadas para dizer
  })

  it('noites de mais de 3 semanas atrás não contam', () => {
    const antigas = Array.from({ length: 12 }, (_, i) => noite(somarDias(hoje, -25 - i), { qualidade: 1 }))
    expect(sugerirAvaliacao(antigas, hoje)).toBe(false)
  })

  it('depois de fechado, só volta 30 dias depois', () => {
    expect(sugerirAvaliacao(noites(12, 12), hoje, '2026-10-10')).toBe(false)
    expect(sugerirAvaliacao(noites(12, 12), hoje, '2026-09-28')).toBe(true)
  })
})

describe('resumo e horários', () => {
  it('médias das noites anotadas', () => {
    const r = resumoSono([noite('2026-10-27'), noite('2026-10-28', { demora: 'mais60', qualidade: 2 })], '2026-10-22')
    expect(r).toEqual({ noites: 2, sonoMedioMin: Math.round((470 + 405) / 2), qualidadeMedia: 3, demoraramMais30: 1 })
    expect(resumoSono([], '2026-10-22')).toBeNull()
  })

  it('de madrugada, a rotina ainda é da noite anterior', () => {
    expect(noiteDaRotina(new Date(2026, 9, 29, 1, 30), '2026-10-29')).toBe('2026-10-28')
    expect(noiteDaRotina(new Date(2026, 9, 29, 21, 0), '2026-10-29')).toBe('2026-10-29')
  })

  it('aviso de desacelerar 30 min antes de deitar, atravessando a meia-noite', () => {
    expect(horaDeDesacelerar('23:00')).toBe('22:30')
    expect(horaDeDesacelerar('00:15')).toBe('23:45')
  })

  it('janela de 30 minutos depois do horário, também perto da meia-noite', () => {
    expect(dentroDaJanela('07:00', new Date(2026, 9, 29, 7, 20))).toBe(true)
    expect(dentroDaJanela('07:00', new Date(2026, 9, 29, 7, 40))).toBe(false)
    expect(dentroDaJanela('07:00', new Date(2026, 9, 29, 6, 50))).toBe(false)
    expect(dentroDaJanela('23:45', new Date(2026, 9, 30, 0, 5))).toBe(true)
  })
})
