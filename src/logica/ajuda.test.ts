import { describe, expect, it } from 'vitest'
import { motivoParaAjuda } from './ajuda'
import type { Checkin } from './checkin'
import { somarDias } from './datas'
import type { Hobby } from './hobbies'
import type { RegistroSintoma } from './sintomas'

const hoje = '2026-10-29'
const checkin = (i: number, ansiedade: number, energia = 5): Checkin => {
  const dia = somarDias(hoje, -i)
  return { id: dia, quando: `${dia}T15:00:00.000Z`, dia, ansiedade, irritacao: 0, energia }
}
const sintoma = (i: number, nome: string, intensidade: number): RegistroSintoma => {
  const dia = somarDias(hoje, -i)
  return { id: `${dia}${nome}`, quando: '', dia, sintoma: nome, intensidade, porques: [], ajudou: [] }
}
const hobby = (motivoDia: string, etiqueta: string): Hobby => ({
  id: 'h',
  nome: 'crochê',
  adesivo: 'novelo',
  frequencia: { vezes: 1, por: 'semana' },
  criadoEm: '',
  motivos: [{ dia: motivoDia, etiquetas: [etiqueta] }],
})

describe('quando sugerir conversar com um profissional', () => {
  it('ansiedade, irritação ou tristeza alta na maioria dos últimos 14 dias', () => {
    const pesados = [0, 1, 2, 3, 5, 7].map((i) => checkin(i, 8))
    const tristes = [9, 11].map((i) => sintoma(i, 'tristeza', 7))
    expect(motivoParaAjuda([...pesados], [...tristes], [], hoje)).toBe('diasPesados')
    expect(motivoParaAjuda(pesados.slice(1), tristes, [], hoje)).toBeNull() // 7 de 14 ainda não é a maioria
  })

  it('dias pesados de mais de 2 semanas atrás não contam', () => {
    expect(motivoParaAjuda([14, 15, 16, 17, 18, 19, 20, 21].map((i) => checkin(i, 9)), [], [], hoje)).toBeNull()
  })

  it('hobby parado por "sem energia" junto com humor baixo', () => {
    const baixos = [0, 2, 4, 6, 8].map((i) => checkin(i, 3, 2))
    expect(motivoParaAjuda(baixos, [], [hobby('2026-10-25', 'sem energia')], hoje)).toBe('hobbiesSemEnergia')
    expect(motivoParaAjuda(baixos, [], [hobby('2026-10-25', 'sem tempo')], hoje)).toBeNull()
    expect(motivoParaAjuda(baixos.slice(1), [], [hobby('2026-10-25', 'perdi a vontade')], hoje)).toBeNull()
  })

  it('depois de fechado, não volta antes de 30 dias', () => {
    const pesados = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => checkin(i, 9))
    expect(motivoParaAjuda(pesados, [], [], hoje, '2026-10-20')).toBeNull()
    expect(motivoParaAjuda(pesados, [], [], hoje, '2026-09-20')).toBe('diasPesados')
  })
})
