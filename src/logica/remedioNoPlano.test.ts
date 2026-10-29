import { describe, expect, it } from 'vitest'
import { dentroDoEfeito, janelasDeHoje } from './remedioNoPlano'
import { dosesDoDia, type Remedio } from './remedios'

const remedio = (id: string, horarios: string[], efeito?: Remedio['efeito']): Remedio => ({
  id,
  nome: id,
  horarios,
  repetir: { vezes: 0, intervaloMin: 10 },
  ativo: true,
  criadoEm: '2026-10-01T00:00:00.000Z',
  efeito,
})

describe('janela de mais efeito', () => {
  it('dentro e fora, inclusive atravessando a meia-noite', () => {
    const manha = { de: '09:00', ate: '13:00' }
    expect(dentroDoEfeito(manha, new Date(2026, 9, 29, 9, 0))).toBe(true)
    expect(dentroDoEfeito(manha, new Date(2026, 9, 29, 13, 0))).toBe(false)
    const noite = { de: '22:00', ate: '02:00' }
    expect(dentroDoEfeito(noite, new Date(2026, 9, 29, 23, 30))).toBe(true)
    expect(dentroDoEfeito(noite, new Date(2026, 9, 29, 1, 0))).toBe(true)
    expect(dentroDoEfeito(noite, new Date(2026, 9, 29, 12, 0))).toBe(false)
  })

  it('uma janela por remédio de hoje, em ordem de horário', () => {
    const doses = dosesDoDia(
      [remedio('B', ['08:00', '14:00'], { de: '15:00', ate: '18:00' }), remedio('A', ['07:00'], { de: '08:00', ate: '12:00' }), remedio('C', ['21:00'])],
      '2026-10-29',
    )
    expect(janelasDeHoje(doses).map((j) => j.nome)).toEqual(['A', 'B'])
  })
})
