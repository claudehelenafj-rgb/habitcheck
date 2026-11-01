import { describe, expect, it } from 'vitest'
import {
  avisosIgnorados,
  deveAvisar,
  diasDaSemana,
  diasDeEstoque,
  dosesDoDia,
  emSilencio,
  estadoDoDia,
  estadoDose,
  idDose,
  precisaComprar,
  proximoAviso,
  textoDoLembrete,
  type RegistroDose,
  type Remedio,
} from './remedios'

const hoje = '2026-10-28' // quarta
const em = (h: number, m = 0, dia = 28) => new Date(2026, 9, dia, h, m)

function remedio(dados: Partial<Remedio> = {}): Remedio {
  return {
    id: 'r1',
    nome: 'Vitamina D',
    horarios: ['08:00', '20:00'],
    repetir: { vezes: 2, intervaloMin: 10 },
    ativo: true,
    criadoEm: '2026-10-01T00:00:00Z',
    ...dados,
  }
}
const reg = (dados: Partial<RegistroDose>): RegistroDose => ({ id: 'x', remedioId: 'r1', dia: hoje, horario: '08:00', avisos: 0, ...dados })

describe('doses do dia', () => {
  it('lista os horários em ordem, sem repetir horário igual', () => {
    const d = dosesDoDia([remedio({ horarios: ['20:00', '08:00', '08:00'] })], hoje)
    expect(d.map((x) => x.horario)).toEqual(['08:00', '20:00'])
    expect(d[0].quando).toEqual(em(8))
  })

  it('respeita os dias da semana e remédios pausados', () => {
    expect(dosesDoDia([remedio({ diasSemana: [1, 5] })], hoje)).toHaveLength(0) // seg e sex
    expect(dosesDoDia([remedio({ diasSemana: [3] })], hoje)).toHaveLength(2) // quarta
    expect(dosesDoDia([remedio({ ativo: false })], hoje)).toHaveLength(0)
  })

  it('o lembrete diz a ação, não só o nome', () => {
    expect(textoDoLembrete(remedio())).toBe('Tomar Vitamina D e marcar no app')
    expect(textoDoLembrete(remedio({ acao: 'Tomar com água depois do café' }))).toBe('Tomar com água depois do café')
  })
})

describe('estado de cada dose', () => {
  const dose = dosesDoDia([remedio()], hoje)[0]
  it('antes da hora, na hora, tomei, pulei e adiada', () => {
    expect(estadoDose(dose, undefined, em(7))).toBe('depois')
    expect(estadoDose(dose, undefined, em(8, 5))).toBe('agora')
    expect(estadoDose(dose, reg({ status: 'tomei' }), em(9))).toBe('tomei')
    expect(estadoDose(dose, reg({ status: 'pulei' }), em(9))).toBe('pulei')
    expect(estadoDose(dose, reg({ status: 'adiada', adiadaAte: em(8, 20).toISOString() }), em(8, 15))).toBe('adiada')
    expect(estadoDose(dose, reg({ status: 'adiada', adiadaAte: em(8, 20).toISOString() }), em(8, 25))).toBe('agora')
  })
})

describe('quando avisar', () => {
  const dose = dosesDoDia([remedio()], hoje)[0]

  it('primeiro aviso no horário, depois repete 2 vezes a cada 10 minutos e para', () => {
    expect(proximoAviso(dose, undefined)).toEqual(em(8))
    expect(proximoAviso(dose, reg({ avisos: 1 }))).toEqual(em(8, 10))
    expect(proximoAviso(dose, reg({ avisos: 2 }))).toEqual(em(8, 20))
    expect(proximoAviso(dose, reg({ avisos: 3 }))).toBeNull()
  })

  it('respondeu: não avisa mais', () => {
    expect(proximoAviso(dose, reg({ status: 'tomei', avisos: 1 }))).toBeNull()
    expect(proximoAviso(dose, reg({ status: 'pulei', avisos: 1 }))).toBeNull()
  })

  it('adiou: avisa quando o adiamento acaba e as repetições recomeçam', () => {
    const adiada = reg({ status: 'adiada', adiadaAte: em(8, 15).toISOString(), avisos: 1, avisosAntesDeAdiar: 1 })
    expect(proximoAviso(dose, adiada)).toEqual(em(8, 15))
    expect(proximoAviso(dose, { ...adiada, avisos: 2 })).toEqual(em(8, 25))
  })

  it('só avisa quando chega a hora, e não acorda avisos de muitas horas atrás', () => {
    expect(deveAvisar(dose, undefined, em(7, 59))).toBe(false)
    expect(deveAvisar(dose, undefined, em(8))).toBe(true)
    expect(deveAvisar(dose, reg({ avisos: 1 }), em(8, 5))).toBe(false)
    expect(deveAvisar(dose, reg({ avisos: 1 }), em(8, 10))).toBe(true)
    expect(deveAvisar(dose, undefined, em(14))).toBe(false)
  })
})

