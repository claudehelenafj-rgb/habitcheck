import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import {
  adesivosDoAlbum,
  adesivosParaEscolher,
  contagemPorTipo,
  doMes,
  especiaisNovos,
  inclinacao,
  mesesDoAlbum,
  proximoEspecial,
  type DadosAlbum,
} from './album'

const tarefa = (id: string, extra: Partial<Tarefa>): Tarefa => ({ id, titulo: id, prioridade: 'B', passos: [], criadaEm: '', ...extra })
const dados: DadosAlbum = {
  habitos: [
    { id: 'h1', titulo: 'Caminhar', adesivo: 'haltere' },
    { id: 'h2', titulo: 'Arrumar a mesa', adesivo: 'arcoIris' },
  ] as DadosAlbum['habitos'],
  registros: [
    { id: 'h1|2026-10-27', habitoId: 'h1', dia: '2026-10-27', nivel: 'completo', quando: '2026-10-27T13:00:00Z' },
    { id: 'h1|2026-10-29', habitoId: 'h1', dia: '2026-10-29', nivel: 'minimo', quando: '2026-10-29T13:00:00Z', adesivo: 'foguete' },
    { id: 'h2|2026-09-30', habitoId: 'h2', dia: '2026-09-30', nivel: 'completo', quando: '2026-09-30T22:00:00Z' },
    // hábito apagado: o registro órfão não vira adesivo
    { id: 'hx|2026-10-28', habitoId: 'hx', dia: '2026-10-28', nivel: 'completo', quando: '2026-10-28T13:00:00Z' },
  ],
  tarefas: [
    tarefa('Comprar tênis', { area: 'academia', feitaEm: '2026-10-27T12:00:00Z', feitaNoDia: '2026-10-27' }),
    tarefa('Ler o capítulo', { feitaEm: '2026-10-28T15:00:00Z', feitaNoDia: '2026-10-28' }),
    tarefa('Ainda não', {}),
  ],
  rituais: [
    { id: 'manha|2026-10-29', ritual: 'manha', dia: '2026-10-29', comecouEm: '', passo: 'checkin', feitoEm: '2026-10-29T11:05:00Z' },
    // a noite que terminou depois da meia-noite continua no dia do ritual
    { id: 'noite|2026-10-28', ritual: 'noite', dia: '2026-10-28', comecouEm: '', passo: 'checkin', feitoEm: '2026-10-29T03:30:00Z' },
    { id: 'noite|2026-10-29', ritual: 'noite', dia: '2026-10-29', comecouEm: '', passo: 'checkin' },
    // a revisão é guardada pela segunda-feira; o adesivo vai para o dia em que foi feita
    { id: 'revisao|2026-10-26', ritual: 'revisao', dia: '2026-10-26', comecouEm: '', passo: 'semana', feitoEm: '2026-11-01T21:00:00Z' },
  ],
}

describe('álbum de adesivos', () => {
  const lista = adesivosDoAlbum(dados)

  it('hábito feito (o mínimo conta), tarefa concluída e ritual terminado; em ordem', () => {
    expect(lista.map((a) => [a.dia, a.tipo, a.nome, a.titulo || a.ritual, !!a.minimo])).toEqual([
      ['2026-09-30', 'habito', 'arcoIris', 'Arrumar a mesa', false],
      ['2026-10-27', 'tarefa', 'haltere', 'Comprar tênis', false],
      ['2026-10-27', 'habito', 'haltere', 'Caminhar', false],
      ['2026-10-28', 'tarefa', 'estrela', 'Ler o capítulo', false],
      ['2026-10-28', 'ritual', 'lua', 'noite', false],
      ['2026-10-29', 'ritual', 'sol', 'manha', false],
      // o adesivo que o hábito tinha naquele dia fica, mesmo que o hábito troque de adesivo depois
      ['2026-10-29', 'habito', 'foguete', 'Caminhar', true],
      ['2026-11-01', 'ritual', 'calendario', 'revisao', false],
    ])
  })

  it('páginas: do primeiro mês até hoje; sem adesivos, só a de hoje', () => {
    expect(mesesDoAlbum(lista, '2026-11-01')).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(mesesDoAlbum([], '2026-11-01')).toEqual(['2026-11'])
    expect(doMes(lista, '2026-10')).toHaveLength(6)
    expect(contagemPorTipo(doMes(lista, '2026-10'))).toEqual({ habito: 2, tarefa: 2, ritual: 2 })
  })

  it('cada adesivo fica sempre com a mesma inclinação, entre -8 e 8 graus', () => {
    const graus = lista.map((a) => inclinacao(a.id))
    expect(graus).toEqual(lista.map((a) => inclinacao(a.id)))
    expect(graus.every((g) => g >= -8 && g <= 8)).toBe(true)
    expect(new Set(graus).size).toBeGreaterThan(1)
  })
})

describe('adesivos especiais', () => {
  const muitos = (n: number) =>
    adesivosDoAlbum({
      habitos: [{ id: 'h', titulo: 'Água', adesivo: 'copo' }] as DadosAlbum['habitos'],
      registros: Array.from({ length: n }, (_, i) => {
        const dia = new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10)
        return { id: `h|${dia}`, habitoId: 'h', dia, nivel: 'completo' as const, quando: `${dia}T12:00:00Z` }
      }),
      tarefas: [],
      rituais: [],
    })

  it('chegam com o total, com o dia do adesivo que trouxe cada um', () => {
    expect(especiaisNovos(muitos(9), {})).toEqual([])
    expect(especiaisNovos(muitos(10), {})).toEqual([{ nome: 'arcoIris', dia: '2026-09-10' }])
    expect(especiaisNovos(muitos(30), {})).toEqual([
      { nome: 'arcoIris', dia: '2026-09-10' },
      { nome: 'pipa', dia: '2026-09-25' },
    ])
    // o que já foi guardado não chega de novo
    expect(especiaisNovos(muitos(30), { arcoIris: '2026-09-10' })).toEqual([{ nome: 'pipa', dia: '2026-09-25' }])
  })

  it('quanto falta para o próximo; desfazer não tira o que já chegou', () => {
    expect(proximoEspecial(0, {})).toEqual({ nome: 'arcoIris', aos: 10, faltam: 10 })
    expect(proximoEspecial(12, { arcoIris: '2026-09-10' })).toEqual({ nome: 'pipa', aos: 25, faltam: 13 })
    // tinha 10, desfez um: o arco-íris fica, e o próximo continua sendo a pipa
    expect(proximoEspecial(9, { arcoIris: '2026-09-10' })).toEqual({ nome: 'pipa', aos: 25, faltam: 16 })
    const todos = { arcoIris: 'x', pipa: 'x', foguete: 'x', cogumelo: 'x', coroa: 'x', joia: 'x' }
    expect(proximoEspecial(400, todos)).toBeNull()
  })

  it('para o hábito: o adesivo de sempre e os especiais já ganhos', () => {
    expect(adesivosParaEscolher('haltere', {})).toEqual(['haltere'])
    expect(adesivosParaEscolher('haltere', { foguete: 'x', arcoIris: 'x' })).toEqual(['haltere', 'arcoIris', 'foguete'])
  })
})
