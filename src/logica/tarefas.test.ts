import { describe, expect, it } from 'vitest'
import type { Tarefa } from '../dados/banco'
import {
  agruparTarefas,
  cabeTarefaA,
  passosCompletos,
  progressoPassos,
  proximoPasso,
  separarItens,
  tarefasADoDia,
} from './tarefas'

let n = 0
function tarefa(dados: Partial<Tarefa>): Tarefa {
  n++
  return { id: `t${n}`, titulo: `tarefa ${n}`, prioridade: 'B', passos: [], criadaEm: `2026-10-28T10:00:${String(n).padStart(2, '0')}Z`, ...dados }
}

describe('captura rápida', () => {
  it('cada linha vira um item e linhas vazias somem', () => {
    expect(separarItens('comprar pilha\n\n  mandar e-mail  \n')).toEqual(['comprar pilha', 'mandar e-mail'])
  })

  it('tira marcadores de lista colada', () => {
    expect(separarItens('- um\n* dois\n• três\n1. quatro\n2) cinco\n[ ] seis')).toEqual([
      'um',
      'dois',
      'três',
      'quatro',
      'cinco',
      'seis',
    ])
  })

  it('não estraga texto que só começa com número', () => {
    expect(separarItens('3 ovos')).toEqual(['3 ovos'])
  })

  it('texto vazio não vira nada', () => {
    expect(separarItens('   \n  ')).toEqual([])
  })
})

describe('no máximo 3 tarefas A por dia', () => {
  const hoje = '2026-10-28'
  const tres = [
    tarefa({ prioridade: 'A', dia: hoje }),
    tarefa({ prioridade: 'A', dia: hoje, feitaEm: '2026-10-28T12:00:00Z' }),
    tarefa({ prioridade: 'A', dia: hoje }),
  ]

  it('cabe até 3; a feita também ocupa lugar', () => {
    expect(cabeTarefaA(tres.slice(0, 2), hoje)).toBe(true)
    expect(cabeTarefaA(tres, hoje)).toBe(false)
  })

  it('A de outro dia não conta para hoje', () => {
    expect(cabeTarefaA([...tres.slice(0, 2), tarefa({ prioridade: 'A', dia: '2026-10-27' })], hoje)).toBe(true)
  })

  it('editar uma tarefa que já é A de hoje não esbarra no limite', () => {
    expect(cabeTarefaA(tres, hoje, tres[0].id)).toBe(true)
    expect(tarefasADoDia(tres, hoje, tres[0].id)).toHaveLength(2)
  })
})

describe('agrupar a lista', () => {
  it('separa A de hoje, A de outro dia, B, C e feitas hoje', () => {
    const hoje = '2026-10-28'
    const lista = [
      tarefa({ titulo: 'a hoje', prioridade: 'A', dia: hoje }),
      tarefa({ titulo: 'a ontem', prioridade: 'A', dia: '2026-10-27' }),
      tarefa({ titulo: 'b', prioridade: 'B' }),
      tarefa({ titulo: 'c', prioridade: 'C' }),
      // feita às 22h de 28/10 no Brasil = 01h de 29/10 em UTC: continua sendo "hoje"
      tarefa({ titulo: 'feita hoje', prioridade: 'B', feitaEm: '2026-10-29T01:00:00Z', feitaNoDia: hoje }),
      tarefa({ titulo: 'feita ontem', prioridade: 'C', feitaEm: '2026-10-27T09:00:00Z', feitaNoDia: '2026-10-27' }),
    ]
    const g = agruparTarefas(lista, hoje)
    expect(g.a.map((t) => t.titulo)).toEqual(['a hoje'])
    expect(g.deOutroDia.map((t) => t.titulo)).toEqual(['a ontem'])
    expect(g.b.map((t) => t.titulo)).toEqual(['b'])
    expect(g.c.map((t) => t.titulo)).toEqual(['c'])
    expect(g.feitasHoje.map((t) => t.titulo)).toEqual(['feita hoje'])
  })
})

describe('passos', () => {
  const t = tarefa({
    passos: [
      { id: 'p1', texto: 'abrir o arquivo', feito: true },
      { id: 'p2', texto: 'ler a página 1', pronto: 'li até o fim', feito: false },
      { id: 'p3', texto: 'resumir', feito: false },
    ],
  })

  it('o próximo passo é o primeiro não feito', () => {
    expect(proximoPasso(t)?.id).toBe('p2')
  })

  it('conta o progresso', () => {
    expect(progressoPassos(t)).toEqual({ feitos: 1, total: 3 })
  })

  it('só oferece concluir quando todos os passos estão feitos', () => {
    expect(passosCompletos(t)).toBe(false)
    expect(passosCompletos({ passos: t.passos.map((p) => ({ ...p, feito: true })) })).toBe(true)
    expect(passosCompletos({ passos: [] })).toBe(false)
  })
})
