import { describe, expect, it } from 'vitest'
import { combinadoNoDia, deveLembrar, estadoDoDia, metaFeita, pendenteHoje, proximoNivel, vezesNaSemana, type Habito, type RegistroHabito } from './habitos'

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