describe('horário de silêncio', () => {
  const noite = { ativo: true, inicio: '22:00', fim: '07:00' }
  it('atravessa a meia-noite', () => {
    expect(emSilencio(em(23), noite)).toBe(true)
    expect(emSilencio(em(3), noite)).toBe(true)
    expect(emSilencio(em(7), noite)).toBe(false)
    expect(emSilencio(em(21, 59), noite)).toBe(false)
    expect(emSilencio(em(23), { ...noite, ativo: false })).toBe(false)
  })

  it('não cala o aviso na hora do remédio, só as repetições', () => {
    const dose = dosesDoDia([remedio({ horarios: ['22:30'] })], hoje)[0]
    expect(proximoAviso(dose, undefined, noite)).toEqual(em(22, 30))
    expect(proximoAviso(dose, reg({ avisos: 1 }), noite)).toBeNull()
  })
})

describe('semana', () => {
  it('vai de segunda a domingo', () => {
    expect(diasDaSemana(hoje)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
    expect(diasDaSemana('2026-11-01')[0]).toBe('2026-10-26') // domingo continua na mesma semana
  })

  it('tomou tudo, parte, nada (neutro) ou ainda não chegou', () => {
    const r = remedio()
    const tomou = (dia: string, h: string): RegistroDose => reg({ id: idDose('r1', dia, h), dia, horario: h, status: 'tomei' })
    const regs = [tomou('2026-10-26', '08:00'), tomou('2026-10-26', '20:00'), tomou('2026-10-27', '08:00')]
    expect(estadoDoDia(r, '2026-10-26', regs, hoje)).toBe('feito')
    expect(estadoDoDia(r, '2026-10-27', regs, hoje)).toBe('minimo')
    expect(estadoDoDia(r, hoje, regs, hoje)).toBe('vazio')
    expect(estadoDoDia(r, '2026-10-29', regs, hoje)).toBe('futuro')
    expect(estadoDoDia(remedio({ diasSemana: [1] }), hoje, regs, hoje)).toBe('nao-toma')
  })
})

describe('estoque', () => {
  it('conta os dias que restam e avisa a tempo de comprar', () => {
    const r = remedio({ estoque: { quantidade: 20, porDose: 1, avisarComDias: 7 } }) // 2 por dia
    expect(diasDeEstoque(r)).toBe(10)
    expect(precisaComprar(r)).toBe(false)
    expect(precisaComprar({ ...r, estoque: { ...r.estoque!, quantidade: 14 } })).toBe(true)
  })

  it('considera remédios que não são todo dia', () => {
    const r = remedio({ horarios: ['08:00'], diasSemana: [1, 3, 5], estoque: { quantidade: 6, porDose: 1, avisarComDias: 3 } })
    expect(diasDeEstoque(r)).toBe(14) // 3 por semana
  })

  it('sem estoque cadastrado, não avisa', () => {
    expect(diasDeEstoque(remedio())).toBeNull()
    expect(precisaComprar(remedio())).toBe(false)
  })
})

describe('alarmes ignorados', () => {
  it('conta doses que receberam aviso e ficaram sem resposta', () => {
    expect(avisosIgnorados([reg({ avisos: 3 }), reg({ avisos: 1, status: 'tomei' }), reg({ avisos: 0 })])).toBe(1)
  })
})
