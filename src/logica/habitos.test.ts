import { describe, expect, it } from 'vitest'
import {
  alternarPreparo,
  combinadoNoDia,
  deveAvisarVespera,
  deveLembrar,
  diaDoPreparo,
  estadoDoDia,
  metaFeita,
  pendenteHoje,
  preparoCompleto,
  preparoDoDia,
  proximoNivel,
  vezesNaSemana,
  type Habito,
  type RegistroHabito,
} from './habitos'

// 29/10/2026 é quinta-feira; a semana vai de segunda 26/10 a domingo 1/11
const hoje = '2026-10-29'
const habito = (extra: Partial<Habito> = {}): Habito => ({
  id: 'h1',
  titulo: 'Ir à academia',
  area: 'academia',
  adesivo: 'haltere',
  se: 'eu chegar da faculdade',
  entao: 'troco de roupa antes de sentar',
  minima: 'só chegar lá',
  meta: 3,
  dias: [],
  criadoEm: '2026-10-01T10:00:00Z',
  ...extra,
})
const reg = (dia: string, nivel: RegistroHabito['nivel'] = 'completo'): RegistroHabito => ({ id: `h1|${dia}`, habitoId: 'h1', dia, nivel, quando: `${dia}T18:00:00Z` })

describe('hábitos', () => {
  it('dias combinados; sem dias, vale qualquer dia', () => {
    expect(combinadoNoDia({ dias: [] }, hoje)).toBe(true)
    expect(combinadoNoDia({ dias: [1, 3, 5] }, hoje)).toBe(false)
    expect(combinadoNoDia({ dias: [4] }, hoje)).toBe(true)
  })

  it('"X de 7 dias": conta a semana de segunda a domingo, e a versão mínima conta', () => {
    const rs = [reg('2026-10-25'), reg('2026-10-26'), reg('2026-10-28', 'minimo'), reg('2026-11-01'), reg('2026-11-02')]
    expect(vezesNaSemana(rs, hoje)).toBe(3)
    expect(metaFeita(habito(), rs, hoje)).toBe(true)
    expect(metaFeita(habito({ meta: 4 }), rs, hoje)).toBe(false)
  })

  it('pendente hoje: com dias, só nos dias combinados; sem dias, até fazer a meta da semana', () => {
    expect(pendenteHoje(habito({ dias: [4] }), [], hoje)).toBe(true)
    expect(pendenteHoje(habito({ dias: [1, 3] }), [], hoje)).toBe(false)
    expect(pendenteHoje(habito({ dias: [4] }), [reg(hoje, 'minimo')], hoje)).toBe(false)
    expect(pendenteHoje(habito(), [reg('2026-10-26')], hoje)).toBe(true)
    expect(pendenteHoje(habito(), [reg('2026-10-26'), reg('2026-10-27'), reg('2026-10-28')], hoje)).toBe(false)
    expect(pendenteHoje(habito({ arquivadoEm: '2026-10-28T10:00:00Z' }), [], hoje)).toBe(false)
  })

  it('grade da semana: dia sem registro é neutro; não combinado (livre) e futuro só com pontinho', () => {
    const h = habito({ dias: [1, 3, 4] })
    const rs = [reg('2026-10-26'), reg('2026-10-27', 'minimo')]
    expect(estadoDoDia(h, rs, '2026-10-26', hoje)).toBe('feito')
    // terça não estava combinada, mas aconteceu: conta
    expect(estadoDoDia(h, rs, '2026-10-27', hoje)).toBe('minimo')
    expect(estadoDoDia(h, rs, '2026-10-28', hoje)).toBe('vazio')
    expect(estadoDoDia(h, rs, '2026-10-29', hoje)).toBe('vazio')
    expect(estadoDoDia(h, rs, '2026-10-30', hoje)).toBe('livre')
    expect(estadoDoDia(habito(), rs, '2026-10-30', hoje)).toBe('futuro')
    expect(estadoDoDia(h, rs, '2026-10-25', hoje)).toBe('livre')
  })

  it('tocar num dia: nada → feito → mínima → nada', () => {
    expect(proximoNivel(undefined)).toBe('completo')
    expect(proximoNivel('completo')).toBe('minimo')
    expect(proximoNivel('minimo')).toBeUndefined()
  })

  it('lembrete: do horário até 30 min depois, só se ainda não fez', () => {
    const h = habito({ lembrete: '18:00', dias: [4] })
    expect(deveLembrar(h, [], new Date('2026-10-29T17:59:00'))).toBe(false)
    expect(deveLembrar(h, [], new Date('2026-10-29T18:00:00'))).toBe(true)
    expect(deveLembrar(h, [], new Date('2026-10-29T18:30:00'))).toBe(true)
    expect(deveLembrar(h, [], new Date('2026-10-29T18:31:00'))).toBe(false)
    expect(deveLembrar(h, [reg(hoje)], new Date('2026-10-29T18:10:00'))).toBe(false)
    expect(deveLembrar({ ...h, dias: [5] }, [], new Date('2026-10-29T18:10:00'))).toBe(false)
    expect(deveLembrar({ ...h, lembrete: undefined }, [], new Date('2026-10-29T18:10:00'))).toBe(false)
  })
})

