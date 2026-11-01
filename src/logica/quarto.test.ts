import { describe, expect, it } from 'vitest'
import {
  alternarItem,
  buscarLugares,
  jaTemCoisa,
  tamanhoReduzido,
  diasSemReset,
  estadoDiaReset,
  maisCincoMinutos,
  MAX_EXTRAS_RESET,
  minutosDoReset,
  segundosDoReset,
  terminarReset,
  zonaSugerida,
  type EstadoReset,
  type ResetQuarto,
  type Zona,
} from './quarto'

const hoje = '2026-10-29'
const zona = (id: string, ordem: number): Zona => ({ id, nome: id, adesivo: 'vassoura', itens: [], ordem })
const reset = (zonaId: string, dia: string): ResetQuarto => ({
  id: `${zonaId}${dia}`,
  zonaId,
  zonaNome: zonaId,
  dia,
  inicio: `${dia}T20:00:00Z`,
  fim: `${dia}T20:10:00Z`,
  minutos: 10,
  feitos: [],
  total: 3,
})

describe('zonas', () => {
  const zonas = [zona('mesa', 0), zona('cama', 1), zona('chao', 2)]

  it('dias sem reset (null = nunca)', () => {
    const rs = [reset('mesa', '2026-10-20'), reset('mesa', '2026-10-27')]
    expect(diasSemReset(rs, 'mesa', hoje)).toBe(2)
    expect(diasSemReset(rs, 'cama', hoje)).toBeNull()
  })

  it('sugere a zona que nunca teve reset, na ordem; depois a que está há mais tempo sem', () => {
    expect(zonaSugerida(zonas, [reset('mesa', '2026-10-28')], hoje)?.id).toBe('cama')
    const todas = [reset('mesa', '2026-10-28'), reset('cama', '2026-10-20'), reset('chao', '2026-10-25')]
    expect(zonaSugerida(zonas, todas, hoje)?.id).toBe('cama')
    expect(zonaSugerida([], [], hoje)).toBeUndefined()
  })

  it('grade da semana: dia com reset, sem reset (neutro) e futuro', () => {
    const rs = [reset('mesa', '2026-10-27')]
    expect(estadoDiaReset(rs, '2026-10-27', hoje)).toBe('feito')
    expect(estadoDiaReset(rs, '2026-10-28', hoje)).toBe('vazio')
    expect(estadoDiaReset(rs, '2026-10-30', hoje)).toBe('futuro')
  })
})

describe('reset de 10 minutos', () => {
  const t0 = new Date('2026-10-29T20:00:00')
  const depois = (min: number) => new Date(t0.getTime() + min * 60_000)
  const e: EstadoReset = { zonaId: 'mesa', inicio: t0.toISOString(), minutos: 10, feitos: [], extras: 0, fase: 'correndo' }

  it('o tempo vem do início (recarregar não perde nada)', () => {
    expect(segundosDoReset(e, t0)).toBe(600)
    expect(segundosDoReset(e, depois(4))).toBe(360)
    expect(segundosDoReset(e, depois(12))).toBe(0)
  })

  it('"mais 5 min" dá 5 minutos inteiros a partir de agora, no máximo 2 vezes', () => {
    let x = maisCincoMinutos(e, depois(10))
    expect(x.minutos).toBe(15)
    // pediu 1 minuto depois do alarme: ainda são 5 minutos pela frente
    x = maisCincoMinutos(x, depois(16))
    expect(x.minutos).toBe(21)
    expect(segundosDoReset(x, depois(16))).toBe(300)
    expect(x.extras).toBe(MAX_EXTRAS_RESET)
    expect(maisCincoMinutos(x, depois(22))).toBe(x)
  })

  it('terminar antes guarda o que passou; depois do tempo, conta só até o fim do tempo', () => {
    expect(minutosDoReset(terminarReset(e, depois(6)), depois(30))).toBe(6)
    const tarde = terminarReset(e, depois(25))
    expect(tarde.fimEm).toBe(depois(10).toISOString())
    expect(minutosDoReset(tarde, depois(30))).toBe(10)
    expect(segundosDoReset(tarde, depois(5))).toBe(0)
  })

  it('marcar e desmarcar itens da zona', () => {
    const x = alternarItem(alternarItem(e, 'papéis'), 'copos')
    expect(x.feitos).toEqual(['papéis', 'copos'])
    expect(alternarItem(x, 'papéis').feitos).toEqual(['copos'])
  })
})

describe('um lugar para cada coisa', () => {
  const l = (coisa: string, onde: string) => ({ id: coisa, coisa, onde, criadoEm: '' })
  const lista = [l('Chave', 'gancho ao lado da porta'), l('carregador', 'gaveta da mesa'), l('Óculos', 'caixinha na mesa de cabeceira')]

  it('procura pela coisa ou pelo lugar, sem acento nem maiúscula, em ordem alfabética', () => {
    expect(buscarLugares(lista, '').map((x) => x.coisa)).toEqual(['carregador', 'Chave', 'Óculos'])
    expect(buscarLugares(lista, 'oculos').map((x) => x.coisa)).toEqual(['Óculos'])
    expect(buscarLugares(lista, 'MESA').map((x) => x.coisa)).toEqual(['carregador', 'Óculos'])
    expect(buscarLugares(lista, 'porta ').map((x) => x.coisa)).toEqual(['Chave'])
    expect(buscarLugares(lista, 'guarda-chuva')).toEqual([])
  })

  it('não repete a mesma coisa', () => {
    expect(jaTemCoisa(lista, ' chave ')).toBe(true)
    expect(jaTemCoisa(lista, 'oculos')).toBe(true)
    expect(jaTemCoisa(lista, 'Chave', 'Chave')).toBe(false)
    expect(jaTemCoisa(lista, 'fone')).toBe(false)
  })

  it('foto reduzida: lado maior até 1024, sem aumentar foto pequena', () => {
    expect(tamanhoReduzido(4032, 3024)).toEqual({ largura: 1024, altura: 768 })
    expect(tamanhoReduzido(3024, 4032)).toEqual({ largura: 768, altura: 1024 })
    expect(tamanhoReduzido(800, 600)).toEqual({ largura: 800, altura: 600 })
  })
})
