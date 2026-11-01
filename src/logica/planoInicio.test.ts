import { describe, expect, it } from 'vitest'
import { diaLocal, diasEntre, somarDias } from './datas'
import {
  alternarArea,
  deveAcolher,
  diaDoPlano,
  diasSemAbrir,
  faseDoDia,
  periodoDoDia,
  retomarPlano,
} from './planoInicio'

describe('datas de calendário', () => {
  it('conta dias atravessando meses e anos', () => {
    expect(diasEntre('2026-10-28', '2026-11-03')).toBe(6)
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3)
    expect(diasEntre('2028-02-28', '2028-03-01')).toBe(2) // ano bissexto
    expect(diasEntre('2026-11-03', '2026-10-28')).toBe(-6)
  })

  it('soma dias atravessando meses', () => {
    expect(somarDias('2026-10-28', 4)).toBe('2026-11-01')
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('usa a data local, não a de Greenwich', () => {
    // 23h30 do dia 28 continua sendo dia 28 para quem está no Brasil
    expect(diaLocal(new Date(2026, 9, 28, 23, 30))).toBe('2026-10-28')
  })
})

describe('plano de 2 semanas', () => {
  it('o dia do início é o dia 1', () => {
    expect(diaDoPlano('2026-10-28', '2026-10-28')).toBe(1)
    expect(diaDoPlano('2026-10-28', '2026-11-03')).toBe(7)
    expect(diaDoPlano('2026-10-28', '2026-11-10')).toBe(14)
  })

  it('nunca devolve dia zero ou negativo', () => {
    expect(diaDoPlano('2026-10-28', '2026-10-20')).toBe(1)
  })

  it('cada dia cai na fase certa do guia', () => {
    const esperado = {
      1: 'despejar',
      2: 'despejar',
      3: 'rituais',
      6: 'rituais',
      7: 'revisao1',
      8: 'estrategia',
      13: 'estrategia',
      14: 'revisao2',
      15: 'concluido',
      40: 'concluido',
    } as const
    for (const [dia, fase] of Object.entries(esperado)) expect(faseDoDia(Number(dia)), `dia ${dia}`).toBe(fase)
  })
})

describe('voltar depois de uns dias', () => {
  it('conta só os dias inteiros sem abrir', () => {
    expect(diasSemAbrir('2026-10-27', '2026-10-28')).toBe(0) // abriu ontem
    expect(diasSemAbrir('2026-10-24', '2026-10-28')).toBe(3)
    expect(diasSemAbrir(undefined, '2026-10-28')).toBe(0) // primeira vez
  })

  it('acolhe a partir de 3 dias sem abrir', () => {
    expect(deveAcolher('2026-10-26', '2026-10-28')).toBe(false)
    expect(deveAcolher('2026-10-24', '2026-10-28')).toBe(true)
    expect(deveAcolher(undefined, '2026-10-28')).toBe(false)
  })

  it('continuar de onde parou: hoje vira o dia seguinte ao último aberto', () => {
    // começou dia 20, abriu pela última vez dia 23 (dia 4), voltou dia 30
    const novoInicio = retomarPlano('2026-10-20', '2026-10-23', '2026-10-30')
    expect(diaDoPlano(novoInicio, '2026-10-30')).toBe(5)
  })

  it('continuar nunca passa do dia 14', () => {
    const novoInicio = retomarPlano('2026-10-01', '2026-10-20', '2026-10-30')
    expect(diaDoPlano(novoInicio, '2026-10-30')).toBe(14)
  })
})

describe('escolha das áreas no primeiro uso', () => {
  it('liga e desliga áreas', () => {
    expect(alternarArea([], 'remedios').selecionadas).toEqual(['remedios'])
    expect(alternarArea(['remedios'], 'remedios').selecionadas).toEqual([])
  })

  it('não deixa passar de 2 e avisa com gentileza', () => {
    const r = alternarArea(['remedios', 'faculdade'], 'quarto')
    expect(r.selecionadas).toEqual(['remedios', 'faculdade'])
    expect(r.passouDoLimite).toBe(true)
  })

  it('desligar uma área no limite sempre funciona', () => {
    const r = alternarArea(['remedios', 'faculdade'], 'faculdade')
    expect(r.selecionadas).toEqual(['remedios'])
    expect(r.passouDoLimite).toBe(false)
  })
})

describe('saudação', () => {
  it('escolhe o período do dia pela hora', () => {
    expect(periodoDoDia(3)).toBe('madrugada')
    expect(periodoDoDia(8)).toBe('manha')
    expect(periodoDoDia(12)).toBe('tarde')
    expect(periodoDoDia(19)).toBe('noite')
  })
})
