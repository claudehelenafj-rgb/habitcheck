import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { maisUmPouco, novoFoco } from '../logica/foco'
import { banco } from './banco'
import { encerrarFoco, guardarFoco, marcarAvisoFoco, mudarFoco } from './foco'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

const t0 = new Date('2026-10-29T14:00:00')
const depois = (min: number) => new Date(t0.getTime() + min * 60_000)
const base = { titulo: 'Ler o capítulo 3', passo: 'Abrir o livro', blocoMin: 25, volta: '/hoje', som: false }

describe('modo foco no banco', () => {
  it('o aviso de "acabou" sai uma vez só por fase', async () => {
    const e = novoFoco(base, t0, false)
    await guardarFoco(e)
    const [a, b] = await Promise.all([marcarAvisoFoco(e.faseInicio), marcarAvisoFoco(e.faseInicio)])
    expect([a, b].filter(Boolean)).toHaveLength(1)
    expect(await marcarAvisoFoco(e.faseInicio)).toBe(false)
    // nova fase: pode avisar de novo
    await mudarFoco((x) => maisUmPouco(x, depois(26)))
    expect(await marcarAvisoFoco(depois(26).toISOString())).toBe(true)
  })

  it('encerrar guarda a sessão, soma os minutos na tarefa e põe o "onde parei" como próximo passo', async () => {
    await banco.tarefas.put({
      id: 't1',
      titulo: 'Ler o capítulo 3',
      prioridade: 'A',
      passos: [
        { id: 'p1', texto: 'Separar o livro', feito: true },
        { id: 'p2', texto: 'Fazer o resumo', feito: false },
      ],
      criadaEm: '',
      estimativaMin: 20,
      realMin: 5,
    })
    await guardarFoco(novoFoco({ ...base, tarefaId: 't1', estimativaMin: 20 }, t0, false))
    const sessao = await encerrarFoco({ concluir: false, passoOndeParei: '  Continuar da página 40 ' }, depois(18))
    expect(sessao).toMatchObject({ tarefaId: 't1', minutos: 18, estimativaMin: 20, dia: '2026-10-29' })
    expect(await banco.sessoesFoco.count()).toBe(1)
    const t = await banco.tarefas.get('t1')
    expect(t?.realMin).toBe(23)
    expect(t?.feitaEm).toBeUndefined()
    expect(t?.passos.map((p) => p.texto)).toEqual(['Separar o livro', 'Continuar da página 40', 'Fazer o resumo'])
    expect(await banco.configuracoes.get('foco')).toBeUndefined()
  })

  it('concluir a tarefa no fim; menos de 1 minuto não vira sessão', async () => {
    await banco.tarefas.put({ id: 't2', titulo: 'x', prioridade: 'B', passos: [], criadaEm: '' })
    await guardarFoco(novoFoco({ ...base, tarefaId: 't2' }, t0, false))
    expect(await encerrarFoco({ concluir: true, passoOndeParei: 'não entra' }, depois(0.2))).toBeUndefined()
    const t = await banco.tarefas.get('t2')
    expect(t?.feitaEm).toBeTruthy()
    expect(t?.passos).toEqual([])
    expect(await banco.sessoesFoco.count()).toBe(0)
  })
})