describe('base de lançamento e treino acompanhado', () => {
  // quinta 29/10; combinado terça, quinta e sábado
  const h = habito({ dias: [2, 4, 6], base: ['mochila', 'garrafa', 'fone'], companhia: 'colega', vespera: '21:00' })

  it('o preparo é para hoje (antes da noite e se ainda não fez) ou para o próximo dia combinado', () => {
    expect(diaDoPreparo(h, [], new Date('2026-10-29T10:00:00'))).toBe('2026-10-29')
    expect(diaDoPreparo(h, [reg('2026-10-29')], new Date('2026-10-29T10:00:00'))).toBe('2026-10-31')
    // a partir das 18h, é a véspera do próximo
    expect(diaDoPreparo(h, [], new Date('2026-10-29T19:00:00'))).toBe('2026-10-31')
    expect(diaDoPreparo(h, [], new Date('2026-10-30T21:00:00'))).toBe('2026-10-31')
    // qualquer dia: amanhã, à noite
    expect(diaDoPreparo(habito(), [], new Date('2026-10-29T20:00:00'))).toBe('2026-10-30')
  })

  it('marcar itens e o "combinei"; preparo de outro dia não vale', () => {
    let p = alternarPreparo(h, '2026-10-31', 'mochila')
    p = alternarPreparo({ preparo: p }, '2026-10-31', 'garrafa')
    p = alternarPreparo({ preparo: p }, '2026-10-31', 'fone')
    expect(preparoCompleto({ ...h, preparo: p }, '2026-10-31')).toBe(false)
    p = alternarPreparo({ preparo: p }, '2026-10-31', { combinado: true })
    expect(preparoCompleto({ ...h, preparo: p }, '2026-10-31')).toBe(true)
    p = alternarPreparo({ preparo: p }, '2026-10-31', 'fone')
    expect(p.itens).toEqual(['mochila', 'garrafa'])
    expect(preparoDoDia({ preparo: p }, '2026-11-03')).toEqual({ dia: '2026-11-03', itens: [] })
    expect(preparoCompleto(habito(), '2026-10-31')).toBe(true)
  })

  it('aviso da véspera: só se amanhã é combinado e ainda falta preparar', () => {
    expect(deveAvisarVespera(h, new Date('2026-10-30T21:00:00'))).toBe('2026-10-31')
    expect(deveAvisarVespera(h, new Date('2026-10-30T21:31:00'))).toBeNull()
    // quinta à noite: sexta não é combinada
    expect(deveAvisarVespera(h, new Date('2026-10-29T21:10:00'))).toBeNull()
    const pronto = { ...h, preparo: { dia: '2026-10-31', itens: ['mochila', 'garrafa', 'fone'], combinado: true } }
    expect(deveAvisarVespera(pronto, new Date('2026-10-30T21:10:00'))).toBeNull()
    expect(deveAvisarVespera({ ...h, base: [], companhia: undefined }, new Date('2026-10-30T21:10:00'))).toBeNull()
    expect(deveAvisarVespera({ ...h, vespera: undefined }, new Date('2026-10-30T21:10:00'))).toBeNull()
  })
})
