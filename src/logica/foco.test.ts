import { describe, expect, it } from 'vitest'
import {
  acabouFase,
  blocoSugerido,
  comecarBloco,
  compararEstimativa,
  estimativaAjustada,
  fatorDeEstimativa,
  irParaPausa,
  maisUmPouco,
  MAX_EXTRAS,
  minutosDeFoco,
  novoFoco,
  pausaPara,
  segundosDaFase,
  terminarFoco,
  type SessaoFoco,
} from './foco'

const t0 = new Date('2026-10-29T14:00:00')
const depois = (min: number, de = t0) => new Date(de.getTime() + min * 60_000)
const dados = { titulo: 'Cálculo: estudar limites', passo: 'Abrir o caderno', blocoMin: 25, volta: '/faculdade', som: true }

describe('fases do modo foco', () => {
  it('sem movimento, começa direto no foco; com movimento, 5 min antes', () => {
    expect(novoFoco(dados, t0, false)).toMatchObject({ fase: 'foco', faseMin: 25, focoMin: 0 })
    const mexer = novoFoco(dados, t0, true)
    expect(mexer).toMatchObject({ fase: 'movimento', faseMin: 5 })
    // o movimento não conta como foco
    const foco = comecarBloco(mexer, depois(5))
    expect(foco).toMatchObject({ fase: 'foco', faseMin: 25, focoMin: 0 })
  })

  it('o tempo restante vem do início da fase (recarregar não perde nada)', () => {
    const e = novoFoco(dados, t0, false)
    expect(segundosDaFase(e, t0)).toBe(25 * 60)
    expect(segundosDaFase(e, depois(10))).toBe(15 * 60)
    expect(segundosDaFase(e, depois(40))).toBe(0)
    // relógio da tela um pouco atrás do início: nunca passa do total
    expect(segundosDaFase(e, depois(-0.1))).toBe(25 * 60)
    expect(acabouFase(e, depois(24))).toBe(false)
    expect(acabouFase(e, depois(25))).toBe(true)
  })

  it('o tempo do alarme não vira foco: conta só até o combinado', () => {
    const e = novoFoco(dados, t0, false)
    expect(minutosDeFoco(e, depois(10))).toBe(10)
    expect(minutosDeFoco(e, depois(50))).toBe(25)
  })

  it('"mais 5 min" soma o bloco e para depois de 2 vezes seguidas', () => {
    let e = novoFoco(dados, t0, false)
    e = maisUmPouco(e, depois(26))
    expect(e).toMatchObject({ fase: 'foco', faseMin: 5, extras: 1, focoMin: 25 })
    e = maisUmPouco(e, depois(32))
    expect(e.extras).toBe(MAX_EXTRAS)
    const igual = maisUmPouco(e, depois(38))
    expect(igual).toBe(e)
    expect(minutosDeFoco(e, depois(40))).toBe(35)
  })

  it('pausa de verdade: 5 min (10 depois de um bloco de 45) e não conta como foco', () => {
    expect(pausaPara(25)).toBe(5)
    expect(pausaPara(35)).toBe(5)
    expect(pausaPara(45)).toBe(10)
    let e = novoFoco(dados, t0, false)
    e = irParaPausa(e, depois(25))
    expect(e).toMatchObject({ fase: 'pausa', faseMin: 5, focoMin: 25, extras: 0 })
    e = comecarBloco(e, depois(31))
    expect(e).toMatchObject({ fase: 'foco', faseMin: 25, focoMin: 25 })
    expect(minutosDeFoco(e, depois(41))).toBe(35)
  })

  it('terminar antes guarda só o que passou', () => {
    const e = terminarFoco(novoFoco(dados, t0, false), depois(12))
    expect(e).toMatchObject({ fase: 'fim', focoMin: 12 })
    expect(minutosDeFoco(e, depois(60))).toBe(12)
    expect(terminarFoco(e, depois(70))).toBe(e)
    expect(acabouFase(e, depois(70))).toBe(false)
  })

  it('bloco sugerido pela estimativa', () => {
    expect(blocoSugerido()).toBe(25)
    expect(blocoSugerido(10)).toBe(25)
    expect(blocoSugerido(30)).toBe(35)
    expect(blocoSugerido(45)).toBe(45)
    expect(blocoSugerido(90)).toBe(45)
  })
})

describe('achei × levou', () => {
  it('parecido com folga de 15% (mínimo 3 min)', () => {
    expect(compararEstimativa(25, 27).jeito).toBe('parecido')
    expect(compararEstimativa(10, 13).jeito).toBe('parecido')
    expect(compararEstimativa(10, 14).jeito).toBe('mais')
    expect(compararEstimativa(60, 50).jeito).toBe('menos')
    expect(compararEstimativa(60, 52).jeito).toBe('parecido')
  })

  const sessao = (minutos: number, estimativaMin: number | undefined, fim: string): SessaoFoco => ({
    id: fim,
    dia: '2026-10-29',
    inicio: fim,
    fim,
    minutos,
    estimativaMin,
  })

  it('o fator é a mediana das últimas 10 sessões com estimativa, a partir de 3', () => {
    expect(fatorDeEstimativa([sessao(30, 20, 'a'), sessao(40, 20, 'b')])).toBeUndefined()
    expect(fatorDeEstimativa([sessao(30, 20, 'a'), sessao(40, 20, 'b'), sessao(20, 20, 'c')])).toBe(1.5)
    // sem estimativa ou sem minutos não entra
    expect(fatorDeEstimativa([sessao(30, 20, 'a'), sessao(40, undefined, 'b'), sessao(0, 20, 'c'), sessao(20, 20, 'd')])).toBeUndefined()
    // par: média das duas do meio
    expect(fatorDeEstimativa([sessao(20, 20, 'a'), sessao(30, 20, 'b'), sessao(40, 20, 'c'), sessao(50, 20, 'd')])).toBe(1.8)
    // só as 10 mais recentes
    const antigas = Array.from({ length: 5 }, (_, i) => sessao(100, 10, `0${i}`))
    const recentes = Array.from({ length: 10 }, (_, i) => sessao(20, 20, `1${i}`))
    expect(fatorDeEstimativa([...antigas, ...recentes])).toBe(1)
  })

  it('estimativa ajustada de 5 em 5 minutos', () => {
    expect(estimativaAjustada(20, 1.5)).toBe(30)
    expect(estimativaAjustada(25, 1.3)).toBe(35)
    expect(estimativaAjustada(25, 1.1)).toBe(30)
    expect(estimativaAjustada(5, 0.5)).toBe(5)
  })
})
