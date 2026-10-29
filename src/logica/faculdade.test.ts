import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import { lembreteDeHoje, planejarSessoes, proximas, sessoesParaTarefas, type Avaliacao } from './faculdade'

const aval = (id: string, data: string, extra: Partial<Avaliacao> = {}): Avaliacao => ({
  id,
  materia: 'Cálculo',
  tipo: 'prova',
  titulo: 'P1',
  data,
  criadaEm: '',
  ...extra,
})

describe('lembretes de 2 semanas e 3 dias', () => {
  it('só nos dias certos, e nunca depois de concluída', () => {
    expect(lembreteDeHoje(aval('a', '2026-11-12'), '2026-10-29')).toBe(14)
    expect(lembreteDeHoje(aval('a', '2026-11-01'), '2026-10-29')).toBe(3)
    expect(lembreteDeHoje(aval('a', '2026-11-02'), '2026-10-29')).toBeNull()
    expect(lembreteDeHoje(aval('a', '2026-11-01', { feitaEm: 'x' }), '2026-10-29')).toBeNull()
  })

  it('próximas: de hoje em diante, em ordem, sem as concluídas', () => {
    const lista = [aval('c', '2026-11-20'), aval('a', '2026-10-28'), aval('b', '2026-10-29', { hora: '10:00' }), aval('d', '2026-11-01', { feitaEm: 'x' })]
    expect(proximas(lista, '2026-10-29').map((a) => a.id)).toEqual(['b', 'c'])
  })
})

describe('planejamento de trás para frente', () => {
  const base = { inicio: '2026-10-29', porDia: 1 as const, revisao: true }

  it('espalha os conteúdos e guarda a véspera para a revisão', () => {
    // prova dia 8: dias 29 a 7 (10 dias), véspera = 7
    const s = planejarSessoes(['limites', 'derivadas', 'integrais'], '2026-11-08', base)
    expect(s.map((x) => [x.dia, x.conteudos.join('+'), !!x.revisao])).toEqual([
      ['2026-10-29', 'limites', false],
      ['2026-11-01', 'derivadas', false],
      ['2026-11-04', 'integrais', false],
      ['2026-11-07', 'limites+derivadas+integrais', true],
    ])
  })

  it('mais conteúdos do que dias: junta na mesma sessão (1 por dia)', () => {
    const s = planejarSessoes(['a', 'b', 'c', 'd', 'e'], '2026-11-01', base) // dias 29, 30 + véspera 31
    expect(s.filter((x) => !x.revisao).map((x) => [x.dia, x.conteudos.join('')])).toEqual([
      ['2026-10-29', 'ab'],
      ['2026-10-30', 'cde'],
    ])
  })

  it('com 2 por dia, cabem mais sessões', () => {
    const s = planejarSessoes(['a', 'b', 'c', 'd'], '2026-11-01', { ...base, porDia: 2 })
    expect(s.filter((x) => !x.revisao).map((x) => [x.dia, x.conteudos.join('')])).toEqual([
      ['2026-10-29', 'a'],
      ['2026-10-29', 'b'],
      ['2026-10-30', 'c'],
      ['2026-10-30', 'd'],
    ])
  })

  it('prova amanhã: uma revisão hoje; prova hoje: nada a planejar', () => {
    expect(planejarSessoes(['a', 'b'], '2026-10-30', base)).toEqual([{ dia: '2026-10-29', conteudos: ['a', 'b'] }])
    expect(planejarSessoes(['a'], '2026-10-29', base)).toEqual([])
  })

  it('sem revisão, usa até a véspera para estudar', () => {
    const s = planejarSessoes(['a', 'b'], '2026-11-01', { ...base, revisao: false })
    expect(s).toEqual([
      { dia: '2026-10-29', conteudos: ['a'] },
      { dia: '2026-10-30', conteudos: ['b'] },
    ])
  })

  it('sem conteúdos escritos, só a revisão na véspera', () => {
    expect(planejarSessoes(['  '], '2026-11-01', base)).toEqual([{ dia: '2026-10-31', conteudos: [], revisao: true }])
  })
})

describe('sessões viram tarefas', () => {
  const textos = {
    estudo: (m: string, c: string) => `${m}: ${c}`,
    revisao: (m: string, t: string) => `Revisão de ${m} (${t})`,
    passo: (c: string) => `Abrir o material de ${c}`,
    pronto: 'li a primeira página',
  }
  let n = 0
  const id = () => `id${n++}`
  const a = aval('p1', '2026-11-08')

  it('cada sessão vira tarefa da Faculdade, ligada à prova, com primeiro passo e estimativa', () => {
    const [t1, rev] = sessoesParaTarefas(
      a,
      [
        { dia: '2026-10-29', conteudos: ['limites'] },
        { dia: '2026-11-07', conteudos: ['limites'], revisao: true },
      ],
      25,
      [],
      textos,
      id,
      'agora',
    )
    expect(t1).toMatchObject({ titulo: 'Cálculo: limites', area: 'faculdade', prioridade: 'A', dia: '2026-10-29', estimativaMin: 25, avaliacaoId: 'p1' })
    expect(t1.passos[0]).toMatchObject({ texto: 'Abrir o material de limites', pronto: 'li a primeira página', feito: false })
    expect(rev.titulo).toBe('Revisão de Cálculo (P1)')
  })

  it('respeita o limite de 3 tarefas A por dia; o que passa vira B', () => {
    const existentes = [1, 2].map((i) => ({ id: `e${i}`, titulo: 'x', prioridade: 'A', dia: '2026-10-29', passos: [], criadaEm: '' }) as Tarefa)
    const r = sessoesParaTarefas(a, [{ dia: '2026-10-29', conteudos: ['a'] }, { dia: '2026-10-29', conteudos: ['b'] }], 25, existentes, textos, id, '')
    expect(r.map((t) => t.prioridade)).toEqual(['A', 'B'])
  })
})
