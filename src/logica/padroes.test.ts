import { describe, expect, it } from 'vitest'
import type { Checkin } from './checkin'
import { somarDias } from './datas'
import { padroes, type DadosPadroes } from './padroes'
import { idDose, type RegistroDose, type Remedio } from './remedios'
import type { RegistroSintoma } from './sintomas'
import type { RegistroSono } from './sono'

const hoje = '2026-10-29'
const inicio = somarDias(hoje, -28)
const dia = (i: number) => somarDias(inicio, i)
const checkin = (d: string, tensao: number, energia = 5): Checkin => ({ id: d, quando: `${d}T15:00:00.000Z`, dia: d, ansiedade: tensao, irritacao: 0, energia })
const noite = (n: string, curta: boolean): RegistroSono => ({
  id: n,
  noite: n,
  deitou: curta ? '02:00' : '23:00',
  levantou: '07:00',
  demora: 'menos15',
  despertares: 0,
  qualidade: 3,
  registradoEm: '',
})
const vazio: DadosPadroes = { checkins: [], sintomas: [], sonos: [], remedios: [], doses: [], inicio, hoje }

describe('padrões com o sono', () => {
  it('depois de noites curtas, mais tensão e menos energia', () => {
    const checkins: Checkin[] = []
    const sonos: RegistroSono[] = []
    for (let i = 1; i <= 8; i++) {
      const curta = i % 2 === 0
      sonos.push(noite(dia(i - 1), curta))
      checkins.push(checkin(dia(i), curta ? 8 : 4, curta ? 2 : 6))
    }
    const r = padroes({ ...vazio, checkins, sonos })
    expect(r).toContainEqual({ tipo: 'sonoTensao', curto: 8, outros: 4 })
    expect(r).toContainEqual({ tipo: 'sonoEnergia', curto: 2, outros: 6 })
  })

  it('com poucos dias de um lado, não diz nada', () => {
    const sonos = [noite(dia(0), true), noite(dia(1), true), noite(dia(2), false), noite(dia(3), false), noite(dia(4), false)]
    const checkins = [checkin(dia(1), 9), checkin(dia(2), 9), checkin(dia(3), 2), checkin(dia(4), 2), checkin(dia(5), 2)]
    expect(padroes({ ...vazio, checkins, sonos }).filter((p) => p.tipo === 'sonoTensao')).toEqual([])
  })

  it('diferença pequena não vira padrão', () => {
    const checkins: Checkin[] = []
    const sonos: RegistroSono[] = []
    for (let i = 1; i <= 8; i++) {
      sonos.push(noite(dia(i - 1), i % 2 === 0))
      checkins.push(checkin(dia(i), i % 2 === 0 ? 5 : 4))
    }
    expect(padroes({ ...vazio, checkins, sonos }).some((p) => p.tipo === 'sonoTensao')).toBe(false)
  })
})

describe('padrão com as doses', () => {
  it('nos dias com dose sem tomar, mais sintomas anotados', () => {
    const remedio: Remedio = { id: 'r', nome: 'R', horarios: ['08:00'], repetir: { vezes: 0, intervaloMin: 10 }, ativo: true, criadoEm: `${inicio}T00:00:00` }
    const doses: RegistroDose[] = []
    const sintomas: RegistroSintoma[] = []
    for (let i = 0; i < 10; i++) {
      const tomou = i % 2 === 0
      if (tomou) doses.push({ id: idDose('r', dia(i), '08:00'), remedioId: 'r', dia: dia(i), horario: '08:00', status: 'tomei', avisos: 0 })
      else sintomas.push(...[1, 2].map((k) => ({ id: `${i}${k}`, quando: '', dia: dia(i), sintoma: 'cansaço', intensidade: 5, porques: [], ajudou: [] })))
    }
    // depois do dia 10, todas tomadas e sem sintomas
    for (let i = 10; i < 28; i++) doses.push({ id: idDose('r', dia(i), '08:00'), remedioId: 'r', dia: dia(i), horario: '08:00', status: 'tomei', avisos: 0 })
    expect(padroes({ ...vazio, remedios: [remedio], doses, sintomas })).toContainEqual({ tipo: 'doseSintomas', semTomar: 2, tomou: 0 })
  })
})

describe('dia da semana', () => {
  it('o dia com mais tensão, quando se destaca da média', () => {
    // 2026-10-05 é segunda-feira
    const checkins = Array.from({ length: 21 }, (_, i) => {
      const d = somarDias('2026-10-05', i)
      return checkin(d, i % 7 === 0 ? 9 : 3)
    })
    const r = padroes({ ...vazio, checkins, inicio: '2026-10-05' })
    expect(r).toContainEqual(expect.objectContaining({ tipo: 'diaDaSemana', diaSemana: 1, media: 9 }))
  })
})
